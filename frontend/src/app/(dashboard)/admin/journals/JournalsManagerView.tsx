"use client";

import React, { useState } from "react";
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

export function JournalsManagerView({ initialJournals }: { initialJournals: JournalItem[] }) {
  const [journals, setJournals] = useState<JournalItem[]>(initialJournals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("Shaoor Journal of Multidisciplinary Sciences");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [volume, setVolume] = useState<number>(1);
  const [issue, setIssue] = useState<number>(1);
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().split("T")[0]);
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle("Shaoor Journal of ");
    setSlug("");
    setDescription("");
    // Autoincrement issue if journals exist
    const latestIssue = journals.length > 0 ? Math.max(...journals.map((j) => j.issue)) + 1 : 1;
    setVolume(journals.length > 0 ? journals[0].volume : 1);
    setIssue(latestIssue);
    setPublishedAt(new Date().toISOString().split("T")[0]);
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (j: JournalItem) => {
    setEditingId(j.id);
    setTitle(j.title);
    setSlug(j.slug || "");
    setDescription(j.description || "");
    setVolume(j.volume);
    setIssue(j.issue);
    setPublishedAt(new Date(j.publishedAt).toISOString().split("T")[0]);
    setIsActive(j.isActive);
    setError(null);
    setIsModalOpen(true);
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
                }
              : item
          )
        );
        setSuccess("Journal updated successfully!");
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
          papersCount: 0,
        };
        setJournals([newJournal, ...journals]);
        setSuccess(`Journal "${title}" created successfully!`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to process request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (journalId: string, journalTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${journalTitle}"? Any paper associations will be unlinked. This action cannot be undone.`)) {
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
          Create and manage academic journals on Shaoor, categorize and assign manuscripts into journals, and configure URLs for <code>/shaoor/[journal-name]</code>.
        </p>
      </div>

      {/* ── Feedback Alerts ────────────────────────────────── */}
      {success && <div className={styles.alertSuccess}><CheckCircle size={16} /> {success}</div>}

      {/* ── Journals Grid ──────────────────────────────────── */}
      {journals.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <h3>No Journals in Database</h3>
          <p>Create your inaugural academic journal to begin compiling and categorizing accepted papers.</p>
          <button type="button" className={styles.createBtn} onClick={openCreateModal} style={{ margin: "16px auto 0 auto" }}>
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
                    title="Assign, reorder, or remove papers in this journal"
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
                    title="Edit Journal Name & Settings"
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
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? "Edit Journal Details" : "Create New Academic Journal"}</h3>
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
                  placeholder="e.g. Shaoor Journal of Health & Medical Sciences"
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
                  placeholder="e.g. health-medical-sciences (auto-generated if empty)"
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
                <label htmlFor="j-desc">Journal Scope &amp; Editorial Description</label>
                <textarea
                  id="j-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Focus areas, disciplinary scope, research topics..."
                />
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
                  {submitting ? "Saving..." : editingId ? "Update Journal" : "Create Journal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
