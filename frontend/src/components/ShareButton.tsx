import { useState } from "react";

interface ShareButtonProps {
  title: string;
  excerpt: string;
}

export default function ShareButton({ title, excerpt }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const url = window.location.href;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: excerpt,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }
  };

  const shareLinks = [
    {
      name: "Twitter",
      icon: "𝕏",
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: "#000000",
    },
    {
      name: "LinkedIn",
      icon: "in",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "#0A66C2",
    },
    {
      name: "Facebook",
      icon: "f",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "#1877F2",
    },
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "0.65rem 1.3rem",
          borderRadius: "0.5rem",
          background: "rgba(184,150,46,0.12)",
          border: "1px solid rgba(184,150,46,0.3)",
          color: "#7A5C10",
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 600,
          fontSize: "0.85rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          transition: "all 200ms ease",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = "rgba(184,150,46,0.2)";
          (e.target as HTMLElement).style.borderColor = "rgba(184,150,46,0.5)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = "rgba(184,150,46,0.12)";
          (e.target as HTMLElement).style.borderColor = "rgba(184,150,46,0.3)";
        }}
      >
        <span>Share</span>
        <span style={{ opacity: 0.6 }}>↗</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.75rem)",
            right: 0,
            background: "rgba(15,27,53,0.98)",
            border: "1px solid rgba(184,150,46,0.2)",
            borderRadius: "0.75rem",
            padding: "0.75rem",
            minWidth: "200px",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {/* @ts-expect-error - navigator.share is available in some browsers */}
            {navigator?.share && (
              <>
                <button
                  onClick={handleNativeShare}
                  style={{
                    padding: "0.65rem 1rem",
                    background: "transparent",
                    border: "none",
                    color: "#FFF7ED",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    textAlign: "left",
                    borderRadius: "0.4rem",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = "rgba(184,150,46,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = "transparent";
                  }}
                >
                  Share via…
                </button>
                <div
                  style={{
                    height: "1px",
                    background: "rgba(184,150,46,0.15)",
                    margin: "0.25rem 0",
                  }}
                />
              </>
            )}

            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "0.65rem 1rem",
                  background: "transparent",
                  color: "#FFF7ED",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  borderRadius: "0.4rem",
                  transition: "background 150ms ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = "rgba(184,150,46,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = "transparent";
                }}
              >
                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  {link.name === "Twitter" ? "𝕏" : link.name === "LinkedIn" ? "in" : "f"}
                </span>
                {link.name}
              </a>
            ))}

            <div
              style={{
                height: "1px",
                background: "rgba(184,150,46,0.15)",
                margin: "0.25rem 0",
              }}
            />

            <button
              onClick={handleCopyLink}
              style={{
                padding: "0.65rem 1rem",
                background: "transparent",
                border: "none",
                color: copied ? "#40916C" : "#FFF7ED",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: "0.85rem",
                cursor: "pointer",
                textAlign: "left",
                borderRadius: "0.4rem",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  (e.target as HTMLElement).style.background = "rgba(184,150,46,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "transparent";
              }}
            >
              {copied ? "✓ Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      )}

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
}
