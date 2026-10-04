import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, Color, FontSize } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Link, Unlink, ImagePlus, Undo2, Redo2, AlignLeft, AlignCenter, AlignRight, AlignJustify, RemoveFormatting, Trash2, Check, X } from "lucide-react";
import { articleEditorHtml, sanitizeArticleHtml, serializeRichText } from "../lib/parseArticle";
import { directImageUrl, MAX_IMAGE_BYTES } from "../lib/imagePaste";

const ArticleImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: "100%", parseHTML: (element) => element.getAttribute("width"), renderHTML: (attrs) => ({ width: attrs.width ?? "100%" }) },
      pasteId: { default: null, rendered: false },
    };
  },
});
const rasterTypes = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif"]);
const placeholder = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH1sAAAAASUVORK5CYII=";

interface Props {
  initialContent: string;
  onChange: (content: string) => void;
  onPendingChange: (pending: number) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function RichTextEditor({ initialContent, onChange, onPendingChange, onError, disabled }: Props) {
  const [pending, setPending] = useState(0);
  const [dialog, setDialog] = useState<"link" | "image" | null>(null);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [dialogError, setDialogError] = useState("");
  const readers = useRef(new Set<FileReader>());
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onChange, onError });
  callbacks.current = { onChange, onError };

  function insertFile(editor: Editor, file: File) {
    if (!rasterTypes.has(file.type)) { callbacks.current.onError("Choose a PNG, JPEG, GIF, WebP, or AVIF image."); return; }
    if (file.size > MAX_IMAGE_BYTES) { callbacks.current.onError("This image exceeds 10 MB. Use a smaller image or an HTTPS image link."); return; }
    const id = crypto.randomUUID();
    const original = editor.state.selection.content();
    editor.chain().focus().insertContent({ type: "image", attrs: { src: placeholder, alt: "Processing image", pasteId: id } }).run();
    setPending((n) => n + 1);
    callbacks.current.onError("");
    const reader = new FileReader();
    readers.current.add(reader);
    const finish = (src: string | null) => {
      readers.current.delete(reader);
      if (editor.isDestroyed) return;
      // Find the image node by ID so typing and concurrent pastes cannot move it.
      editor.state.doc.descendants((node, position) => {
        if (node.type.name !== "image" || node.attrs.pasteId !== id) return;
        const tr = editor.state.tr;
        if (src) tr.setNodeMarkup(position, undefined, { ...node.attrs, src, alt: "", pasteId: null });
        else tr.replace(position, position + node.nodeSize, original);
        editor.view.dispatch(tr);
        return false;
      });
      setPending((n) => n - 1);
      if (!src) callbacks.current.onError("This image could not be read. Please try again.");
    };
    reader.onload = () => {
      const src = String(reader.result);
      finish(/^data:image\/(png|jpeg|gif|webp|avif);base64,[a-z0-9+/=]+$/i.test(src) ? src : null);
    };
    reader.onerror = () => finish(null);
    reader.readAsDataURL(file);
  }

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4, 5, 6] }, link: { openOnClick: false, protocols: ["https", "http", "mailto"] } }), TextStyle, Color, FontSize, ArticleImage.configure({ allowBase64: true, inline: true }), TextAlign.configure({ types: ["heading", "paragraph"] }), TableKit.configure({ table: { resizable: false } })],
    content: articleEditorHtml(initialContent),
    onUpdate: ({ editor }) => callbacks.current.onChange(editor.isEmpty ? "" : serializeRichText(editor.getHTML())),
    editorProps: {
      attributes: { id: "article-content", role: "textbox", "aria-labelledby": "article-content-label", "aria-multiline": "true", "aria-required": "true", class: "prose-ink rich-text-document" },
      transformPastedHTML: (html) => sanitizeArticleHtml(html, true),
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.items ?? []).filter((item) => item.kind === "file" && item.type.startsWith("image/")).map((item) => item.getAsFile()).filter((file): file is File => !!file);
        if (files.length && editor) { event.preventDefault(); files.forEach((file) => insertFile(editor, file)); return true; }
        const src = directImageUrl(event.clipboardData?.getData("text/plain") ?? "");
        if (src && editor) { event.preventDefault(); editor.chain().focus().setImage({ src }).run(); return true; }
        return false;
      },
      handleDrop: (_view, event, _slice, moved) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith("image/"));
        if (moved || !files.length || !editor) return false;
        event.preventDefault();
        const pos = editor.view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (pos) editor.commands.setTextSelection(pos.pos);
        files.forEach((file) => insertFile(editor, file));
        return true;
      },
    },
  });
  const state = useEditorState({ editor, selector: ({ editor }) => editor ? {
    bold: editor.isActive("bold"), italic: editor.isActive("italic"), underline: editor.isActive("underline"), strike: editor.isActive("strike"),
    bullet: editor.isActive("bulletList"), ordered: editor.isActive("orderedList"), quote: editor.isActive("blockquote"), link: editor.isActive("link"),
    heading: [2, 3, 4, 5, 6].find((level) => editor.isActive("heading", { level })) ?? 0,
    color: editor.getAttributes("textStyle").color ?? "#2d2926", size: editor.getAttributes("textStyle").fontSize ?? "16px",
    align: editor.getAttributes(editor.isActive("heading") ? "heading" : "paragraph").textAlign ?? "left",
    image: editor.isActive("image"), undo: editor.can().undo(), redo: editor.can().redo(),
  } : null });

  useEffect(() => { onPendingChange(pending); }, [pending, onPendingChange]);
  useEffect(() => { editor?.setEditable(!disabled); }, [editor, disabled]);
  useEffect(() => () => { for (const reader of readers.current) { reader.onload = null; reader.onerror = null; reader.abort(); } readers.current.clear(); }, []);
  useEffect(() => { if (dialog) panelRef.current?.querySelector<HTMLInputElement>("input")?.focus(); }, [dialog]);
  if (!editor || !state) return <div role="status">Loading editor...</div>;

  function tool(label: string, icon: ReactNode, action: () => void, active = false, unavailable = false) {
    return <button type="button" className="editor-tool" title={label} aria-label={label} aria-pressed={active} disabled={disabled || unavailable} onMouseDown={(e) => e.preventDefault()} onClick={action}>{icon}</button>;
  }
  function openDialog(kind: "link" | "image") {
    setDialogError(""); setDialog(kind);
    setUrl(editor!.getAttributes(kind === "image" ? "image" : "link")[kind === "image" ? "src" : "href"] ?? "");
    setAlt(editor!.getAttributes("image").alt ?? "");
  }
  function closeDialog() { setDialog(null); editor!.commands.focus(); }
  function updateSelectedImage(attrs: Record<string, string>) {
    const position = editor!.state.selection.from;
    editor!.chain().updateAttributes("image", attrs).setNodeSelection(position).run();
  }
  function applyDialog() {
    try {
      const parsed = new URL(url.trim());
      const protocols = dialog === "image" ? ["https:"] : ["https:", "http:", "mailto:"];
      if (!protocols.includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
      if (dialog === "image") {
        if (editor!.isActive("image")) editor!.chain().focus().updateAttributes("image", { src: parsed.href, alt }).run();
        else editor!.chain().focus().setImage({ src: parsed.href, alt }).run();
      } else editor!.chain().focus().extendMarkRange("link").setLink({ href: parsed.href }).run();
      closeDialog();
    } catch { setDialogError(dialog === "image" ? "Enter a valid HTTPS image URL." : "Enter a valid web or email link."); }
  }
  const image = editor.getAttributes("image");
  const rgb = String(state.color).match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  const color = rgb ? `#${rgb.slice(1).map((n) => Number(n).toString(16).padStart(2, "0")).join("")}` : /^#[a-f0-9]{6}$/i.test(state.color) ? state.color : "#2d2926";
  return <div className="rich-text-editor" aria-busy={pending > 0}>
    <div className="editor-toolbar" role="group" aria-label="Text formatting">
      <select aria-label="Paragraph style" title="Paragraph style" value={state.heading} disabled={disabled} onChange={(e) => {
        const level = Number(e.target.value) as 2 | 3 | 4 | 5 | 6;
        if (level) editor.chain().focus().setHeading({ level }).run(); else editor.chain().focus().setParagraph().run();
      }}><option value={0}>Normal text</option>{[2, 3, 4, 5, 6].map((level) => <option key={level} value={level}>Heading {level - 1}</option>)}</select>
      <select aria-label="Font size" title="Font size" value={state.size} disabled={disabled} onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}>
        {[12, 14, 16, 18, 20, 24, 28, 32].map((size) => <option key={size} value={`${size}px`}>{size}</option>)}
      </select>
      <span className="editor-tool-group">
        {tool("Bold", <Bold size={18} />, () => editor.chain().focus().toggleBold().run(), state.bold)}
        {tool("Italic", <Italic size={18} />, () => editor.chain().focus().toggleItalic().run(), state.italic)}
        {tool("Underline", <Underline size={18} />, () => editor.chain().focus().toggleUnderline().run(), state.underline)}
        {tool("Strikethrough", <Strikethrough size={18} />, () => editor.chain().focus().toggleStrike().run(), state.strike)}
      </span>
      <input className="editor-color" type="color" aria-label="Text color" title="Text color" value={color} disabled={disabled} onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
      <span className="editor-tool-group">
        {tool("Bulleted list", <List size={18} />, () => editor.chain().focus().toggleBulletList().run(), state.bullet)}
        {tool("Numbered list", <ListOrdered size={18} />, () => editor.chain().focus().toggleOrderedList().run(), state.ordered)}
        {tool("Block quote", <Quote size={18} />, () => editor.chain().focus().toggleBlockquote().run(), state.quote)}
      </span>
      <span className="editor-tool-group">
        {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight], ["justify", AlignJustify]] as const).map(([align, Icon]) => <span key={align}>{tool(`Align ${align}`, <Icon size={18} />, () => editor.chain().focus().setTextAlign(align).run(), state.align === align)}</span>)}
      </span>
      <span className="editor-tool-group">
        {tool("Insert link", <Link size={18} />, () => openDialog("link"), state.link)}
        {tool("Remove link", <Unlink size={18} />, () => editor.chain().focus().unsetLink().run(), false, !state.link)}
        {tool("Insert image", <ImagePlus size={18} />, () => openDialog("image"))}
        {tool("Clear formatting", <RemoveFormatting size={18} />, () => editor.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().run())}
      </span>
      <span className="editor-tool-group">
        {tool("Undo", <Undo2 size={18} />, () => editor.chain().focus().undo().run(), false, !state.undo)}
        {tool("Redo", <Redo2 size={18} />, () => editor.chain().focus().redo().run(), false, !state.redo)}
      </span>
    </div>
    {dialog && <div ref={panelRef} className="editor-dialog" role="group" aria-label={dialog === "image" ? "Image settings" : "Link settings"} onKeyDown={(e) => {
      if (e.key === "Escape") { e.preventDefault(); closeDialog(); }
      if (e.key === "Enter") { e.preventDefault(); applyDialog(); }
    }}>
      <label>{dialog === "image" ? "Image URL" : "Link URL"}<input className="field-input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} /></label>
      {dialog === "image" && <label>Alternative text<input className="field-input" value={alt} onChange={(e) => setAlt(e.target.value)} /></label>}
      <div className="editor-dialog-actions">
        {dialog === "image" && <button type="button" className="btn-ghost" onClick={() => inputRef.current?.click()}>Choose image</button>}
        <button type="button" className="editor-tool" title="Apply" aria-label="Apply" onClick={applyDialog}><Check size={18} /></button>
        <button type="button" className="editor-tool" title="Cancel" aria-label="Close image or link settings" onClick={closeDialog}><X size={18} /></button>
      </div>
      {dialogError && <p role="alert" className="alert-error">{dialogError}</p>}
    </div>}
    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" className="sr-only" tabIndex={-1} aria-label="Upload image" onChange={(e) => {
      const file = e.target.files?.[0]; if (file) { closeDialog(); insertFile(editor, file); } e.target.value = "";
    }} />
    <EditorContent editor={editor} />
    {state.image && !image.pasteId && <div className="editor-image-settings" role="group" aria-label="Selected image">
      <label>Image size <select disabled={disabled} aria-label="Image size" value={image.width ?? "100%"} onChange={(e) => updateSelectedImage({ width: e.target.value })}>{[25, 50, 75, 100].map((n) => <option key={n} value={`${n}%`}>{n}%</option>)}</select></label>
      <label>Alternative text <input disabled={disabled} value={image.alt ?? ""} onChange={(e) => updateSelectedImage({ alt: e.target.value })} /></label>
      {tool("Remove image", <Trash2 size={18} />, () => editor.chain().focus().deleteSelection().run())}
    </div>}
    <div className="editor-status" role="status">{pending > 0 ? `Processing ${pending} image(s)...` : `${editor.getText().length.toLocaleString()} characters`}</div>
  </div>;
}
