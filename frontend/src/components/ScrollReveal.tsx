import { useLayoutEffect, useRef, type ReactNode } from "react";

export default function ScrollReveal({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (
      !element ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          element.classList.remove("reveal-pending");
          element.classList.add("visible");
          observer.unobserve(element);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );
    element.classList.add("reveal-pending");
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.classList.remove("reveal-pending");
    };
  }, []);

  return (
    <div ref={ref} className="reveal" style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
