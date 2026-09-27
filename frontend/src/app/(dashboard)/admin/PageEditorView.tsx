"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileEdit,
  Save,
  ExternalLink,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { PageSection, PageTemplateData } from "@/lib/pageContentDefaults";
import styles from "./pageEditor.module.css";

interface Props {
  slug: "about" | "author-guidelines";
  pageName: string;
  publicUrl: string;
  initialData: PageTemplateData;
  defaultData: PageTemplateData;
  lastUpdated?: string | null;
  updatedBy?: string | null;
}

export function PageEditorView({
  slug,
  pageName,
  publicUrl,
  initialData,
  defaultData,
  lastUpdated,
  updatedBy,
}: Props) {
  const [title, setTitle] = useState(initialData.title);
  const [subtitle, setSubtitle] = useState(initialData.subtitle);
  const [sections, setSections] = useState<PageSection[]>(initialData.sections);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Section manipulation
  function handleSectionChange(index: number, field: "title" | "body", value: string) {
    setSections((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function handleAddSection() {
    setSections((prev) => [
      ...prev,
      {
        id: `section-${Date.now()}`,
        title: "New Section Heading",
        body: "Enter detailed content, guidelines, or policies for this section...",
      },
    ]);
  }

  function handleDeleteSection(index: number) {
    if (sections.length <= 1) {
      alert("A page must contain at least one content section.");
      return;
    }
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function handleMoveSection(index: number, direction: "up" | "down") {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sections.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    setSections((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  }

  function handleResetToDefaults() {
    if (confirm("Reset all content for this page back to the original academic template? Unsaved changes will be discarded.")) {
      setTitle(defaultData.title);
      setSubtitle(defaultData.subtitle);
      setSections(defaultData.sections);
      setMessage({ type: "success", text: "Reset to template defaults. Click 'Save & Publish' to persist." });
    }
  }

  async function handleSave() {
    setMessage(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/pages/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim(),
          sections,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish page content");
      }

      setMessage({
        type: "success",
        text: `Content for ${pageName} published to live database successfully!`,
      });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save page" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.container}>
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <nav className={styles.breadcrumb}>
          <Link href="/my-papers" className={styles.breadcrumbLink}>
            Dashboard
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Edit {pageName}</span>
        </nav>

        <div className={styles.headerText}>
          <div>
            <h1>Edit {pageName}</h1>
            <p className={styles.headerSubtitle}>
              Customize the publication template, editorial policies, and live public presentation.
            </p>
          </div>

          <div className={styles.topActions}>
            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.viewPublicLink}
            >
              <ExternalLink size={14} />
              View Public Page
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={styles.saveBtn}
              id={`save-page-${slug}-btn`}
            >
              <Save size={14} />
              {saving ? "Publishing to DB..." : "Save & Publish"}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "6px",
            fontSize: "0.875rem",
            marginBottom: "20px",
            background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            color: message.type === "success" ? "#166534" : "#991b1b",
          }}
        >
          {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── Page Metadata Card ──────────────────────────────── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Page Header &amp; Subtitle</h2>
        <p className={styles.cardDesc}>
          Displayed at the top of the public {pageName} alongside the journal masthead.
        </p>

        <div className={styles.formGroup}>
          <label className={styles.label}>Page Title</label>
          <input
            type="text"
            required
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Hero Subtitle / Description</label>
          <textarea
            rows={2}
            className={styles.textarea}
            style={{ minHeight: "70px" }}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>
      </div>

      {/* ── Sections Manager ────────────────────────────────── */}
      <div className={styles.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div>
            <h2 className={styles.cardTitle}>Page Content Sections ({sections.length})</h2>
            <p className={styles.cardDesc} style={{ marginBottom: 0 }}>
              Add, rearrange, or edit scholarly sections. Supports multiple paragraphs and bullet points.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className={styles.resetBtn}
            title="Restore original template text"
          >
            <RotateCcw size={13} />
            Reset to Template
          </button>
        </div>

        <div>
          {sections.map((sec, idx) => (
            <div key={sec.id || idx} className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>Section {idx + 1}</span>

                <div className={styles.sectionActions}>
                  <button
                    type="button"
                    onClick={() => handleMoveSection(idx, "up")}
                    disabled={idx === 0}
                    className={styles.iconBtn}
                    title="Move section up"
                  >
                    <ArrowUp size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveSection(idx, "down")}
                    disabled={idx === sections.length - 1}
                    className={styles.iconBtn}
                    title="Move section down"
                  >
                    <ArrowDown size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSection(idx)}
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    title="Delete section"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Section Heading</label>
                <input
                  type="text"
                  required
                  className={styles.input}
                  value={sec.title}
                  onChange={(e) => handleSectionChange(idx, "title", e.target.value)}
                />
              </div>

              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.label}>Section Body Content</label>
                <textarea
                  className={styles.textarea}
                  value={sec.body}
                  onChange={(e) => handleSectionChange(idx, "body", e.target.value)}
                  placeholder="Enter content, criteria, or instructions for this section..."
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddSection}
          className={styles.addSectionBtn}
        >
          <Plus size={15} />
          Add Another Section
        </button>
      </div>

      {/* Bottom Save Bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={styles.saveBtn}
          style={{ padding: "10px 24px", fontSize: "0.875rem" }}
        >
          <Save size={15} />
          {saving ? "Publishing Changes to Database..." : "Save & Publish Changes"}
        </button>
      </div>
    </div>
  );
}
