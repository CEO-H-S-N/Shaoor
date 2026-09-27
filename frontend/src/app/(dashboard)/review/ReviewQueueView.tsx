"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  BookOpen,
  Eye,
  XCircle,
  Send,
  MessageSquare,
  FileText,
  FileCheck,
} from "lucide-react";
import styles from "./page.module.css";

export interface ReviewPaperItem {
  id: string;
  title: string;
  abstract: string;
  category: string;
  authorName: string;
  authorEmail: string;
  submittedAt: string;
  daysInQueue: number;
  status: string;
  version: number;
  decisionMessage?: string | null;
  decisionBy?: string | null;
  decisionAt?: string | null;
  figuresCount: number;
}

interface Props {
  initialPapers: ReviewPaperItem[];
}

export function ReviewQueueView({ initialPapers }: Props) {
  const [papers, setPapers] = useState<ReviewPaperItem[]>(initialPapers);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PENDING" | "ACCEPTED" | "REJECTED">("ALL");
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Compute live stats
  const stats = {
    total: papers.length,
    pending: papers.filter((p) => ["SUBMITTED", "UNDER_REVIEW"].includes(p.status)).length,
    accepted: papers.filter((p) => ["ACCEPTED", "PUBLISHED"].includes(p.status)).length,
    rejected: papers.filter((p) => ["REJECTED", "REVISION_REQUESTED"].includes(p.status)).length,
  };

  const filteredPapers = papers.filter((p) => {
    if (activeFilter === "PENDING") return ["SUBMITTED", "UNDER_REVIEW"].includes(p.status);
    if (activeFilter === "ACCEPTED") return ["ACCEPTED", "PUBLISHED"].includes(p.status);
    if (activeFilter === "REJECTED") return ["REJECTED", "REVISION_REQUESTED"].includes(p.status);
    return true;
  });

  // Approve action
  async function handleApprove(paperId: string) {
    if (!confirm("Are you sure you want to APPROVE this manuscript for publication?")) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/papers/${paperId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve manuscript");

      setPapers((prev) =>
        prev.map((p) =>
          p.id === paperId
            ? {
                ...p,
                status: "ACCEPTED",
                decisionMessage: "Approved by Editorial Review Board",
                decisionBy: "Admin Reviewer",
                decisionAt: new Date().toISOString(),
              }
            : p
        )
      );

      alert(`Paper approved successfully! The author has received an acceptance notification.`);
    } catch (err: any) {
      alert(err.message || "Approval failed");
    } finally {
      setSubmitting(false);
    }
  }

  // Deny submission
  async function handleDenySubmit(paperId: string) {
    if (!denyReason.trim() || denyReason.trim().length < 5) {
      alert("Please provide a detailed reason (at least 5 characters) explaining why this paper was denied.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/papers/${paperId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DENY", reason: denyReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to deny manuscript");

      setPapers((prev) =>
        prev.map((p) =>
          p.id === paperId
            ? {
                ...p,
                status: "REJECTED",
                decisionMessage: denyReason.trim(),
                decisionBy: "Admin Reviewer",
                decisionAt: new Date().toISOString(),
              }
            : p
        )
      );

      setDenyingId(null);
      setDenyReason("");
      alert(`Paper has been denied. An official notification with your feedback has been sent to the author.`);
    } catch (err: any) {
      alert(err.message || "Failed to process denial");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>Review Queue</h1>
          <p>
            {stats.pending} paper{stats.pending !== 1 ? "s" : ""} awaiting peer evaluation &amp; editorial decisions
          </p>
        </div>
      </div>

      {/* ── Stats Strip ────────────────────────────────────── */}
      <div className={styles.statsStrip}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.total}</div>
          <div className={styles.statLabel}>Total in Queue</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber} style={{ color: "#d97706" }}>
            {stats.pending}
          </div>
          <div className={styles.statLabel}>Awaiting Review</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber} style={{ color: "#15803d" }}>
            {stats.accepted}
          </div>
          <div className={styles.statLabel}>Approved / Accepted</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber} style={{ color: "#dc2626" }}>
            {stats.rejected}
          </div>
          <div className={styles.statLabel}>Denied / Needs Revision</div>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.filterTab} ${activeFilter === "ALL" ? styles.filterTabActive : ""}`}
            onClick={() => setActiveFilter("ALL")}
          >
            All Papers ({stats.total})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${activeFilter === "PENDING" ? styles.filterTabActive : ""}`}
            onClick={() => setActiveFilter("PENDING")}
          >
            Awaiting Decision ({stats.pending})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${activeFilter === "ACCEPTED" ? styles.filterTabActive : ""}`}
            onClick={() => setActiveFilter("ACCEPTED")}
          >
            Approved ({stats.accepted})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${activeFilter === "REJECTED" ? styles.filterTabActive : ""}`}
            onClick={() => setActiveFilter("REJECTED")}
          >
            Denied ({stats.rejected})
          </button>
        </div>
      </div>

      {/* ── Papers List ─────────────────────────────────────── */}
      <div className={styles.papersList}>
        {filteredPapers.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <CheckCircle size={32} />
            </div>
            <div className={styles.emptyTitle}>No manuscripts found</div>
            <p className={styles.emptyText}>There are currently no manuscripts in this queue category.</p>
          </div>
        ) : (
          filteredPapers.map((paper) => {
            const isPending = ["SUBMITTED", "UNDER_REVIEW"].includes(paper.status);
            const isAccepted = ["ACCEPTED", "PUBLISHED"].includes(paper.status);
            const isRejected = ["REJECTED", "REVISION_REQUESTED"].includes(paper.status);

            return (
              <div key={paper.id} className={styles.paperCard} id={`review-card-${paper.id}`}>
                <div className={styles.paperMain}>
                  {/* Status row */}
                  <div className={styles.paperMeta1}>
                    {isPending ? (
                      <span className={`${styles.badge} ${styles.badgeSubmitted}`}>
                        <Clock size={10} />
                        Awaiting Decision
                      </span>
                    ) : isAccepted ? (
                      <span className={`${styles.badge} ${styles.badgeAccepted}`}>
                        <CheckCircle size={10} />
                        Approved
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeRejected}`}>
                        <XCircle size={10} />
                        Denied
                      </span>
                    )}

                    <span className={`${styles.badge} ${styles.badgeCategory}`}>
                      {paper.category}
                    </span>

                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      v{paper.version}
                    </span>

                    {paper.figuresCount > 0 && (
                      <span style={{ fontSize: "0.75rem", color: "#1e3a8a", fontWeight: 600 }}>
                        {paper.figuresCount} Figure{paper.figuresCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Title & Abstract */}
                  <h2 className={styles.paperTitle}>{paper.title}</h2>
                  <p className={styles.paperAbstract}>{paper.abstract}</p>

                  {/* Author metadata */}
                  <div className={styles.paperMeta2}>
                    <span>
                      <User size={12} />
                      {paper.authorName} ({paper.authorEmail})
                    </span>
                    <span>
                      <Calendar size={12} />
                      {paper.submittedAt}
                    </span>
                    <span>
                      <Clock size={12} />
                      {paper.daysInQueue} day{paper.daysInQueue !== 1 ? "s" : ""} in queue
                    </span>
                  </div>

                  {/* Decision note if already decided */}
                  {paper.decisionMessage && (
                    <div
                      className={`${styles.decisionNote} ${
                        isAccepted ? styles.decisionNoteApproved : styles.decisionNoteDenied
                      }`}
                    >
                      <div style={{ fontWeight: 700, marginBottom: "2px" }}>
                        {isAccepted ? "Approval Note:" : "Denial Reason:"}
                      </div>
                      <div>{paper.decisionMessage}</div>
                      {paper.decisionBy && (
                        <div style={{ fontSize: "10px", marginTop: "4px", opacity: 0.8 }}>
                          Decision by {paper.decisionBy} • {paper.decisionAt ? new Date(paper.decisionAt).toLocaleDateString() : ""}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Deny Reason Box (collapsible) */}
                  {denyingId === paper.id && (
                    <div className={styles.reasonModal}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontWeight: 700, fontSize: "0.8125rem", color: "#991b1b" }}>
                        <MessageSquare size={14} />
                        State Reason for Denial (Sent to Author):
                      </div>
                      <textarea
                        className={styles.reasonTextarea}
                        placeholder="Explain specifically what revisions or requirements were not met (e.g., experimental control data, plagiarism similarity, citation formatting)..."
                        value={denyReason}
                        onChange={(e) => setDenyReason(e.target.value)}
                        autoFocus
                      />
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setDenyingId(null);
                            setDenyReason("");
                          }}
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.75rem",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            cursor: "pointer",
                            color: "#475569",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleDenySubmit(paper.id)}
                          className={styles.btnDeny}
                        >
                          <XCircle size={13} />
                          {submitting ? "Sending Decision..." : "Confirm Denial & Notify Author"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions column */}
                <div className={styles.paperActions}>
                  <Link href={`/papers/${paper.id}`} target="_blank" className={styles.btnView}>
                    <Eye size={12} />
                    View Paper
                  </Link>

                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      disabled={submitting || isAccepted}
                      onClick={() => handleApprove(paper.id)}
                      className={styles.btnApprove}
                      id={`approve-btn-${paper.id}`}
                      title="Approve manuscript for publication"
                    >
                      <CheckCircle size={12} />
                      Approve
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        if (denyingId === paper.id) {
                          setDenyingId(null);
                        } else {
                          setDenyingId(paper.id);
                          setDenyReason("");
                        }
                      }}
                      className={styles.btnDeny}
                      id={`deny-btn-${paper.id}`}
                      title="Deny manuscript and send reason to author"
                    >
                      <XCircle size={12} />
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
