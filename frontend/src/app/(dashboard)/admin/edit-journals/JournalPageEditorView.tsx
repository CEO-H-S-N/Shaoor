"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Eye,
  Save,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import styles from "./journalEditor.module.css";
import { DEFAULT_JOURNALS_PAGE_CONTENT } from "@/lib/pageContentDefaults";

interface JournalPageContent {
  title: string;
  subtitle: string;
  badge: string;
  metric1Label: string;
  metric1Value: string;
  metric2Label: string;
  metric2Value: string;
  metric3Label: string;
  metric3Value: string;
  archiveHeading: string;
  archiveSubheading: string;
  emptyStateTitle: string;
  emptyStateMessage: string;
}

export function JournalPageEditorView({
  initialData,
}: {
  initialData: JournalPageContent;
}) {
  const [data, setData] = useState<JournalPageContent>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    if (confirm("Reset to default journal page text?")) {
      setData(DEFAULT_JOURNALS_PAGE_CONTENT);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/pages/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save changes");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const update = (field: keyof JournalPageContent, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
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
          <span className={styles.currentCrumb}>Edit Journals Page</span>
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <Link href="/journals" target="_blank" className={styles.previewBtn}>
            <Eye size={14} /> View Public Page
          </Link>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              "Publishing..."
            ) : saveSuccess ? (
              <>
                <Check size={15} /> Saved Live!
              </>
            ) : (
              <>
                <Save size={15} /> Save & Publish
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.badge}>
          <BookOpen size={13} />
          Journals Page CMS
        </div>
        <h1 className={styles.title}>Journal Page Content Editor</h1>
        <p className={styles.subtitle}>
          Customize every text element on the public Journals page — hero banner,
          metrics, archive headings, and empty state messaging. Changes take
          effect immediately on save.
        </p>
      </div>

      {/* ── Alerts ─────────────────────────────────────────── */}
      {error && <div className={styles.alertError}>{error}</div>}
      {saveSuccess && (
        <div className={styles.alertSuccess}>
          Journals page content published to database successfully. Changes are
          live immediately!
        </div>
      )}

      {/* ── Hero Section Fields ─────────────────────────────── */}
      <div className={styles.card}>
        <h2 className={styles.cardHeading}>Hero Banner Content</h2>
        <p className={styles.cardDesc}>
          The prominent banner shown at the top of the public Journals page.
        </p>

        <div className={styles.formGroup}>
          <label htmlFor="jp-badge">Badge Label</label>
          <input
            id="jp-badge"
            type="text"
            className={styles.input}
            value={data.badge}
            onChange={(e) => update("badge", e.target.value)}
            placeholder="Open Access Scholarly Archives"
          />
          <span className={styles.hint}>
            Small uppercase badge above the main title.
          </span>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="jp-title">Journal Title</label>
          <input
            id="jp-title"
            type="text"
            className={styles.input}
            value={data.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Shaoor Journal of Multidisciplinary Sciences"
          />
          <span className={styles.hint}>
            The primary heading of the journals page hero.
          </span>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="jp-subtitle">Subtitle / Description</label>
          <textarea
            id="jp-subtitle"
            className={styles.textarea}
            rows={3}
            value={data.subtitle}
            onChange={(e) => update("subtitle", e.target.value)}
            placeholder="Peer-reviewed volumes bridging fundamental theoretical foundations..."
          />
          <span className={styles.hint}>
            Descriptive paragraph below the journal title.
          </span>
        </div>
      </div>

      {/* ── Metrics Fields ──────────────────────────────────── */}
      <div className={styles.card}>
        <h2 className={styles.cardHeading}>Hero Metrics Strip</h2>
        <p className={styles.cardDesc}>
          Three key stats/badges shown in the hero banner below the subtitle.
        </p>

        <div className={styles.metricRow}>
          <div className={styles.formGroup}>
            <label htmlFor="jp-m1v">Metric 1 — Value</label>
            <input
              id="jp-m1v"
              type="text"
              className={styles.input}
              value={data.metric1Value}
              onChange={(e) => update("metric1Value", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="jp-m1l">Metric 1 — Label</label>
            <input
              id="jp-m1l"
              type="text"
              className={styles.input}
              value={data.metric1Label}
              onChange={(e) => update("metric1Label", e.target.value)}
            />
          </div>
        </div>

        <div className={styles.metricRow}>
          <div className={styles.formGroup}>
            <label htmlFor="jp-m2v">Metric 2 — Value</label>
            <input
              id="jp-m2v"
              type="text"
              className={styles.input}
              value={data.metric2Value}
              onChange={(e) => update("metric2Value", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="jp-m2l">Metric 2 — Label</label>
            <input
              id="jp-m2l"
              type="text"
              className={styles.input}
              value={data.metric2Label}
              onChange={(e) => update("metric2Label", e.target.value)}
            />
          </div>
        </div>

        <div className={styles.metricRow}>
          <div className={styles.formGroup}>
            <label htmlFor="jp-m3v">Metric 3 — Value</label>
            <input
              id="jp-m3v"
              type="text"
              className={styles.input}
              value={data.metric3Value}
              onChange={(e) => update("metric3Value", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="jp-m3l">Metric 3 — Label</label>
            <input
              id="jp-m3l"
              type="text"
              className={styles.input}
              value={data.metric3Label}
              onChange={(e) => update("metric3Label", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Archive Section ─────────────────────────────────── */}
      <div className={styles.card}>
        <h2 className={styles.cardHeading}>Archive Section Text</h2>
        <p className={styles.cardDesc}>
          Headings shown above the published issues grid and the empty-state
          fallback text.
        </p>

        <div className={styles.formGroup}>
          <label htmlFor="jp-archHead">Archive Heading</label>
          <input
            id="jp-archHead"
            type="text"
            className={styles.input}
            value={data.archiveHeading}
            onChange={(e) => update("archiveHeading", e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="jp-archSub">Archive Subheading</label>
          <input
            id="jp-archSub"
            type="text"
            className={styles.input}
            value={data.archiveSubheading}
            onChange={(e) => update("archiveSubheading", e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="jp-emptyTitle">Empty State Title</label>
          <input
            id="jp-emptyTitle"
            type="text"
            className={styles.input}
            value={data.emptyStateTitle}
            onChange={(e) => update("emptyStateTitle", e.target.value)}
          />
          <span className={styles.hint}>
            Shown when no journal issues are published yet.
          </span>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="jp-emptyMsg">Empty State Message</label>
          <textarea
            id="jp-emptyMsg"
            className={styles.textarea}
            rows={3}
            value={data.emptyStateMessage}
            onChange={(e) => update("emptyStateMessage", e.target.value)}
          />
        </div>
      </div>

      {/* ── Live Preview ────────────────────────────────────── */}
      <div className={styles.previewCard}>
        <div className={styles.previewHeader}>
          <span className={styles.previewTag}>Real-Time Visual Preview</span>
          <span className={styles.previewNote}>Simulated Hero View</span>
        </div>

        <div className={styles.previewHero}>
          <div className={styles.previewBadge}>
            <BookOpen size={11} />
            {data.badge || "Open Access Scholarly Archives"}
          </div>

          <h1 className={styles.previewTitle}>
            {data.title || "Shaoor Journal of Multidisciplinary Sciences"}
          </h1>

          <p className={styles.previewSubtitle}>
            {data.subtitle ||
              "Peer-reviewed volumes bridging fundamental theoretical foundations..."}
          </p>

          <div className={styles.previewMetrics}>
            <div className={styles.previewMetricItem}>
              <span className={styles.previewMetricValue}>
                {data.metric1Value || "Double-Blind"}
              </span>
              <span className={styles.previewMetricLabel}>
                {data.metric1Label || "Peer Review Standard"}
              </span>
            </div>
            <div className={styles.previewMetricDivider} />
            <div className={styles.previewMetricItem}>
              <span className={styles.previewMetricValue}>
                {data.metric2Value || "Open Access"}
              </span>
              <span className={styles.previewMetricLabel}>
                {data.metric2Label || "CC-BY 4.0 International"}
              </span>
            </div>
            <div className={styles.previewMetricDivider} />
            <div className={styles.previewMetricItem}>
              <span className={styles.previewMetricValue}>
                {data.metric3Value || "Quarterly"}
              </span>
              <span className={styles.previewMetricLabel}>
                {data.metric3Label || "Issue Frequency"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Save Bar ─────────────────────────────────── */}
      <div className={styles.bottomSave}>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={styles.saveBtn}
          style={{ padding: "10px 24px", fontSize: "0.875rem" }}
        >
          <Save size={15} />
          {isSaving
            ? "Publishing Changes to Database..."
            : "Save & Publish Changes"}
        </button>
      </div>
    </div>
  );
}
