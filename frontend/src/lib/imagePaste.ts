import { useLayoutEffect, useRef, useState, useEffect, type RefObject, type ClipboardEvent } from "react";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_ARTICLE_BYTES = 8 * 1024 * 1024;
const rasterTypes = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif"]);
export function directImageUrl(text: string): string | null {
  try {
    const url = new URL(text.trim());
    return url.protocol === "https:" && !url.username && !url.password && /\.(png|jpe?g|gif|webp|avif)$/i.test(url.pathname) ? url.href : null;
  } catch { return null; }
}
export function useImagePaste(ref: RefObject<HTMLTextAreaElement | null>, content: string, setContent: (value: string) => void, setError: (value: string) => void) {
  const [pending, setPending] = useState(0);
  const caret = useRef<[number, number] | null>(null);
  const readers = useRef(new Set<FileReader>());
  useEffect(() => () => { for (const reader of readers.current) { reader.onload = null; reader.onerror = null; reader.abort(); } readers.current.clear(); }, []);
  useLayoutEffect(() => {
    if (caret.current && ref.current && document.activeElement === ref.current) ref.current.setSelectionRange(...caret.current);
    caret.current = null;
  }, [content, ref]);
  function insert(textarea: HTMLTextAreaElement, snippet: string) {
    textarea.setRangeText(snippet, textarea.selectionStart, textarea.selectionEnd, "end");
    caret.current = [textarea.selectionStart, textarea.selectionEnd];
    setContent(textarea.value);
  }
  function paste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const file = Array.from(event.clipboardData.items).find((item) => item.kind === "file" && item.type.startsWith("image/"))?.getAsFile();
    if (!file) {
      const url = directImageUrl(event.clipboardData.getData("text/plain"));
      if (url) { event.preventDefault(); insert(event.currentTarget, `\n\n![](<${url}>)\n\n`); }
      return;
    }
    event.preventDefault();
    if (!rasterTypes.has(file.type)) { setError("Paste a PNG, JPEG, GIF, WebP, or AVIF image. SVG images are not supported."); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError("This image exceeds 2 MB. Use a smaller image or an HTTPS image link."); return; }
    const textarea = event.currentTarget;
    const original = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    const marker = `[Processing image ${crypto.randomUUID()}]`;
    // A synchronous anchor follows later edits instead of using a stale offset.
    insert(textarea, marker);
    setError("");
    setPending((n) => n + 1);
    const reader = new FileReader();
    readers.current.add(reader);
    const finish = (snippet: string, error?: string) => {
      readers.current.delete(reader);
      const current = ref.current;
      if (!current) return;
      const position = current.value.indexOf(marker);
      if (position >= 0) {
        const delta = snippet.length - marker.length;
        const adjust = (offset: number) => offset <= position ? offset : offset >= position + marker.length ? offset + delta : position + snippet.length;
        caret.current = [adjust(current.selectionStart), adjust(current.selectionEnd)];
        setContent(current.value.slice(0, position) + snippet + current.value.slice(position + marker.length));
      }
      setPending((n) => n - 1);
      if (error) setError(error);
    };
    reader.onload = () => {
      const uri = String(reader.result);
      if (!/^data:image\/(png|jpeg|gif|webp|avif);base64,[a-z0-9+/=]+$/i.test(uri)) { finish(original, "This image could not be read. Please try again."); return; }
      finish(`\n\n![](${uri})\n\n`);
    };
    reader.onerror = () => finish(original, "This image could not be read. Please try again.");
    reader.readAsDataURL(file);
  }
  return { paste, pending };
}
