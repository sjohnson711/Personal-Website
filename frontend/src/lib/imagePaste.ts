export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_ARTICLE_BYTES = 32 * 1024 * 1024;

export function directImageUrl(text: string): string | null {
  try {
    const url = new URL(text.trim());
    return url.protocol === "https:" && !url.username && !url.password && /\.(png|jpe?g|gif|webp|avif)$/i.test(url.pathname) ? url.href : null;
  } catch { return null; }
}
