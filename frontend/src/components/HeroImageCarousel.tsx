import React from "react";

interface HeroImageCarouselProps {
  style?: React.CSSProperties;
}

export default function HeroImageCarousel({ style }: HeroImageCarouselProps) {
  return (
    <img
      src="/hero-kids-tech.jpg"
      alt="Children learning technology together"
      style={{
        gridColumn: "1",
        gridRow: "1 / 3",
        objectFit: "cover",
        borderRadius: "0.75rem",
        width: "100%",
        height: "100%",
        boxShadow: "0 8px 32px rgba(28,25,23,0.12)",
        ...style,
      }}
    />
  );
}
