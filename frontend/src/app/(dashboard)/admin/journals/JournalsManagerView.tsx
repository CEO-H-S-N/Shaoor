"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  ArrowLeft,
  Calendar,
  Layers,
  FileText,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle,
  X,
  Sparkles,
  Settings,
  Globe,
  Search,
  Check,
} from "lucide-react";
import styles from "./journals.module.css";

export interface JournalItem {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  volume: number;
  issue: number;
  coverImage: string | null;
  publishedAt: string;
  isActive: boolean;
  papersCount: number;
}

export interface PaperOption {
  id: string;
  title: string;
  categoryName: string;
  authorName: string;
}

interface Props {
  initialJournals: JournalItem[];
  availablePapers?: PaperOption[];
  autoOpenCreate?: boolean;
}

export function JournalsManagerView({
  initialJournals,
  availablePapers = [],
  autoOpenCreate = false,
}: Props) {
  const [journals, setJournals] = useState<JournalItem[]>(initialJournals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("Shaoor Journal of ");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [volume, setVolume] = useState<number>(1);
  const [issue, setIssue] = useState<number>(1);
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().split("T")[0]);
  const [isActive, setIsActive] = useState(true);

  // Paper Selection State
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [paperFilterQuery, setPaperFilterQuery] = useState("");

  const openCreateModal = () => {
    setEditingId(null);
    setTitle("Shaoor Journal of ");
    setSlug("");
    setDescription("");
    setSelectedPaperIds([]);
    setPaperFilterQuery("");
    setNewlyCreatedId(null);

    // Default volume & issue
    const latestVolume = journals.length > 0 ? Math.max(...journals.map((j) => j.volume)) : 1;
    setVolume(latestVolume);
    setIssue(1);
    setPublishedAt(new Date().toISOString().split("T")[0]);
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (autoOpenCreate) {
      openCreateModal();
    }
  }, [autoOpenCreate]);

  const openEditModal = async (j: JournalItem) => {
    setEditingId(j.id);
    setTitle(j.title);
    setSlug(j.slug || "");
    setDescription(j.description || "");
    setVolume(j.volume);
    setIssue(j.issue);
    setPublishedAt(new Date(j.publishedAt).toISOString().split("T")[0]);
    setIsActive(j.isActive);
    setPaperFilterQuery("");
    setError(null);
    setNewlyCreatedId(null);

    // Fetch existing paper entries for this journal
    try {
      const res = await fetch(`/api/admin/journals/${j.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.journal?.entries) {
          setSelectedPaperIds(data.journal.entries.map((e: any) => e.paperId));
        }
      }
    } catch {
      // Fallback
    }

    setIsModalOpen(true);
  };

  // Filter available papers inside modal
  const filteredAvailablePapers = useMemo(() => {
    if (!paperFilterQuery.trim()) return availablePapers;
    const q = paperFilterQuery.toLowerCase();
    return availablePapers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q)
    );
  }, [availablePapers, paperFilterQuery]);

  const togglePaperSelection = (paperId: string) => {
    setSelectedPaperIds((prev) =>
      prev.includes(paperId) ? prev.filter((id) => id !== paperId) : [...prev, paperId]
    );
  };

  const selectAllFilteredPapers = () => {
    const ids = filteredAvailablePapers.map((p) => p.id);
    setSelectedPaperIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearAllSelectedPapers = () => {
    setSelectedPaperIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingId ? `/api/admin/journals/${editingId}` : "/api/admin/journals";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          volume,
          issue,
          publishedAt,
          isActive,
          paperIds: selectedPaperIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save journal");

      if (editingId) {
        setJournals((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  title,
                  slug: data.journal.slug || slug,
                  description,
                  volume,
                  issue,
                  publishedAt,
                  isActive,
                  papersCount: selectedPaperIds.length,
                }
              : item
          )
        );
        setSuccess(`Journal "${title}" updated with ${selectedPaperIds.length} assigned paper(s)!`);
      } else {
        const newJournal: JournalItem = {
          id: data.journal.id,
          title: data.journal.title,
          slug: data.journal.slug,
          description: data.journal.description,
          volume: data.journal.volume,
          issue: data.journal.issue,
          coverImage: data.journal.coverImage,
          publishedAt: data.journal.publishedAt,
          isActive: data.journal.isActive,
          papersCount: selectedPaperIds.length,
        };
        setJournals([newJournal, ...journals]);
        setNewlyCreatedId(data.journal.id);
        setSuccess(`Journal "${title}" created successfully with ${selectedPaperIds.length} paper(s)!`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to process request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (journalId: string, journalTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${journalTitle}"? Any paper associations will be unlinked. This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/journals/${journalId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete journal");

      setJournals((prev) => prev.filter((j) => j.id !== journalId));
      setSuccess(`Journal "${journalTitle}" removed.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to delete journal");
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Top Bar ────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.breadcrumbs}>
          <Link href="/review" className={styles.backLink}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.currentCrumb}>Manage Journals &amp; Categorization</span>
        </div>

        <div className={styles.topActions}>
          <Link href="/admin/edit-journals" className={styles.publicLink}>
            <Settings size={14} /> Edit Content Page Text
          </Link>
          <Link href="/content" target="_blank" className={styles.publicLink}>
            <Globe size={14} /> View Live Directory
          </Link>
          <button type="button" className={styles.createBtn} onClick={openCreateModal}>
            <Plus size={15} /> Add New Journal
          </button>
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.badge}>
          <BookOpen size={13} />
          Academic Journal Directory Manager
        </div>
        <h1 className={styles.title}>Journals &amp; Paper Categorization</h1>
        <p className={styles.subtitle}>
          Add new scholarly journals, edit volumes and issues, and choose which manuscripts belong in each journal. Each journal is automatically accessible at <code>/shaoor/[journal-name]</code>.
        </p>
      </div>

      {/* ── Feedback Alerts ────────────────────────────────── */}
      {success && (
        <div className={styles.alertSuccess} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
          {newlyCreatedId && (
            <Link
              href={`/admin/journals/${newlyCreatedId}`}
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#1e3a8a",
                background: "#ffffff",
                padding: "4px 10px",
                borderRadius: 4,
                border: "1px solid #bfdbfe",
                textDecoration: "none",
              }}
            >
              Adjust Paper Order &amp; Page Numbers →
            </Link>
          )}
        </div>
      )}

      {/* ── Journals Grid ──────────────────────────────────── */}
      {journals.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <h3>No Journals in Database</h3>
          <p>Create your inaugural academic journal and select papers to include.</p>
          <button
            type="button"
            className={styles.createBtn}
            onClick={openCreateModal}
            style={{ margin: "16px auto 0 auto" }}
          >
            <Plus size={15} /> Add First Journal
          </button>
        </div>
      ) : (
        <div className={styles.journalGrid}>
          {journals.map((journal) => {
            const publicUrl = `/shaoor/${encodeURIComponent(journal.slug || journal.id)}`;

            return (
              <div key={journal.id} className={styles.journalCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.volBadge}>
                    <Layers size={13} /> Vol. {journal.volume} · Iss. {journal.issue}
                  </div>
                  <div className={styles.statusBadge}>
                    {journal.isActive ? (
                      <span className={styles.badgeActive}>Active / Live</span>
                    ) : (
                      <span className={styles.badgeArchived}>Draft / Hidden</span>
                    )}
                  </div>
                </div>

                <h2 className={styles.cardTitle}>{journal.title}</h2>
                {journal.description && (
                  <p className={styles.cardDesc}>{journal.description}</p>
                )}

                <div className={styles.cardMeta}>
                  <span>
                    <Calendar size={13} />
                    {new Date(journal.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span>
                    <FileText size={13} />
                    {journal.papersCount} Categorized Paper{journal.papersCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {journal.slug && (
                  <div style={{ fontSize: "0.75rem", color: "#64748b", margin: "6px 0 10px" }}>
                    URL: <code>/shaoor/{journal.slug}</code>
                  </div>
                )}

                <div className={styles.cardActions}>
                  <Link
                    href={`/admin/journals/${journal.id}`}
                    className={styles.managePapersBtn}
                    title="Fine-tune paper order, page ranges, or add/remove papers"
                  >
                    <Sparkles size={13} /> Categorize Papers ({journal.papersCount})
                  </Link>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.iconBtn}
                    title="View live journal page on Shaoor"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => openEditModal(journal)}
                    title="Edit Journal Name, Volume & Papers"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    onClick={() => handleDelete(journal.id, journal.title)}
                    title="Delete Journal"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ─────────────────────────────── */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div
            className={styles.modal}
            style={{ maxWidth: 680, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {editingId ? "Edit Journal Details & Papers" : "Add New Academic Journal"}
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                  Configure the journal title, volume, issue, and choose which manuscripts to include.
                </p>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              {error && <div className={styles.modalError}>{error}</div>}

              <div className={styles.formGroup}>
                <label htmlFor="j-title">Journal Name / Title</label>
                <input
                  id="j-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Shaoor Journal of Science"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="j-slug">URL Slug (Accessible at /shaoor/[slug])</label>
                <input
                  id="j-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. shaoor-journal-of-science (auto-generated if empty)"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="j-vol">Volume Number</label>
                  <input
                    id="j-vol"
                    type="number"
                    min={1}
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="j-issue">Issue Number</label>
                  <input
                    id="j-issue"
                    type="number"
                    min={1}
                    value={issue}
                    onChange={(e) => setIssue(parseInt(e.target.value, 10))}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="j-date">Publication Date</label>
                <input
                  id="j-date"
                  type="date"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="j-desc">Journal Scope &amp; Editorial Content</label>
                <textarea
                  id="j-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Aims, disciplinary scope, research topics and themes covered by this journal..."
                />
              </div>

              {/* ── Choose Papers for this Journal ───────────── */}
              <div className={styles.paperSelectionBox}>
                <div className={styles.paperSelectionHeader}>
                  <div className={styles.paperSelectionTitle}>
                    <FileText size={14} style={{ color: "#1e3a8a" }} />
                    <span>Choose Papers to Add ({selectedPaperIds.length} Selected)</span>
                  </div>
                  <div className={styles.paperSelectionActions}>
                    <button
                      type="button"
                      className={styles.toggleSelectBtn}
                      onClick={selectAllFilteredPapers}
                    >
                      Select All Filtered
                    </button>
                    {selectedPaperIds.length > 0 && (
                      <button
                        type="button"
                        className={styles.toggleSelectBtn}
                        onClick={clearAllSelectedPapers}
                        style={{ color: "#dc2626", borderColor: "#fecaca", background: "#fef2f2" }}
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Filter available papers by title, author, or discipline..."
                  className={styles.paperSearchInput}
                  value={paperFilterQuery}
                  onChange={(e) => setPaperFilterQuery(e.target.value)}
                />

                {availablePapers.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "16px", color: "#64748b", fontSize: "0.8rem" }}>
                    No accepted or published papers available yet.
                  </div>
                ) : filteredAvailablePapers.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "16px", color: "#64748b", fontSize: "0.8rem" }}>
                    No papers match &quot;{paperFilterQuery}&quot;.
                  </div>
                ) : (
                  <div className={styles.paperScrollList}>
                    {filteredAvailablePapers.map((paper) => {
                      const isSelected = selectedPaperIds.includes(paper.id);
                      return (
                        <div
                          key={paper.id}
                          className={`${styles.paperOptionRow} ${
                            isSelected ? styles.paperOptionRowSelected : ""
                          }`}
                          onClick={() => togglePaperSelection(paper.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent div
                            className={styles.paperOptionCheckbox}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className={styles.paperOptionDetails}>
                            <div className={styles.paperOptionTitle}>{paper.title}</div>
                            <div className={styles.paperOptionMeta}>
                              <span className={styles.paperOptionCategory}>
                                {paper.categoryName}
                              </span>
                              <span>•</span>
                              <span>By {paper.authorName}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span>Active &amp; Visible on Public Content Directory</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : `Create Journal with ${selectedPaperIds.length} Paper(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
