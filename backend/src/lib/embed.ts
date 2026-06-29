import dns from "dns/promises";
import ipaddr from "ipaddr.js";
import { parse as parseHtmlDoc } from "node-html-parser";

// ---------------------------------------------------------------------------
// Embed metadata resolver.
//
// Given an admin-supplied URL, returns metadata the frontend renders as a rich
// preview card or (for allowlisted providers) an inline media player.
//
// SECURITY: this endpoint fetches arbitrary URLs, so it must never become an
// internal-network probe (SSRF). The fetch path validates scheme, port, and —
// critically — every resolved IP against a public-unicast-only allowlist, and
// re-validates on each redirect hop. Ambiguous numeric hostnames (octal /
// decimal / hex IP literals) are rejected outright to avoid parser-differential
// attacks where Node and our validator disagree on what host gets contacted.
// ---------------------------------------------------------------------------

export interface EmbedResult {
  type: "card" | "video";
  title?: string | null;
  description?: string | null;
  image?: string | null;
  provider?: string | null;
  embedHtml?: string | null;
}

/** Thrown for policy violations (invalid/blocked URLs). Maps to HTTP 400. */
export class EmbedError extends Error {}

const TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;
const MAX_BYTES = 512 * 1024; // only the <head> is needed; keep it small
const USER_AGENT = "BlogSiteEmbedBot/1.0 (+https://letterofforgiveness.com)";

// Strict dotted-quad with no leading zeros (rejects octal-looking octets).
const STRICT_IPV4 =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

// ---------------------------------------------------------------------------
// URL normalization (cache key)
// ---------------------------------------------------------------------------

const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|mc_eid$|igshid$)/i;

export function normalizeUrl(rawUrl: string): string {
  const u = new URL(rawUrl); // throws on invalid — caller guards
  u.hash = "";
  u.hostname = u.hostname.toLowerCase();
  for (const key of [...u.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) u.searchParams.delete(key);
  }
  return u.toString();
}

// ---------------------------------------------------------------------------
// SSRF guard
// ---------------------------------------------------------------------------

/** True only for public, routable unicast addresses. */
function isPublicIp(ip: string): boolean {
  let addr: ReturnType<typeof ipaddr.parse>;
  try {
    addr = ipaddr.parse(ip);
  } catch {
    return false;
  }
  if (addr.kind() === "ipv6") {
    const v6 = addr as ipaddr.IPv6;
    // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1) — check the embedded v4.
    if (v6.isIPv4MappedAddress()) {
      return isPublicIp(v6.toIPv4Address().toString());
    }
    return v6.range() === "unicast";
  }
  return (addr as ipaddr.IPv4).range() === "unicast";
}

/**
 * Validate a single URL is safe to fetch. Resolves DNS and checks every IP.
 * Throws EmbedError on any policy violation.
 */
async function assertSafeUrl(rawUrl: string): Promise<void> {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    throw new EmbedError("Invalid URL");
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new EmbedError("Only http(s) URLs are allowed");
  }
  if (u.username || u.password) {
    throw new EmbedError("URLs with credentials are not allowed");
  }
  if (u.port && u.port !== "80" && u.port !== "443") {
    throw new EmbedError("Only ports 80 and 443 are allowed");
  }

  const host = u.hostname.toLowerCase();

  // Clean IPv4 literal → validate directly.
  if (STRICT_IPV4.test(host)) {
    if (!isPublicIp(host)) throw new EmbedError("Blocked: non-public address");
    return;
  }

  // IPv6 literal (URL hostname has no brackets but contains colons).
  if (host.includes(":")) {
    if (!ipaddr.IPv6.isValid(host) || !isPublicIp(host)) {
      throw new EmbedError("Blocked: non-public address");
    }
    return;
  }

  // Ambiguous numeric forms (octal/decimal/hex IP literals) — reject outright
  // to prevent parser-differential SSRF.
  if (/^[0-9.]+$/.test(host) || /^0x/i.test(host)) {
    throw new EmbedError("Blocked: ambiguous numeric host");
  }

  // Obvious-internal hostnames.
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan") ||
    !host.includes(".") // single-label
  ) {
    throw new EmbedError("Blocked: internal hostname");
  }

  // DNS hostname → resolve and validate every address.
  let records: { address: string }[];
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    throw new EmbedError("DNS resolution failed");
  }
  if (records.length === 0) throw new EmbedError("DNS resolution failed");
  for (const { address } of records) {
    if (!isPublicIp(address)) {
      throw new EmbedError("Blocked: resolves to a non-public address");
    }
  }
}

/**
 * Fetch a URL with SSRF guards: per-hop validation, manual redirects, timeout,
 * content-type and body-size caps. Returns the decoded HTML body.
 *
 * NOTE (pragmatic approach): we re-resolve and fetch the original hostname, so a
 * tiny DNS-rebinding window exists between validation and connect. For full
 * immunity, upgrade to an undici Agent with a custom `connect` that pins the
 * validated IP while preserving SNI/Host. Acceptable here given low traffic and
 * the public-article constraint on inputs.
 */
async function safeFetch(rawUrl: string): Promise<string> {
  let current = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeUrl(current);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      });
    } finally {
      clearTimeout(timer);
    }

    // Manual redirect handling — re-validate the next hop.
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Redirect without Location");
      if (hop === MAX_REDIRECTS) throw new Error("Too many redirects");
      current = new URL(location, current).toString();
      continue;
    }

    if (!res.ok) throw new Error(`Upstream responded ${res.status}`);

    const contentType = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      throw new Error("Not an HTML document");
    }

    const declaredLength = Number(res.headers.get("content-length") ?? "0");
    if (declaredLength > MAX_BYTES) throw new Error("Body too large");

    return await readCapped(res);
  }

  throw new Error("Too many redirects");
}

