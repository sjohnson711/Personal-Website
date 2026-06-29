import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { buildMediaEmbed, type MediaEmbed } from "../lib/embedProviders";

interface EmbedData {
  type: "card" | "video";
  title?: string | null;
  description?: string | null;
  image?: string | null;
  provider?: string | null;
}

type Status = "loading" | "ready" | "error";

/**
 * Renders a bare URL as a rich preview card or an inline media player.
 * - Media players are built from the frontend allowlist (never from backend HTML).
 * - Any failure degrades to a plain clickable link, so a reader never sees a
 *   broken box and the URL is always reachable.
 */
export default function EmbedBlock({ url }: { url: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<EmbedData | null>(null);

  // Compute the media embed synchronously — it doesn't depend on the network.
  const media: MediaEmbed | null = buildMediaEmbed(url);

  useEffect(() => {
    // Allowlisted media players don't need backend metadata.
    if (media) {
      setStatus("ready");
      return;
    }
    let active = true;
    setStatus("loading");
    api
      .get(`/embed?url=${encodeURIComponent(url)}`)
      .then((d: EmbedData) => {
        if (!active) return;
        setData(d);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [url, media]);

  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* keep raw url */
  }

  // Media player.
  if (media) {
    const style = media.height
      ? { height: `${media.height}px` }
      : { aspectRatio: media.aspectRatio ?? "16 / 9" };
    return (
      <div className="embed-media" style={style}>
        <iframe
          src={media.src}
          title={media.title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow={media.allow}
          allowFullScreen
        />
      </div>
    );
  }

  if (status === "loading") {
    return <div className="embed-skeleton" aria-busy="true" aria-label="Loading preview" />;
  }

  if (status === "error" || !data) {
    return (
      <a className="embed-fallback" href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    );
  }

  // Preview card.
  const title = data.title || host;
  return (
    <a
      className="embed-card"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={data.provider ? `${title} — ${data.provider}` : title}
    >
      {data.image && (
        <img
          className="embed-card__thumb"
          src={data.image}
          alt=""
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <div className="embed-card__body">
        <span className="embed-card__title">{title}</span>
        {data.description && <span className="embed-card__desc">{data.description}</span>}
        <span className="embed-card__meta">{data.provider || host}</span>
      </div>
    </a>
  );
}
