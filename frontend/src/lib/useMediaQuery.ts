import { useEffect, useState } from "react";

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = "mobile" | "tablet" | "desktop" | "wide";

function readMatch(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => readMatch(query));

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}

export function useBreakpoint(): Breakpoint {
  const isWide = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const isTablet = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);

  if (isWide) return "wide";
  if (isDesktop) return "desktop";
  if (isTablet) return "tablet";
  return "mobile";
}
