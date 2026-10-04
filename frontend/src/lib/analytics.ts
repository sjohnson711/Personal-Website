import { API_BASE } from "./api";

export function privacyOptOut(): boolean {
  return navigator.doNotTrack === "1" || (window as any).doNotTrack === "1" || (navigator as any).globalPrivacyControl === true;
}
export function deviceCategory(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  return /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) ? "tablet" : /Mobile|iPhone|iPod/i.test(ua) ? "mobile" : "desktop";
}
export function externalReferrer(): string | null {
  try {
    const url = new URL(document.referrer);
    const host = url.hostname.toLowerCase();
    const domain = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;
    return url.origin !== window.location.origin && domain.test(host) ? host : null;
  }
  catch { return null; }
}
export async function recordPageView(path: string, referrerHost: string | null): Promise<void> {
  if (privacyOptOut()) return;
  // One random event ID, no cookie/localStorage/sessionStorage identifiers.
  const body = JSON.stringify({ id: crypto.randomUUID(), path, referrerHost, device: deviceCategory() });
  const send = () => fetch(`${API_BASE}/analytics/pageviews`, { method: "POST", credentials: "omit", keepalive: true,
    headers: { "Content-Type": "application/json", "X-Requested-With": "PersonalWebsite" }, body });
  try { await send(); } catch { try { await send(); } catch { /* analytics never blocks reading */ } }
}
