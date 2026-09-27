"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RotateCcw,
  MessageSquare,
  ShieldCheck,
  Calendar,
  User,
  ArrowDown,
} from "lucide-react";
import styles from "./EditorialDecisionSection.module.css";

interface Props {
  paperId: string;
  paperTitle: string;
  initialStatus: string;
  decisionMessage: string | null;
  decisionBy: string | null;
  decisionAt: string | null;
  authorId?: string;
}

export function EditorialTopBanner({
  paperId,
  initialStatus,
  decisionMessage,
  decisionBy,
}: {
  paperId: string;
  initialStatus: string;
  decisionMessage: string | null;
  decisionBy: string | null;
}) {
  if (!decisionMessage && initialStatus !== "REJECTED" && initialStatus !== "ACCEPTED") {
    return null;
  }

  const isRejected = initialStatus === "REJECTED" || initialStatus === "REVISION_REQUESTED";
  const isAccepted = initialStatus === "ACCEPTED" || initialStatus === "PUBLISHED";

  return (
    <div
      className={`${styles.paperAlertBanner} ${
        isRejected
          ? styles.bannerRejected
          : isAccepted
          ? styles.bannerAccepted
          : styles.bannerSubmitted
      }`}
      role="alert"
    >
      <div className={styles.bannerLeft}>
        <div className={styles.bannerIconWrap}>
          {isRejected ? (
            <AlertTriangle size={20} />
          ) : isAccepted ? (
            <CheckCircle size={20} />
          ) : (
            <Clock size={20} />
          )}
        </div>
        <div>
          <div className={styles.bannerTitle}>
            {isRejected
              ? "Editorial Review: Revision Required / Denied"
              : isAccepted
              ? "Editorial Review: Accepted for Publication"
              : "Editorial Status Update"}
          </div>
          <div className={styles.bannerSubtitle}>
            {isRejected
              ? `The editorial board (${decisionBy || "Editorial Reviewer"}) has evaluated this paper and requested revisions. Please see the reviewer's message below.`
              : isAccepted
              ? "This manuscript has completed peer review and has been officially approved by the editorial committee."
              : "Review complete."}
          </div>
        </div>
      </div>
      <a href="#editorial-review" className={styles.bannerActionBtn}>
        <span>View Reviewer's Message</span>
        <ArrowDown size={14} />
      </a>
    </div>
  );
}

export function EditorialBottomSection({
  paperId,
  paperTitle,
  initialStatus,
  decisionMessage,
  decisionBy,
  decisionAt,
  authorId,
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [resubmitted, setResubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If there is no decision message and the status is just standard draft/submitted without review history,
  // we don't display the full review box unless there is a decision
  if (!decisionMessage && status !== "REJECTED" && status !== "ACCEPTED") {
    return null;
  }

  const isRejected = status === "REJECTED" || status === "REVISION_REQUESTED";
  const isAccepted = status === "ACCEPTED" || status === "PUBLISHED";
  const isAuthorOrAdmin =
    Boolean(session?.user?.id && (session.user.id === authorId || (session.user as any)?.role === "ADMIN" || (session.user as any)?.role === "DESIGNER"));

  const formattedDate = decisionAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(decisionAt))
    : "Recently";

  async function handleResubmit() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/papers/${paperId}/resubmit`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resubmit paper");
      }

      setStatus("SUBMITTED");
      setResubmitted(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during resubmission.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="editorial-review" className={styles.section} aria-label="Editorial Evaluation">
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <div className={styles.sectionIconBadge}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className={styles.sectionTitle}>Editorial Peer Review & Evaluation</h2>
            <p className={styles.sectionSubtitle}>Official editorial decision and peer reviewer remarks</p>
          </div>
        </div>

        <div>
          {isRejected && (
            <span className={`${styles.statusPill} ${styles.pillRejected}`}>
              <AlertTriangle size={12} />
              Revision Required / Denied
            </span>
          )}
          {isAccepted && (
            <span className={`${styles.statusPill} ${styles.pillAccepted}`}>
              <CheckCircle size={12} />
              Approved / Accepted
            </span>
          )}
          {status === "SUBMITTED" && (
            <span className={`${styles.statusPill} ${styles.pillSubmitted}`}>
              <Clock size={12} />
              Resubmitted for Review
            </span>
          )}
        </div>
      </div>

      {/* Review metadata card */}
      <div className={styles.detailsCard}>
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Reviewer</span>
            <span className={styles.metaValue}>
              <User size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              {decisionBy || "Senior Editorial Reviewer"}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Decision Date</span>
            <span className={styles.metaValue}>
              <Calendar size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              {formattedDate}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Evaluation Outcome</span>
            <span className={styles.metaValue}>
              {isRejected
                ? "Manuscript Denied — Detailed Revision Required"
                : isAccepted
                ? "Manuscript Approved for Final Publication"
                : "Awaiting Re-evaluation"}
            </span>
          </div>
        </div>

        {/* Official reviewer's message */}
        <div className={styles.messageBox}>
          <div className={styles.messageHeader}>
            <MessageSquare size={16} />
            <span>Reviewer's Formal Message & Feedback:</span>
          </div>
          <div
            className={`${styles.messageContent} ${
              isAccepted ? styles.messageContentAccepted : ""
            }`}
          >
            {decisionMessage || "No additional comments provided by the reviewer."}
          </div>
        </div>
      </div>

      {/* Resubmission section */}
      {isRejected && (
        <div className={styles.resubmitBox}>
          <div className={styles.resubmitInfo}>
            <div className={styles.resubmitTitle}>
              <RotateCcw size={18} />
              <span>Submit for Review Again</span>
            </div>
            <p className={styles.resubmitDesc}>
              Have you made the requested revisions and addressed the reviewer's feedback?
              You can resubmit this manuscript back to the peer review queue for evaluation.
            </p>
          </div>

          <div>
            <button
              onClick={handleResubmit}
              disabled={loading}
              className={styles.resubmitBtn}
              id="btn-resubmit-for-review"
            >
              {loading ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  <span>Resubmitting...</span>
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  <span>Submit for Review Again</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {resubmitted && (
        <div className={styles.resubmitSuccess}>
          <CheckCircle size={18} />
          <span>
            Manuscript successfully resubmitted! It has been returned to the editorial review queue with status: <strong>SUBMITTED</strong>.
          </span>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 16, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 14 }}>
          {error}
        </div>
      )}
    </section>
  );
}
