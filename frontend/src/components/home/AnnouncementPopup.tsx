"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Bell, ExternalLink } from "lucide-react";

interface AnnouncementPopupProps {
  announcement: {
    title: string;
    message: string;
    imageUrl?: string | null;
    linkUrl?: string | null;
    linkLabel?: string | null;
    showPopup: boolean;
  } | null;
}

export function AnnouncementPopup({ announcement }: AnnouncementPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!announcement?.showPopup) return;

    // Check if user has already dismissed this popup in this session
    const dismissed = sessionStorage.getItem("shaoor-announcement-dismissed");
    if (dismissed === announcement.title) return;

    // Show popup after a short delay for better UX
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [announcement]);

  if (!announcement?.showPopup || !visible) return null;

  function handleDismiss() {
    setVisible(false);
    sessionStorage.setItem("shaoor-announcement-dismissed", announcement!.title);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 9998,
          animation: "fadeIn 0.3s ease",
        }}
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: "min(92vw, 520px)",
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.3)",
          overflow: "hidden",
          animation: "slideUp 0.35s ease",
        }}
      >
        {/* Navy header bar */}
        <div
          style={{
            background: "#1e3a8a",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ffffff" }}>
            <Bell size={16} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Announcement
            </span>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "4px",
              padding: "4px",
              cursor: "pointer",
              color: "#ffffff",
              display: "flex",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "rgba(255,255,255,0.3)"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "rgba(255,255,255,0.15)"; }}
            aria-label="Close announcement"
          >
            <X size={18} />
          </button>
        </div>

        {/* Image */}
        {announcement.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={announcement.imageUrl}
            alt={announcement.title}
            style={{
              width: "100%",
              maxHeight: "200px",
              objectFit: "cover",
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}

        {/* Content */}
        <div style={{ padding: "24px" }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: "10px",
            lineHeight: 1.3,
          }}>
            {announcement.title}
          </h2>
          <p style={{
            fontSize: "0.9375rem",
            color: "#475569",
            lineHeight: 1.65,
            marginBottom: announcement.linkUrl ? "20px" : "0",
          }}>
            {announcement.message}
          </p>

          {/* CTA Link */}
          {announcement.linkUrl && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href={announcement.linkUrl}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 20px",
                  background: "#1e3a8a",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#1d4ed8"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#1e3a8a"; }}
              >
                <ExternalLink size={14} />
                {announcement.linkLabel || "Learn More"}
              </Link>
              <button
                onClick={handleDismiss}
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  color: "#64748b",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "#f8fafc"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "transparent"; }}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -45%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
