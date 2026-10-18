"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./managePapers.module.css";
import {
  FileText,
  Search,
  Trash2,
  ExternalLink,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Filter,
} from "lucide-react";
import { PasswordConfirmModal } from "@/components/ui/PasswordConfirmModal";

export interface ManagedPaper {
  id: string;
  title: string;
  slug?: string | null;
  status: string;
  abstract?: string | null;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  author: {
    id?: string;
    name: string | null;
    email: string | null;
  };
  category: {
    id?: string;
    name: string;
    slug: string;
  } | null;
  journal?: {
    id: string;
    title: string;
    slug?: string | null;
  } | null;
}

interface ManagePapersViewProps {
  papers: ManagedPaper[];
  isMaster: boolean;
}

export function ManagePapersView({ papers: initialPapers, isMaster }: ManagePapersViewProps) {
  const router = useRouter();
  const [papers, setPapers] = useState<ManagedPaper[]>(initialPapers);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Deletion modal state
  const [paperToDelete, setPaperToDelete] = useState<ManagedPaper | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      // Status filter
      if (statusFilter !== "ALL" && paper.status.toUpperCase() !== statusFilter) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = paper.title.toLowerCase().includes(q);
      const matchAuthor = (paper.author?.name || "").toLowerCase().includes(q) ||
                          (paper.author?.email || "").toLowerCase().includes(q);
      const matchCategory = (paper.category?.name || "").toLowerCase().includes(q);
      const matchJournal = (paper.journal?.title || "").toLowerCase().includes(q);
      const matchId = paper.id.toLowerCase().includes(q);

      return matchTitle || matchAuthor || matchCategory || matchJournal || matchId;
    });
  }, [papers, searchQuery, statusFilter]);

  // Compute stats
  const stats = useMemo(() => {
    const total = papers.length;
    const published = papers.filter((p) => p.status === "PUBLISHED" || p.status === "ACCEPTED").length;
    const underReview = papers.filter((p) => p.status === "UNDER_REVIEW" || p.status === "SUBMITTED").length;
    const categorized = papers.filter((p) => !!p.journal).length;
    return { total, published, underReview, categorized };
  }, [papers]);

  const handleDeleteConfirm = async (password: string) => {
    if (!paperToDelete) return;
    setIsDeleting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/papers/${paperToDelete.id}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete paper");
      }

      // Remove from list
      setPapers((prev) => prev.filter((p) => p.id !== paperToDelete.id));
      setFeedback({
        type: "success",
        msg: `"${paperToDelete.title}" has been permanently deleted from the platform.`,
      });
      setPaperToDelete(null);
      router.refresh();
    } catch (err: any) {
      setFeedback({
        type: "error",
        msg: err.message || "Failed to delete paper. Please check your credentials.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "PUBLISHED":
      case "ACCEPTED":
        return styles.statusPublished;
      case "UNDER_REVIEW":
        return styles.statusReview;
      case "SUBMITTED":
        return styles.statusSubmitted;
      case "REJECTED":
        return styles.statusRejected;
      default:
        return styles.statusDraft;
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Breadcrumb */}
      <div className={styles.topBar}>
        <div className={styles.breadcrumbs}>
          <Link href="/admin/journals" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Journals
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.currentCrumb}>Manage & Delete Papers</span>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/journals" className={styles.refreshBtn}>
            <BookOpen size={15} /> Categorize into Journals
          </Link>
        </div>
      </div>

      {/* Header Info */}
      <div className={styles.headerBlock}>
        <div className={styles.badge}>
          <FileText size={14} /> Master Admin Paper Repository
        </div>
        <h1 className={styles.title}>All Manuscripts & Papers</h1>
        <p className={styles.subtitle}>
          Search across all submitted, reviewed, and published research articles on Shaoor. Master admins can preview, categorize, or permanently delete papers from the database.
        </p>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Total Manuscripts</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.published}</span>
          <span className={styles.statLabel}>Published / Accepted</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.underReview}</span>
          <span className={styles.statLabel}>Under Review / Submitted</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.categorized}</span>
          <span className={styles.statLabel}>Assigned to Journals</span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={feedback.type === "success" ? styles.alertSuccess : styles.alertError}
          style={
            feedback.type === "error"
              ? {
                  background: "#fef2f2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "0.88rem",
                }
              : undefined
          }
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search papers by title, author name, email, category, or journal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterTabs}>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4, marginRight: 4 }}>
            <Filter size={13} /> Status:
          </span>
          {["ALL", "PUBLISHED", "ACCEPTED", "UNDER_REVIEW", "SUBMITTED", "DRAFT"].map((status) => (
            <button
              key={status}
              type="button"
              className={`${styles.filterBtn} ${statusFilter === status ? styles.filterBtnActive : ""}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === "ALL" ? "All Papers" : status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Papers Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.papersTable}>
          <thead>
            <tr>
              <th style={{ width: "42%" }}>Paper & Details</th>
              <th style={{ width: "20%" }}>Author</th>
              <th style={{ width: "14%" }}>Status</th>
              <th style={{ width: "12%" }}>Engagement</th>
              <th style={{ width: "12%", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPapers.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyNotice}>
                  <p style={{ fontWeight: 600, color: "#475569", margin: "0 0 6px" }}>No papers found</p>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>
                    Try modifying your search query or status filter.
                  </p>
                </td>
              </tr>
            ) : (
              filteredPapers.map((paper) => (
                <tr key={paper.id}>
                  <td>
                    <Link
                      href={`/papers/${paper.id}`}
                      target="_blank"
                      className={styles.paperTitleLink}
                    >
                      {paper.title}
                    </Link>
                    <div>
                      {paper.category && (
                        <span className={styles.categoryPill}>
                          {paper.category.name}
                        </span>
                      )}
                    </div>
                    {paper.journal && (
                      <Link
                        href={`/shaoor/${paper.journal.slug || paper.journal.id}`}
                        target="_blank"
                        className={styles.journalAssignedPill}
                      >
                        <BookOpen size={11} />
                        {paper.journal.title}
                      </Link>
                    )}
                  </td>
                  <td>
                    <div className={styles.authorMeta}>
                      <span className={styles.authorName}>
                        {paper.author?.name || "Unknown Author"}
                      </span>
                      <span className={styles.authorEmail}>
                        {paper.author?.email || "No email on file"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(paper.status)}`}>
                      {paper.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    <div className={styles.metricsCell}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Eye size={12} /> {paper.viewCount || 0} views
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Download size={12} /> {paper.downloadCount || 0} downloads
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <Link
                        href={`/papers/${paper.id}`}
                        target="_blank"
                        className={styles.viewActionBtn}
                        title="View Paper in new tab"
                      >
                        <ExternalLink size={13} />
                        View
                      </Link>

                      {isMaster && (
                        <button
                          type="button"
                          className={styles.deleteActionBtn}
                          onClick={() => setPaperToDelete(paper)}
                          title="Permanently delete paper from platform"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Password Confirmation Modal for Safe Paper Deletion */}
      <PasswordConfirmModal
        isOpen={!!paperToDelete}
        title="Delete Manuscript"
        description={
          paperToDelete
            ? `Are you sure you want to permanently delete "${paperToDelete.title}"? This will delete the manuscript, all review records, author references, and journal assignments. This action cannot be undone.`
            : "Please confirm your password to delete this manuscript."
        }
        confirmLabel="Permanently Delete Paper"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPaperToDelete(null)}
      />
    </div>
  );
}
