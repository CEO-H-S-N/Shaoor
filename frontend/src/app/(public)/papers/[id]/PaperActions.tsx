"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Share2,
  Eye,
  Check,
  Copy,
  ExternalLink,
  X,
  Mail,
  FileText,
  Printer,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

interface Props {
  paperId: string;
  title: string;
  initialViews: number;
  initialDownloads: number;
  fileUrl?: string | null;
  fileName?: string | null;
  citation: string;
  doi?: string;
  authors: { name: string; institution?: string }[];
  publishedAt: string;
  abstract?: string;
  category?: string;
}

export function PaperActions({
  paperId,
  title,
  initialViews,
  initialDownloads,
  fileUrl,
  fileName,
  citation,
  doi,
  authors,
  publishedAt,
  abstract,
  category,
}: Props) {
  const [views, setViews] = useState(initialViews);
  const [downloads, setDownloads] = useState(initialDownloads);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // ─── Live View Counter ──────────────────────────────────────
  useEffect(() => {
    // Record view in DB and get live count
    const sessionKey = `shaoor_view_${paperId}`;
    const hasViewed = sessionStorage.getItem(sessionKey);

    if (!hasViewed) {
      // First view in this browser session -> increment count in DB
      fetch(`/api/papers/${paperId}/view`, { method: "POST" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.views === "number") {
            setViews(data.views);
            if (typeof data.downloads === "number") {
              setDownloads(data.downloads);
            }
            sessionStorage.setItem(sessionKey, "1");
          }
        })
        .catch(() => {});
    } else {
      // Already viewed in this session -> get current live view count
      fetch(`/api/papers/${paperId}/view`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.views === "number") {
            setViews(data.views);
            if (typeof data.downloads === "number") {
              setDownloads(data.downloads);
            }
          }
        })
        .catch(() => {});
    }
  }, [paperId]);

  // ─── Download PDF Handler ───────────────────────────────────
  async function handleDownload() {
    setIsDownloading(true);

    // Increment download counter in DB
    fetch(`/api/papers/${paperId}/download`, { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.downloads === "number") {
          setDownloads(data.downloads);
        } else {
          setDownloads((d) => d + 1);
        }
      })
      .catch(() => {
        setDownloads((d) => d + 1);
      });

    try {
      if (fileUrl && fileUrl.startsWith("http")) {
        // Trigger download of uploaded manuscript
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = fileName || `${title.slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Generate an elegant, publication-quality printable manuscript window/download
        generateAndPrintManuscript();
      }
    } finally {
      setTimeout(() => setIsDownloading(false), 800);
    }
  }

  function generateAndPrintManuscript() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const authorText = authors.map((a) => `${a.name} (${a.institution || "Independent Scholar"})`).join(", ");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} — Shaoor Publication</title>
          <style>
            @page { size: letter; margin: 1in; }
            body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #111; max-width: 750px; margin: 0 auto; padding: 20px; }
            .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; font-family: sans-serif; font-size: 12px; color: #64748b; }
            .title { font-size: 26px; font-weight: bold; margin-bottom: 12px; color: #0f172a; line-height: 1.25; }
            .authors { font-size: 15px; margin-bottom: 20px; font-weight: 500; color: #1e3a8a; }
            .meta { font-family: sans-serif; font-size: 12px; color: #475569; margin-bottom: 24px; background: #f8fafc; padding: 10px; border-radius: 4px; }
            .abstract-heading { font-weight: bold; font-size: 16px; margin-bottom: 8px; text-transform: uppercase; font-family: sans-serif; letter-spacing: 0.05em; color: #1e3a8a; }
            .abstract { font-style: italic; margin-bottom: 28px; line-height: 1.7; text-align: justify; }
            .citation-box { background: #f1f5f9; padding: 14px; font-family: monospace; font-size: 12px; border-left: 3px solid #1e3a8a; margin-top: 36px; }
            .footer { border-top: 1px solid #e2e8f0; margin-top: 40px; padding-top: 14px; font-family: sans-serif; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <span>Shaoor Open Research · Peer-Reviewed Academic Manuscript</span>
            <span>DOI: ${doi || "Pending"}</span>
          </div>

          <h1 class="title">${title}</h1>
          <div class="authors">${authorText}</div>

          <div class="meta">
            <strong>Discipline:</strong> ${category || "General Science"} &nbsp;|&nbsp;
            <strong>Published:</strong> ${publishedAt} &nbsp;|&nbsp;
            <strong>Status:</strong> Peer-Reviewed Open Access (CC BY 4.0)
          </div>

          <div class="abstract-heading">Abstract</div>
          <div class="abstract">${abstract || "No abstract provided."}</div>

          <div class="citation-box">
            <strong>Recommended Citation:</strong><br/>
            ${citation}
          </div>

          <div class="footer">
            Published on Shaoor.org · Certified Cryptographic Preservation · Open Access
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // ─── Share Modal & Web Share ─────────────────────────────────
  async function handleShare() {
    const shareUrl = typeof window !== "undefined" ? window.location.href : `https://shaoor.org/papers/${paperId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Read "${title}" on Shaoor Academic Platform`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fall back to modal if cancelled or unsupported
      }
    }

    setIsShareModalOpen(true);
  }

  function copyLinkToClipboard() {
    const url = typeof window !== "undefined" ? window.location.href : `https://shaoor.org/papers/${paperId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function copyCitationToClipboard() {
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  }

  const currentUrl = typeof window !== "undefined" ? window.location.href : `https://shaoor.org/papers/${paperId}`;

  return (
    <>
      {/* ─── Metrics Bar with Live Counters ─── */}
      <div className={styles.metrics} id="paper-live-metrics">
        <span className={styles.metric}>
          <Eye size={14} style={{ color: "#1e3a8a" }} />
          <strong className={styles.metricValue} id="live-view-count">
            {views.toLocaleString()}
          </strong>{" "}
          views
        </span>
        <span className={styles.metric}>
          <Download size={14} style={{ color: "#10b981" }} />
          <strong className={styles.metricValue} id="live-download-count">
            {downloads.toLocaleString()}
          </strong>{" "}
          downloads
        </span>
      </div>

      {/* ─── Action Buttons ─── */}
      <div className={styles.actionRow}>
        <Button
          variant="primary"
          size="md"
          id={`download-paper-${paperId}`}
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download size={16} />
          {isDownloading ? "Preparing PDF..." : "Download PDF"}
        </Button>

        <Button
          variant="secondary"
          size="md"
          id={`share-paper-${paperId}`}
          onClick={handleShare}
        >
          <Share2 size={16} />
          Share
        </Button>
      </div>

      {/* ─── Share Paper Modal ─── */}
      {isShareModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              maxWidth: "500px",
              width: "100%",
              padding: "24px",
              position: "relative",
              animation: "fadeIn 150ms ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Share2 size={18} color="#1e3a8a" />
                <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#0f172a" }}>
                  Share Publication
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0 0 16px 0", lineHeight: 1.4 }}>
              <strong>{title}</strong>
            </p>

            {/* Direct Link Copy */}
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Permanent URL
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "0.8125rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    backgroundColor: "#f8fafc",
                    color: "#334155",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={copyLinkToClipboard}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    backgroundColor: copiedLink ? "#10b981" : "#1e3a8a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                  id="copy-link-modal-btn"
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLink ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Social & Academic Channels */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Share via
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this research: "${title}"`)}&url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "#0f172a",
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={14} color="#1d9bf0" />
                  X (Twitter)
                </a>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "#0f172a",
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={14} color="#0a66c2" />
                  LinkedIn
                </a>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`"${title}" - Read on Shaoor: ${currentUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "#0f172a",
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={14} color="#25d366" />
                  WhatsApp
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent(`Scholarly Research: ${title}`)}&body=${encodeURIComponent(`I wanted to share this paper with you:\n\n"${title}"\n\nRead the full paper here: ${currentUrl}\n\nCitation:\n${citation}`)}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "#0f172a",
                    textDecoration: "none",
                  }}
                >
                  <Mail size={14} color="#64748b" />
                  Email Colleague
                </a>
              </div>
            </div>

            {/* Quick Citation Copy */}
            <div
              style={{
                paddingTop: "14px",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Need the citation format?
              </span>
              <button
                type="button"
                onClick={copyCitationToClipboard}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "none",
                  border: "none",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: copiedCitation ? "#10b981" : "#1e3a8a",
                  cursor: "pointer",
                }}
              >
                {copiedCitation ? <Check size={14} /> : <Copy size={14} />}
                {copiedCitation ? "Citation Copied!" : "Copy Citation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Interactive Copy Citation Button for Sidebar ────────────
export function CopyCitationButton({ citation }: { citation: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      id="copy-citation-sidebar-btn"
      onClick={handleCopy}
      style={{
        marginTop: "var(--space-3)",
        width: "100%",
        color: copied ? "#10b981" : undefined,
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Citation Copied!" : "Copy Citation"}
    </Button>
  );
}