/** Stream the body, aborting once MAX_BYTES is exceeded. */
async function readCapped(res: Response): Promise<string> {
  if (!res.body) return await res.text();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.length;
        if (total > MAX_BYTES) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }
  const merged = new Uint8Array(total > MAX_BYTES ? MAX_BYTES : total);
  let offset = 0;
  for (const chunk of chunks) {
    if (offset + chunk.length > merged.length) {
      merged.set(chunk.subarray(0, merged.length - offset), offset);
      break;
    }
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder("utf-8").decode(merged);
}

// ---------------------------------------------------------------------------
// HTML / Open Graph parsing
// ---------------------------------------------------------------------------

function clamp(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function parseHtml(html: string, baseUrl: string): EmbedResult {
  // Bound parsing work to the <head>.
  const headEnd = html.toLowerCase().indexOf("</head>");
  const head = headEnd === -1 ? html : html.slice(0, headEnd + 7);
  const root = parseHtmlDoc(head);

  const meta = (selector: string): string | undefined => {
    const el = root.querySelector(selector);
    return el?.getAttribute("content") ?? undefined;
  };

  const title =
    clamp(meta('meta[property="og:title"]'), 300) ??
    clamp(meta('meta[name="twitter:title"]'), 300) ??
    clamp(root.querySelector("title")?.text, 300);

  const description =
    clamp(meta('meta[property="og:description"]'), 1000) ??
    clamp(meta('meta[name="twitter:description"]'), 1000) ??
    clamp(meta('meta[name="description"]'), 1000);

  let image: string | undefined =
    meta('meta[property="og:image"]') ??
    meta('meta[property="og:image:secure_url"]') ??
    meta('meta[name="twitter:image"]') ??
    root.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href") ??
    "/favicon.ico";

  // Resolve relative image URLs and enforce http(s).
  if (image) {
    try {
      const resolved = new URL(image, baseUrl);
      image = resolved.protocol === "http:" || resolved.protocol === "https:" ? resolved.toString() : undefined;
    } catch {
      image = undefined;
    }
  }

  const provider = clamp(meta('meta[property="og:site_name"]'), 100) ?? new URL(baseUrl).hostname;

  return {
    type: "card",
    title: title ?? new URL(baseUrl).hostname,
    description: description ?? null,
    image: image ?? null,
    provider,
  };
}

// ---------------------------------------------------------------------------
// Provider allowlist (deterministic, no fetch)
// ---------------------------------------------------------------------------

function videoEmbed(provider: string, embedUrl: string, title: string): EmbedResult {
  const embedHtml = `<iframe src="${embedUrl}" title="${title}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  return { type: "video", provider, title, embedHtml };
}

/** Returns a video EmbedResult for allowlisted providers, else null. */
export function detectProvider(rawUrl: string): EmbedResult | null {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");

  // YouTube
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com" || host === "youtu.be") {
    let id: string | null = null;
    if (host === "youtu.be") {
      id = u.pathname.slice(1);
    } else if (u.pathname === "/watch") {
      id = u.searchParams.get("v");
    } else if (u.pathname.startsWith("/shorts/")) {
      id = u.pathname.split("/")[2] ?? null;
    } else if (u.pathname.startsWith("/embed/")) {
      id = u.pathname.split("/")[2] ?? null;
    }
    if (id && /^[\w-]{11}$/.test(id)) {
      return videoEmbed("YouTube", `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`, "YouTube video");
    }
    return null;
  }

  // Vimeo
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const segment = u.pathname.split("/").filter(Boolean).pop() ?? "";
    if (/^\d+$/.test(segment)) {
      return videoEmbed("Vimeo", `https://player.vimeo.com/video/${segment}`, "Vimeo video");
    }
    return null;
  }

  // Spotify
  if (host === "open.spotify.com") {
    const parts = u.pathname.split("/").filter(Boolean);
    const [type, id] = parts;
    const types = ["track", "album", "playlist", "episode", "show", "artist"];
    if (type && id && types.includes(type) && /^[A-Za-z0-9]+$/.test(id)) {
      return videoEmbed("Spotify", `https://open.spotify.com/embed/${type}/${id}`, "Spotify");
    }
    return null;
  }

  // X/Twitter intentionally fall through to a card (v1: no third-party scripts).
  return null;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * Resolve embed metadata for a URL. Throws EmbedError for invalid/blocked input
 * (caller returns 400). For valid-but-unreachable URLs, returns a minimal
 * fallback card so reader pages degrade gracefully.
 */
export async function resolveEmbed(rawUrl: string): Promise<EmbedResult> {
  // Validate basic URL shape early (also surfaces a clean 400).
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new EmbedError("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new EmbedError("Only http(s) URLs are allowed");
  }

  // Allowlisted media providers are deterministic — no fetch, no SSRF surface.
  const provider = detectProvider(rawUrl);
  if (provider) return provider;

  // General case: SSRF-guarded fetch + OG parse. Policy violations (EmbedError)
  // propagate as 400; transient fetch/parse failures degrade to a basic card.
  await assertSafeUrl(rawUrl);
  try {
    const html = await safeFetch(rawUrl);
    return parseHtml(html, rawUrl);
  } catch {
    return {
      type: "card",
      title: parsed.hostname,
      description: null,
      image: null,
      provider: parsed.hostname,
    };
  }
}
