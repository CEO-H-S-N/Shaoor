"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  Mail,
} from "lucide-react";
import styles from "./faqEditor.module.css";
import { DEFAULT_FAQ_CONTENT, FaqItem, FaqPageData } from "@/lib/pageContentDefaults";

export function FAQEditorView({ initialData }: { initialData: FaqPageData }) {
  const [data, setData] = useState<FaqPageData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    if (confirm("Reset FAQ page to initial default content? Any custom modifications will be discarded.")) {
      setData(DEFAULT_FAQ_CONTENT);
    }
  };

  const handleAddItem = () => {
    const newItem: FaqItem = {
      id: `faq-${Date.now()}`,
      category: "General",
      question: "New Frequently Asked Question?",
      answer: "Provide a detailed and transparent explanation for authors, readers, or reviewers here.",
    };
    setData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleUpdateItem = (index: number, field: keyof FaqItem, value: string) => {
    setData((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleDeleteItem = (index: number) => {
    if (data.items.length <= 1) {
      alert("At least one FAQ item must remain on the page.");
      return;
    }
    if (confirm("Delete this question from the FAQ page?")) {
      setData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    setData((prev) => {
      const items = [...prev.items];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return { ...prev, items };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/pages/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to update FAQ page content.");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <Link href="/review" className={styles.backBtn}>
          <ArrowLeft size={16} />
          Back to Admin Queue
        </Link>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={handleReset}
            className={styles.resetBtn}
            disabled={isSaving}
          >
            <RotateCcw size={14} />
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={styles.saveBtn}
            disabled={isSaving}
          >
            {isSaving ? (
              "Saving..."
            ) : saveSuccess ? (
              <>
                <Check size={16} />
                Published to Live Page!
              </>
            ) : (
              <>
                <Save size={16} />
                Save &amp; Publish FAQ
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {saveSuccess && (
        <div className={`${styles.statusBanner} ${styles.successBanner}`}>
          <Check size={18} />
          Changes successfully published to the live public FAQ portal!
        </div>
      )}
      {error && (
        <div className={`${styles.statusBanner} ${styles.errorBanner}`}>
          {error}
        </div>
      )}

      {/* Title */}
      <div className={styles.titleBlock}>
        <div className={styles.headingRow}>
          <h1 className={styles.pageTitle}>Edit FAQ Page</h1>
          <span className={styles.ownerBadge}>Platform Owner CMS</span>
        </div>
        <p className={styles.pageDesc}>
          Manage frequently asked questions, categorized answers, and editorial support
          contacts displayed on the public <code>/faq</code> portal.
        </p>
      </div>

      <div className={styles.formGrid}>
        {/* Hero Section Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Hero Header &amp; Badge</span>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Top Badge Label</label>
            <input
              type="text"
              className={styles.input}
              value={data.badge}
              onChange={(e) => setData({ ...data, badge: e.target.value })}
              placeholder="Author & Researcher Support"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Page Headline (H1)</label>
            <input
              type="text"
              className={styles.input}
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder="Frequently Asked Questions"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Hero Subtitle / Mission</label>
            <textarea
              className={styles.textarea}
              value={data.subtitle}
              onChange={(e) => setData({ ...data, subtitle: e.target.value })}
              placeholder="Brief introductory overview..."
            />
          </div>
        </div>

        {/* Questions & Answers Manager */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              FAQ Entries ({data.items.length} Questions)
            </span>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Reorder or delete entries as needed
            </span>
          </div>

          <div className={styles.itemsList}>
            {data.items.map((item, idx) => (
              <div key={item.id || idx} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemNumber}>Question #{idx + 1}</span>
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => handleMoveItem(idx, "up")}
                      disabled={idx === 0}
                      title="Move Up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => handleMoveItem(idx, "down")}
                      disabled={idx === data.items.length - 1}
                      title="Move Down"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.deleteBtn}`}
                      onClick={() => handleDeleteItem(idx)}
                      title="Delete Question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Category Tag</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={item.category}
                    onChange={(e) => handleUpdateItem(idx, "category", e.target.value)}
                    placeholder="e.g. Peer Review, Submissions, Open Access"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Question</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={item.question}
                    onChange={(e) => handleUpdateItem(idx, "question", e.target.value)}
                    placeholder="e.g. How does the double-blind review process work?"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Answer</label>
                  <textarea
                    className={styles.textarea}
                    style={{ minHeight: "100px" }}
                    value={item.answer}
                    onChange={(e) => handleUpdateItem(idx, "answer", e.target.value)}
                    placeholder="Comprehensive scholarly answer..."
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={styles.addItemBtn}
            onClick={handleAddItem}
          >
            <Plus size={16} />
            Add New Question
          </button>
        </div>

        {/* Editorial Contact Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Bottom Contact Banner</span>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Contact Box Heading</label>
            <input
              type="text"
              className={styles.input}
              value={data.contactHeading}
              onChange={(e) => setData({ ...data, contactHeading: e.target.value })}
              placeholder="Need Further Editorial Assistance?"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Contact Box Description</label>
            <textarea
              className={styles.textarea}
              value={data.contactDescription}
              onChange={(e) => setData({ ...data, contactDescription: e.target.value })}
              placeholder="Explanation for authors reaching out..."
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Default Contact Email</label>
            <input
              type="email"
              className={styles.input}
              value={data.contactEmail}
              onChange={(e) => setData({ ...data, contactEmail: e.target.value })}
              placeholder="shouket.tilwani@gmail.com"
            />
            <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}>
              Official contact destination for all author, reviewer, and reader inquiries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
