"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles, Eye, Save, RotateCcw } from "lucide-react";
import styles from "./homeEditor.module.css";
import { DEFAULT_HOMEPAGE_CONTENT } from "@/lib/pageContentDefaults";

interface HomeContent {
  title: string;
  subtitle: string;
  description: string;
}

export function HomeEditorView({ initialData }: { initialData: HomeContent }) {
  const [data, setData] = useState<HomeContent>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    if (confirm("Reset to default homepage text?")) {
      setData(DEFAULT_HOMEPAGE_CONTENT);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/pages/home", {
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

  return (
    <div className={styles.container}>
      {/* ── Top Bar ────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.breadcrumbs}>
          <Link href="/review" className={styles.backLink}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.currentCrumb}>Edit Homepage Text</span>
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
          <Link href="/" target="_blank" className={styles.previewBtn}>
            <Eye size={14} /> View Live Site
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
                <Save size={15} /> Save &amp; Publish
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.badge}>
          <Sparkles size={13} />
          Landing Page CMS
        </div>
        <h1 className={styles.title}>Homepage Hero &amp; Headline Editor</h1>
        <p className={styles.subtitle}>
          Customize the primary headlines and description displayed to readers, scholars, and visitors on the homepage hero section.
        </p>
      </div>

      {/* ── Alerts ─────────────────────────────────────────── */}
      {error && <div className={styles.alertError}>{error}</div>}
      {saveSuccess && (
        <div className={styles.alertSuccess}>
          Homepage text successfully updated and published to AWS RDS PostgreSQL. Changes are live immediately!
        </div>
      )}

      {/* ── Editor Grid: Form + Live Preview ──────────────── */}
      <div className={styles.grid}>
        {/* Left: Input Form */}
        <div className={styles.formCard}>
          <h2 className={styles.cardHeading}>Hero Section Content</h2>

          <div className={styles.formGroup}>
            <label htmlFor="home-title">Primary Headline (Line 1)</label>
            <input
              id="home-title"
              type="text"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder="Publish Impactful Research."
              className={styles.input}
            />
            <span className={styles.hint}>
              The prominent leading title in the hero banner.
            </span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="home-subtitle">Accent Headline (Line 2 / Highlight)</label>
            <input
              id="home-subtitle"
              type="text"
              value={data.subtitle}
              onChange={(e) => setData({ ...data, subtitle: e.target.value })}
              placeholder="Peer-Reviewed & Open to the World."
              className={styles.input}
            />
            <span className={styles.hint}>
              The secondary accent line displayed directly beneath the primary headline.
            </span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="home-desc">Hero Description Paragraph</label>
            <textarea
              id="home-desc"
              rows={5}
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="Shaoor is a peer-reviewed scholarly publishing platform..."
              className={styles.textarea}
            />
            <span className={styles.hint}>
              Clear, welcoming mission statement summarizing peer review, open access, and academic integrity.
            </span>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <span className={styles.previewTag}>Real-Time Visual Preview</span>
            <span className={styles.previewNote}>Simulated Hero View</span>
          </div>

          <div className={styles.previewHero}>
            <div className={styles.previewHeroInner}>
              <h1 className={styles.previewHeroTitle}>
                {data.title || "Publish Impactful Research."}
                <span className={styles.previewHeroAccent}>
                  {data.subtitle || "Peer-Reviewed & Open to the World."}
                </span>
              </h1>
              <p className={styles.previewHeroDesc}>
                {data.description ||
                  "Shaoor is a peer-reviewed scholarly publishing platform built for researchers, authors, and academics."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
