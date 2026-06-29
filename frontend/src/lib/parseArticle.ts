import { Marked, type Token } from "marked";

// Dedicated marked instance with safety/a11y overrides:
//   - escapes raw HTML in article bodies (defense-in-depth XSS guard)
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
  const tokens = articleMarked.lexer(markdown);
  // The reflink map lives on the token list; sliced runs need it to render.
  const links = (tokens as { links?: Record<string, unknown> }).links ?? {};

  const segments: ArticleSegment[] = [];
  let run: Token[] = [];

  const flush = () => {
    if (run.length === 0) return;
    const runTokens = run as Token[] & { links: Record<string, unknown> };
    runTokens.links = links;
    segments.push({ kind: "html", html: articleMarked.parser(runTokens) });
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
