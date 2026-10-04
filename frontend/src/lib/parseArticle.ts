import { Marked, type Token } from "marked";
import DOMPurify from "dompurify";

const rasterData = /^data:image\/(?:png|jpeg|gif|webp|avif);base64,[a-z0-9+/=]+$/i;
export function sanitizeArticleHtml(html: string, richText = false): string {
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ["style", "form", "input", "button", "iframe"], FORBID_ATTR: richText ? ["id", "name"] : ["style", "id", "name"] });
  const doc = new DOMParser().parseFromString(clean, "text/html");
  // Retain only editor formatting, never arbitrary pasted CSS or attributes.
  doc.querySelectorAll<HTMLElement>("[style]").forEach((node) => {
    const color = node.style.color;
    const size = node.style.fontSize;
    const align = node.style.textAlign;
    node.removeAttribute("style");
    if (node.tagName === "SPAN") {
      if (/^(#[a-f0-9]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(color)) node.style.color = color;
      if (["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"].includes(size)) node.style.fontSize = size;
    }
    if (/^(P|H[2-6])$/.test(node.tagName) && ["left", "center", "right", "justify"].includes(align)) node.style.textAlign = align;
  });
  doc.querySelectorAll("*").forEach((node) => {
    for (const attr of Array.from(node.attributes)) {
      if (attr.name.startsWith("data-") || attr.name === "class") node.removeAttribute(attr.name);
    }
  });
  doc.querySelectorAll("a[href], img[src]").forEach((node) => {
    const attr = node.tagName === "IMG" ? "src" : "href";
    const value = node.getAttribute(attr) ?? "";
    let allowed = attr === "src" && rasterData.test(value);
    try {
      const url = new URL(value, window.location.origin);
      allowed ||= attr === "src" ? url.protocol === "https:" || (url.origin === window.location.origin && !value.startsWith("data:")) : ["https:", "http:", "mailto:"].includes(url.protocol);
      if (url.username || url.password) allowed = false;
    } catch { /* remove malformed URLs */ }
    if (!allowed) node.removeAttribute(attr);
    if (node.tagName === "IMG") {
      if (!richText || !["25%", "50%", "75%", "100%"].includes(node.getAttribute("width") ?? "")) node.removeAttribute("width");
      node.removeAttribute("height");
      node.setAttribute("loading", "lazy"); node.setAttribute("decoding", "async");
    }
    if (node.tagName === "A") node.setAttribute("rel", "noopener noreferrer");
  });
  return doc.body.innerHTML;
}

function richTextHtml(content: string): string | null {
  if (!content.trimStart().startsWith("{")) return null;
  try {
    const data = JSON.parse(content);
    return data?.format === "richtext-v1" && typeof data.html === "string" ? data.html : null;
  } catch { return null; }
}

export function articleEditorHtml(content: string): string {
  const rich = richTextHtml(content);
  return rich === null ? sanitizeArticleHtml(articleMarked.parse(content) as string) : sanitizeArticleHtml(rich, true);
}

export function serializeRichText(html: string): string {
  return JSON.stringify({ format: "richtext-v1", html: sanitizeArticleHtml(html, true) });
}

// Dedicated marked instance with safety/a11y overrides:
//   - removes raw HTML; sanitizes compiled HTML before rendering
//   - downgrades markdown headings by one level so the page <h1> (article title)
//     stays the sole h1 and screen-reader heading hierarchy isn't broken.
// Shared by the article renderer and the segment parser so behavior is identical.
export const articleMarked = new Marked({
  renderer: {
    html() {
      return "";
    },
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const level = Math.min(depth + 1, 6);
      return `<h${level}>${text}</h${level}>`;
    },
  },
});

// A rendered article is an ordered list of segments: markdown HTML runs (injected
// as today) interleaved with rich embeds (rendered as React components).
export type ArticleSegment =
  | { kind: "html"; html: string }
  | { kind: "embed"; url: string };

/**
 * A paragraph that is *solely* a bare URL becomes an embed. We inspect the
 * parsed inline children rather than regex over raw text: an autolinked bare URL
 * is a single `link` token whose text === href, whereas `[label](url)` has
 * text !== href and a mid-sentence URL has sibling tokens — so neither is
 * matched. This is exactly the Notion/Ghost "link on its own line unfurls" rule.
 */
function bareUrlOf(token: Token): string | null {
  if (token.type !== "paragraph") return null;
  const inline = (token as { tokens?: Token[] }).tokens;
  if (!inline || inline.length !== 1) return null;
  const child = inline[0] as { type: string; href?: string; text?: string };
  if (child.type !== "link" || !child.href || child.text !== child.href) return null;
  if (!/^https?:\/\/\S+$/.test(child.href)) return null;
  return child.href;
}

export function parseArticle(markdown: string): ArticleSegment[] {
  const rich = richTextHtml(markdown);
  if (rich !== null) {
    const doc = new DOMParser().parseFromString(sanitizeArticleHtml(rich, true), "text/html");
    const segments: ArticleSegment[] = [];
    let html = "";
    for (const node of Array.from(doc.body.childNodes)) {
      const text = node.textContent?.trim() ?? "";
      const paragraph = node instanceof HTMLElement && node.tagName === "P";
      const soleLink = paragraph && node.children.length === 1 && node.firstElementChild?.tagName === "A" && node.firstElementChild.getAttribute("href") === text;
      if (paragraph && (node.children.length === 0 || soleLink) && /^https?:\/\/\S+$/.test(text)) {
        if (html) segments.push({ kind: "html", html });
        html = "";
        segments.push({ kind: "embed", url: text });
      } else {
        const wrapper = doc.createElement("div");
        wrapper.append(node.cloneNode(true));
        html += wrapper.innerHTML;
      }
    }
    if (html) segments.push({ kind: "html", html });
    return segments;
  }
  const tokens = articleMarked.lexer(markdown);
  // The reflink map lives on the token list; sliced runs need it to render.
  const links = (tokens as { links?: Record<string, unknown> }).links ?? {};

  const segments: ArticleSegment[] = [];
  let run: Token[] = [];

  const flush = () => {
    if (run.length === 0) return;
    const runTokens = run as Token[] & { links: Record<string, unknown> };
    runTokens.links = links;
    segments.push({ kind: "html", html: sanitizeArticleHtml(articleMarked.parser(runTokens)) });
    run = [];
  };

  for (const token of tokens) {
    const url = bareUrlOf(token);
    if (url) {
      flush();
      segments.push({ kind: "embed", url });
    } else {
      run.push(token);
    }
  }
  flush();

  return segments;
}
