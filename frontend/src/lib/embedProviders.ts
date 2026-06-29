// Frontend media-provider allowlist.
//
// The iframe `src` is ALWAYS constructed here from the original URL — we never
// render HTML returned by the backend. This keeps the trust boundary on the
// client: even if the backend mislabels a URL or returns hostile markup, an
// attacker-controlled iframe can't be injected.

export interface MediaEmbed {
  src: string;
  title: string;
  allow: string;
  /** Aspect ratio as width/height; audio players use a fixed height instead. */
  aspectRatio?: string;
  /** Fixed height in px (Spotify audio players); overrides aspectRatio. */
  height?: number;
}

const YT_ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|svg)$/i;

/**
 * True when a bare URL points at an image file, so the renderer can drop it
 * inline as an <img> (Medium-style) instead of fetching an OpenGraph card.
 * Mirrors buildMediaEmbed's safety stance: only http(s), and the decision is
 * based solely on the pathname extension (query string ignored).
 */
export function isImageUrl(rawUrl: string): boolean {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  return IMAGE_EXT.test(u.pathname);
}

/**
 * Returns iframe config for an allowlisted media URL, or null if the URL is not
 * a recognized provider (caller falls back to a card / plain link).
 */
export function buildMediaEmbed(rawUrl: string): MediaEmbed | null {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;

  const host = u.hostname.toLowerCase().replace(/^www\./, "");

  // YouTube
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com" || host === "youtu.be") {
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (u.pathname === "/watch") id = u.searchParams.get("v");
    else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] ?? null;
    else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] ?? null;
    if (id && /^[\w-]{11}$/.test(id)) {
      return {
        src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`,
        title: "YouTube video player",
        allow: YT_ALLOW,
        aspectRatio: "16 / 9",
      };
    }
    return null;
  }

  // Vimeo
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const segment = u.pathname.split("/").filter(Boolean).pop() ?? "";
    if (/^\d+$/.test(segment)) {
      return {
        src: `https://player.vimeo.com/video/${segment}`,
        title: "Vimeo video player",
        allow: "autoplay; fullscreen; picture-in-picture",
        aspectRatio: "16 / 9",
      };
    }
    return null;
  }

  // Spotify
  if (host === "open.spotify.com") {
    const parts = u.pathname.split("/").filter(Boolean);
    const type = parts[0];
    const id = parts[1];
    const types = ["track", "album", "playlist", "episode", "show", "artist"];
    if (type && id && types.includes(type) && /^[A-Za-z0-9]+$/.test(id)) {
      const tall = type === "album" || type === "playlist" || type === "show" || type === "artist";
      return {
        src: `https://open.spotify.com/embed/${type}/${id}`,
        title: "Spotify player",
        allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
        height: tall ? 352 : 152,
      };
    }
    return null;
  }

  return null;
}
