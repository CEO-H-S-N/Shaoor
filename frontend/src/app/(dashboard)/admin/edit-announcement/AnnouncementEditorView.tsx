"use client";

import { useState } from "react";
import { Save, Eye, EyeOff, Bell, BellOff, Image as ImageIcon } from "lucide-react";
import styles from "./announcement.module.css";

export interface AnnouncementData {
  id?: string;
  title: string;
  message: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
  isActive: boolean;
  showPopup: boolean;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

interface Props {
  initialData: AnnouncementData;
}

export function AnnouncementEditorView({ initialData }: Props) {
  const [data, setData] = useState<AnnouncementData>(initialData);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!data.title.trim() || !data.message.trim()) {
      alert("Title and message are required.");
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save");

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>Edit Announcement</h1>
          <p>
            Create or update the site-wide announcement shown to all visitors.
            Toggle the popup option to display it as a modal on the homepage.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span className={`${styles.statusBadge} ${data.isActive ? styles.statusActive : styles.statusInactive}`}>
            {data.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
            {data.isActive ? "Active" : "Inactive"}
          </span>
          <span className={`${styles.statusBadge} ${data.showPopup ? styles.statusActive : styles.statusInactive}`}>
            {data.showPopup ? <Bell size={12} /> : <BellOff size={12} />}
            {data.showPopup ? "Popup On" : "Popup Off"}
          </span>
        </div>
      </div>

      {/* Editor Card */}
      <div className={styles.card}>
        {/* Toggle switches */}
        <div className={styles.toggleRow}>
          <div className={styles.toggleItem}>
            <button
              type="button"
              className={`${styles.toggle} ${data.isActive ? styles.toggleActive : ""}`}
              onClick={() => setData((d) => ({ ...d, isActive: !d.isActive }))}
              aria-label="Toggle announcement active"
            />
            <span className={styles.toggleLabel}>
              {data.isActive ? "Announcement is LIVE" : "Announcement is OFF"}
            </span>
          </div>

          <div className={styles.toggleItem}>
            <button
              type="button"
              className={`${styles.toggle} ${data.showPopup ? styles.toggleActive : ""}`}
              onClick={() => setData((d) => ({ ...d, showPopup: !d.showPopup }))}
              aria-label="Toggle popup display"
            />
            <span className={styles.toggleLabel}>
              {data.showPopup ? "Show as Popup on Homepage" : "Popup Disabled"}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Announcement Title</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Call for Papers — Volume II"
            value={data.title}
            onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
          />
        </div>

        {/* Message */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Announcement Message</label>
          <textarea
            className={styles.textarea}
            placeholder="Write your announcement message here. This will appear in the popup modal and/or banner on the homepage..."
            value={data.message}
            onChange={(e) => setData((d) => ({ ...d, message: e.target.value }))}
          />
        </div>

        {/* Image URL */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <ImageIcon size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
            Image URL (Optional)
          </label>
          <input
            type="url"
            className={styles.input}
            placeholder="https://example.com/announcement-image.jpg"
            value={data.imageUrl}
            onChange={(e) => setData((d) => ({ ...d, imageUrl: e.target.value }))}
          />
          <span className={styles.hint}>Paste a direct image URL (JPG, PNG, WebP). This image will be displayed in the announcement popup.</span>
          {data.imageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={data.imageUrl}
              alt="Announcement preview"
              className={styles.imagePreview}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
        </div>

        {/* Link URL */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Link URL (Optional)</label>
          <input
            type="url"
            className={styles.input}
            placeholder="https://shaoor.org/papers or an external link"
            value={data.linkUrl}
            onChange={(e) => setData((d) => ({ ...d, linkUrl: e.target.value }))}
          />
        </div>

        {/* Link Label */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Link Button Text (Optional)</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Submit Your Paper →"
            value={data.linkLabel}
            onChange={(e) => setData((d) => ({ ...d, linkLabel: e.target.value }))}
          />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnSave}
            disabled={saving}
            onClick={handleSave}
          >
            <Save size={14} />
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Announcement"}
          </button>
        </div>
      </div>

      {/* Live Preview */}
      {data.title && (
        <div className={styles.previewBox}>
          <div className={styles.previewTitle}>Live Preview</div>
          <div style={{ background: "#1e3a8a", color: "#ffffff", padding: "24px", borderRadius: "8px" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "8px" }}>{data.title}</h3>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.6, opacity: 0.9 }}>{data.message}</p>
            {data.imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={data.imageUrl}
                alt="Preview"
                style={{ width: "100%", maxHeight: "150px", objectFit: "cover", borderRadius: "6px", marginTop: "12px" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            {data.linkUrl && (
              <div style={{ marginTop: "12px" }}>
                <span style={{ padding: "6px 16px", background: "#ffffff", color: "#1e3a8a", borderRadius: "4px", fontSize: "0.8125rem", fontWeight: 600 }}>
                  {data.linkLabel || "Learn More →"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last updated info */}
      {initialData.updatedBy && (
        <p style={{ fontSize: "0.75rem", color: "#94a3b8", textAlign: "center" }}>
          Last updated by {initialData.updatedBy}
          {initialData.updatedAt && ` on ${new Date(initialData.updatedAt).toLocaleDateString()}`}
        </p>
      )}
    </div>
  );
}
