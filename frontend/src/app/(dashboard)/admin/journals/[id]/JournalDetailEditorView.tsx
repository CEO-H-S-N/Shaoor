"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Trash2,
  Calendar,
  Layers,
  FileText,
  Search,
  ExternalLink,
  CheckCircle,
  X,
  User,
  Hash,
} from "lucide-react";
import styles from "./detail.module.css";

interface EntryItem {
  id: string;
  paperId: string;
  title: string;
  authorName: string;
  authorAffiliation: string;
  category: string;
  pageStart: number | null;
  pageEnd: number | null;
  sortOrder: number;
  addedAt: string;
}

interface AvailablePaper {
  id: string;
  title: string;
  authorName: string;
  category: string;
}

interface JournalDetailProps {
  journal: {
    id: string;
    title: string;
    slug?: string | null;
    volume: number;
    issue: number;
    description: string | null;
    publishedAt: string;
  };
  initialEntries: EntryItem[];
  availablePapers: AvailablePaper[];
}

export function JournalDetailEditorView({
  journal,
  initialEntries,
  availablePapers,
}: JournalDetailProps) {
  const [entries, setEntries] = useState<EntryItem[]>(initialEntries);
  const [available, setAvailable] = useState<AvailablePaper[]>(availablePapers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [pageStart, setPageStart] = useState<string>("");
  const [pageEnd, setPageEnd] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaperId) {
      setError("Please select a paper from the list.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/journals/${journal.id}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId: selectedPaperId,
          pageStart: pageStart ? parseInt(pageStart, 10) : null,
          pageEnd: pageEnd ? parseInt(pageEnd, 10) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add paper to journal");

      const chosen = available.find((p) => p.id === selectedPaperId);
      const newEntry: EntryItem = {
        id: data.entry.id,
        paperId: selectedPaperId,
        title: chosen?.title || "Paper",
        authorName: chosen?.authorName || "Author",
        authorAffiliation: "",
        category: chosen?.category || "General",
        pageStart: pageStart ? parseInt(pageStart, 10) : null,
        pageEnd: pageEnd ? parseInt(pageEnd, 10) : null,
        sortOrder: entries.length + 1,
        addedAt: new Date().toISOString(),
      };

      setEntries([...entries, newEntry]);
      setAvailable(available.filter((p) => p.id !== selectedPaperId));
      setIsAddModalOpen(false);
      setSelectedPaperId(null);
      setPageStart("");
      setPageEnd("");
      setSuccess("Paper successfully published into this journal issue!");
      setTimeout(() => setSuccess(false as any), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to add paper");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveEntry = async (entryId: string, paperTitle: string) => {
    if (!confirm(`Remove "${paperTitle}" from this journal issue?`)) return;

    try {
      const res = await fetch(`/api/admin/journals/${journal.id}/entries`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove entry");

      const removed = entries.find((e) => e.id === entryId);
      if (removed) {
        setAvailable([
          ...available,
          {
            id: removed.paperId,
            title: removed.title,
            authorName: removed.authorName,
            category: removed.category,
          },
        ]);
      }
      setEntries(entries.filter((e) => e.id !== entryId));
      setSuccess("Paper removed from journal issue.");
      setTimeout(() => setSuccess(false as any), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to remove paper");
    }
  };

  const filteredAvailable = available.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.authorName.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* ── Top Bar ────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.breadcrumbs}>
          <Link href="/admin/journals" className={styles.backLink}>
            <ArrowLeft size={14} /> Back to Journals
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.currentCrumb}>
            Vol. {journal.volume}, Issue {journal.issue}
          </span>
        </div>

        <div className={styles.topActions}>
          <Link
            href={`/shaoor/${journal.slug || journal.id}`}
            target="_blank"
            className={styles.publicLink}
          >
            <ExternalLink size={14} /> View Live Journal (/shaoor)
          </Link>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => {
              setIsAddModalOpen(true);
              setError(null);
            }}
          >
            <Plus size={15} /> Add Paper to Issue
          </button>
        </div>
      </div>

      {/* ── Journal Header Card ────────────────────────────── */}
      <div className={styles.journalHeaderCard}>
        <div className={styles.volBadge}>
          <Layers size={14} /> Volume {journal.volume} · Issue {journal.issue}
        </div>
        <h1 className={styles.journalTitle}>{journal.title}</h1>
        {journal.description && (
          <p className={styles.journalDesc}>{journal.description}</p>
        )}
        <div className={styles.journalMeta}>
          <span>
            <Calendar size={13} /> Published:{" "}
            {new Date(journal.publishedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span>
            <FileText size={13} /> {entries.length} Included Manuscript
            {entries.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Alerts ─────────────────────────────────────────── */}
      {success && (
        <div className={styles.alertSuccess}>
          <CheckCircle size={15} /> {success}
        </div>
      )}

      {/* ── Papers Table / List ─────────────────────────────── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Table of Contents ({entries.length})</h2>
          <span className={styles.tableSub}>
            Manuscripts appear in the order published.
          </span>
        </div>

        {entries.length === 0 ? (
          <div className={styles.emptyTable}>
            <FileText size={36} className={styles.emptyIcon} />
            <p>No papers published in this issue yet.</p>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setIsAddModalOpen(true)}
              style={{ margin: "12px auto 0 auto" }}
            >
              <Plus size={14} /> Add First Paper
            </button>
          </div>
        ) : (
          <div className={styles.entriesList}>
            {entries.map((entry, idx) => (
              <div key={entry.id} className={styles.entryRow}>
                <div className={styles.orderNumber}>#{idx + 1}</div>
                <div className={styles.entryInfo}>
                  <div className={styles.entryTitleRow}>
                    <Link
                      href={`/papers/${entry.paperId}`}
                      target="_blank"
                      className={styles.entryTitle}
                    >
                      {entry.title}
                    </Link>
                    <span className={styles.catBadge}>{entry.category}</span>
                  </div>
                  <div className={styles.entryMeta}>
                    <span>
                      <User size={12} /> {entry.authorName}
                    </span>
                    {(entry.pageStart || entry.pageEnd) && (
                      <span>
                        <Hash size={12} /> pp. {entry.pageStart || "1"}–
                        {entry.pageEnd || ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.entryActions}>
                  <Link
                    href={`/papers/${entry.paperId}`}
                    target="_blank"
                    className={styles.viewLink}
                    title="View Paper Details"
                  >
                    <ExternalLink size={14} />
                  </Link>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemoveEntry(entry.id, entry.title)}
                    title="Remove paper from this issue"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add Paper Modal ─────────────────────────────────── */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Approved Paper to Issue</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPaper} className={styles.modalForm}>
              {error && <div className={styles.modalError}>{error}</div>}

              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Filter approved manuscripts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className={styles.paperListLabel}>
                Select an Accepted Paper ({filteredAvailable.length} available):
              </div>

              <div className={styles.papersSelectContainer}>
                {filteredAvailable.length === 0 ? (
                  <div className={styles.noPapers}>
                    No approved papers available to add. Make sure manuscripts have been Approved in the Review Queue first!
                  </div>
                ) : (
                  filteredAvailable.map((p) => (
                    <div
                      key={p.id}
                      className={`${styles.paperOption} ${
                        selectedPaperId === p.id ? styles.paperOptionSelected : ""
                      }`}
                      onClick={() => setSelectedPaperId(p.id)}
                    >
                      <div className={styles.radio}>
                        {selectedPaperId === p.id && <div className={styles.radioDot} />}
                      </div>
                      <div className={styles.paperOptionDetails}>
                        <div className={styles.paperOptionTitle}>{p.title}</div>
                        <div className={styles.paperOptionMeta}>
                          <span>{p.authorName}</span> ·{" "}
                          <span className={styles.optionCat}>{p.category}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.pageRangeRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="p-start">Start Page (optional)</label>
                  <input
                    id="p-start"
                    type="number"
                    min={1}
                    placeholder="e.g. 1"
                    value={pageStart}
                    onChange={(e) => setPageStart(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="p-end">End Page (optional)</label>
                  <input
                    id="p-end"
                    type="number"
                    min={1}
                    placeholder="e.g. 14"
                    value={pageEnd}
                    onChange={(e) => setPageEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting || !selectedPaperId}
                >
                  {submitting ? "Adding..." : "Publish to Issue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
