"use client";

import { useState, useRef } from "react";
import { Check, ChevronRight, ChevronLeft, Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

// ─── Types ────────────────────────────────────────────────────
interface FormData {
  title: string;
  abstract: string;
  keywords: string[];
  categoryId: string;
  coAuthors: string;
  fileKey: string | null;
  fileName: string | null;
}

const STEPS = [
  { id: 1, label: "Metadata" },
  { id: 2, label: "Upload" },
  { id: 3, label: "Preview" },
  { id: 4, label: "Submit" },
];

// Demo categories — loaded from API in real implementation
const CATEGORIES = [
  { id: "1", name: "Health & Medicine" },
  { id: "2", name: "Computer Science" },
  { id: "3", name: "Education" },
  { id: "4", name: "Social Sciences" },
  { id: "5", name: "Environmental Science" },
  { id: "6", name: "Technology & Innovation" },
];

export default function SubmitPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    title: "",
    abstract: "",
    keywords: [],
    categoryId: "",
    coAuthors: "",
    fileKey: null,
    fileName: null,
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Keyword Management ─────────────────────────────────────
  function addKeyword() {
    const kw = keywordInput.trim();
    if (kw && !form.keywords.includes(kw) && form.keywords.length < 8) {
      setForm((f) => ({ ...f, keywords: [...f.keywords, kw] }));
      setKeywordInput("");
    }
  }

  function removeKeyword(kw: string) {
    setForm((f) => ({ ...f, keywords: f.keywords.filter((k) => k !== kw) }));
  }

  // ─── File Upload ─────────────────────────────────────────────
  async function handleFile(file: File) {
    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
      alert("Only PDF and DOCX files are allowed.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert("File must be smaller than 20 MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Get pre-signed URL from our API
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, fileKey } = await res.json();

      setUploadProgress(30);

      // Upload directly to S3
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      setUploadProgress(100);
      setForm((f) => ({ ...f, fileKey, fileName: file.name }));
    } catch {
      alert("Upload failed. Please try again.");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }

  // ─── Submission ──────────────────────────────────────────────
  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/papers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          abstract: form.abstract,
          keywords: form.keywords,
          categoryId: form.categoryId,
          fileKey: form.fileKey,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");
      setIsSubmitted(true);
    } catch {
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Step Validation ─────────────────────────────────────────
  function canProceed(): boolean {
    if (step === 1) {
      return form.title.length >= 10 && form.abstract.length >= 100 && !!form.categoryId;
    }
    if (step === 2) return !!form.fileKey;
    return true;
  }

  // ─── Submitted State ─────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className={styles.page}>
        <div className={styles.card} style={{ textAlign: "center", padding: "var(--space-16)" }}>
          <div style={{ width: 72, height: 72, background: "var(--color-success-50)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-6)", border: "2px solid var(--color-success-500)" }}>
            <Check size={32} color="var(--color-success-500)" />
          </div>
          <h2 className={styles.cardTitle}>Paper Submitted!</h2>
          <p className={styles.cardSubtitle} style={{ maxWidth: 400, margin: "0 auto var(--space-6)" }}>
            Your paper has been submitted for review. You'll receive an email notification
            when reviewers are assigned. You can track the status in My Papers.
          </p>
          <Button variant="primary" onClick={() => window.location.href = "/my-papers"}>
            View My Papers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Submit a Paper</h1>
      <p className={styles.pageSubtitle}>
        Complete all steps to submit your paper for peer review.
      </p>

      {/* ─── Stepper ────────────────────────────────────── */}
      <div className={styles.stepper}>
        <div className={styles.stepTrack}>
          <div
            className={styles.stepTrackFill}
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
        {STEPS.map((s) => (
          <div key={s.id} className={styles.step}>
            <div
              className={`${styles.stepCircle} ${step === s.id ? styles.stepCircleActive : ""} ${step > s.id ? styles.stepCircleDone : ""}`}
            >
              {step > s.id ? <Check size={14} /> : s.id}
            </div>
            <span
              className={`${styles.stepLabel} ${step === s.id ? styles.stepLabelActive : ""} ${step > s.id ? styles.stepLabelDone : ""}`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* ─── Step 1: Metadata ────────────────────────────── */}
      {step === 1 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Paper Information</h2>
          <p className={styles.cardSubtitle}>Provide details about your paper.</p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">
              Title <span className={styles.required}>*</span>
            </label>
            <input
              id="title"
              className={styles.input}
              placeholder="Enter the full title of your paper"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={300}
            />
            <div className={`${styles.charCount} ${form.title.length > 280 ? styles.charCountWarning : ""}`}>
              {form.title.length}/300
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="abstract">
              Abstract <span className={styles.required}>*</span>
            </label>
            <textarea
              id="abstract"
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Provide a concise summary of your paper (150-300 words recommended)"
              value={form.abstract}
              onChange={(e) => setForm((f) => ({ ...f, abstract: e.target.value }))}
              maxLength={3000}
            />
            <div className={`${styles.charCount} ${form.abstract.length > 2800 ? styles.charCountWarning : ""}`}>
              {form.abstract.length}/3000
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="category">
              Category <span className={styles.required}>*</span>
            </label>
            <select
              id="category"
              className={styles.input}
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              style={{ cursor: "pointer" }}
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="keywords">Keywords</label>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <input
                id="keywords"
                className={styles.input}
                placeholder="Add a keyword and press Enter"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              />
              <Button variant="secondary" size="sm" onClick={addKeyword} type="button">Add</Button>
            </div>
            <span className={styles.hint}>Add up to 8 keywords (press Enter or click Add)</span>
            {form.keywords.length > 0 && (
              <div className={styles.keywords}>
                {form.keywords.map((kw) => (
                  <span key={kw} className={styles.keyword}>
                    {kw}
                    <button className={styles.keywordRemove} onClick={() => removeKeyword(kw)} aria-label={`Remove ${kw}`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="coAuthors">Co-Authors</label>
            <input
              id="coAuthors"
              className={styles.input}
              placeholder="e.g. Dr. Jane Doe (jane@uni.edu), Prof. Ahmed Khan"
              value={form.coAuthors}
              onChange={(e) => setForm((f) => ({ ...f, coAuthors: e.target.value }))}
            />
            <span className={styles.hint}>Optional. Separate multiple co-authors with commas.</span>
          </div>
        </div>
      )}

      {/* ─── Step 2: Upload ──────────────────────────────── */}
      {step === 2 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Upload Manuscript</h2>
          <p className={styles.cardSubtitle}>Upload your paper in PDF or DOCX format (max 20 MB).</p>

          <div
            className={`${styles.uploadZone} ${isDragging ? styles.uploadZoneActive : ""} ${form.fileKey ? styles.uploadZoneSuccess : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className={styles.uploadInput}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            {form.fileKey ? (
              <>
                <div className={styles.uploadIcon} style={{ background: "var(--color-success-50)", color: "var(--color-success-500)" }}>
                  <Check size={28} />
                </div>
                <div className={styles.uploadTitle} style={{ color: "var(--color-success-700)" }}>
                  {form.fileName}
                </div>
                <p className={styles.uploadHint}>Click to replace file</p>
              </>
            ) : (
              <>
                <div className={styles.uploadIcon}>
                  {isUploading ? (
                    <div style={{ width: 28, height: 28, border: "3px solid var(--color-neutral-300)", borderTop: "3px solid var(--color-accent-500)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  ) : (
                    <Upload size={28} />
                  )}
                </div>
                <div className={styles.uploadTitle}>
                  {isUploading ? "Uploading…" : "Drop your file here or click to browse"}
                </div>
                <p className={styles.uploadHint}>PDF or DOCX · Max 20 MB</p>
              </>
            )}

            {isUploading && uploadProgress > 0 && (
              <div className={styles.uploadProgress}>
                <div className={styles.uploadProgressBar} style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Step 3: Preview ─────────────────────────────── */}
      {step === 3 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Review Your Submission</h2>
          <p className={styles.cardSubtitle}>Confirm everything looks correct before submitting.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {[
              { label: "Title", value: form.title },
              { label: "Category", value: CATEGORIES.find((c) => c.id === form.categoryId)?.name ?? "—" },
              { label: "Keywords", value: form.keywords.join(", ") || "None" },
              { label: "Co-Authors", value: form.coAuthors || "None" },
              { label: "File", value: form.fileName || "Not uploaded" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-neutral-400)", marginBottom: "var(--space-1)" }}>{label}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-800)" }}>{value}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-neutral-400)", marginBottom: "var(--space-1)" }}>Abstract</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-800)", lineHeight: "var(--leading-relaxed)", background: "var(--color-neutral-50)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", maxHeight: 200, overflow: "auto" }}>{form.abstract}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 4: Submit ──────────────────────────────── */}
      {step === 4 && (
        <div className={styles.card} style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "var(--color-accent-50)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-6)" }}>
            <FileText size={28} color="var(--color-accent-500)" />
          </div>
          <h2 className={styles.cardTitle}>Ready to Submit?</h2>
          <p className={styles.cardSubtitle} style={{ maxWidth: 400, margin: "0 auto var(--space-6)" }}>
            By submitting, you confirm this is original work, that you have the right to publish it,
            and you agree to our <a href="/ethics">Publication Ethics Policy</a>.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Submit for Review
          </Button>
        </div>
      )}

      {/* ─── Navigation ─────────────────────────────────── */}
      <div className={styles.actions}>
        <Button
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
        >
          <ChevronLeft size={18} />
          Back
        </Button>

        <div className={styles.actionRight}>
          <Button variant="secondary" onClick={() => alert("Draft saved!")}>
            Save Draft
          </Button>
          {step < 4 && (
            <Button
              variant="primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
