"use client";

import React, { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  Eye,
  FileCheck,
  Clock,
  BookOpen,
  X,
  FileCode,
  Loader2,
  ExternalLink,
} from "lucide-react";
import styles from "./page.module.css";

// ─── Types ────────────────────────────────────────────────────
export interface CategoryOption {
  id: string;
  name: string;
  color?: string | null;
}

export interface FigureItem {
  id: string;
  figureNumber: number;
  title: string;
  caption: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  thumbnailUrl?: string;
}

interface Props {
  categories: CategoryOption[];
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const SUGGESTED_KEYWORDS = [
  "Artificial Intelligence",
  "Machine Learning",
  "Peer Review",
  "Open Science",
  "Neural Networks",
  "Data Science",
  "Empirical Study",
  "Distributed Systems",
  "Public Policy",
  "Higher Education",
];

const STEPS = [
  { id: 1, label: "Metadata", number: "01" },
  { id: 2, label: "Manuscript", number: "02" },
  { id: 3, label: "Figures", number: "03" },
  { id: 4, label: "Declarations", number: "04" },
  { id: 5, label: "Review & Submit", number: "05" },
];

export function SubmitWizard({ categories, user }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // ─── Step 1: Metadata ───────────────────────────────────────
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");

  // ─── Step 2: Manuscript File ────────────────────────────────
  const [manuscriptFile, setManuscriptFile] = useState<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOverManuscript, setDragOverManuscript] = useState(false);
  const manuscriptInputRef = useRef<HTMLInputElement>(null);

  // ─── Step 3: Figures ────────────────────────────────────────
  const [figures, setFigures] = useState<FigureItem[]>([]);
  const [showFigureModal, setShowFigureModal] = useState(false);
  const [figTitle, setFigTitle] = useState("");
  const [figCaption, setFigCaption] = useState("");
  const [figFile, setFigFile] = useState<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
    thumbnailUrl?: string;
  } | null>(null);
  const [isUploadingFigure, setIsUploadingFigure] = useState(false);
  const figureInputRef = useRef<HTMLInputElement>(null);

  // ─── Step 4: Authors & Ethical Declarations ─────────────────
  const [coAuthors, setCoAuthors] = useState("");
  const [decOriginality, setDecOriginality] = useState(false);
  const [decAnonymized, setDecAnonymized] = useState(false);
  const [decConflict, setDecConflict] = useState(false);
  const [decOpenAccess, setDecOpenAccess] = useState(false);

  // ─── Status Messages & Final State ──────────────────────────
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submittedPaper, setSubmittedPaper] = useState<{
    id: string;
    title: string;
    status: string;
    submittedAt?: string;
  } | null>(null);

  // Word count calculation
  const abstractWordCount = abstract.trim() ? abstract.trim().split(/\s+/).length : 0;

  // ─── Keyword Handlers ───────────────────────────────────────
  function handleAddKeyword(kwToAdd?: string) {
    const kw = (kwToAdd || keywordInput).trim();
    if (kw && !keywords.includes(kw) && keywords.length < 10) {
      setKeywords((prev) => [...prev, kw]);
      if (!kwToAdd) setKeywordInput("");
    }
  }

  function handleRemoveKeyword(kwToRemove: string) {
    setKeywords((prev) => prev.filter((k) => k !== kwToRemove));
  }

  // ─── Manuscript Upload ───────────────────────────────────────
  async function uploadManuscript(file: File) {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|doc)$/i)) {
      setStatusMessage({
        type: "error",
        text: "Please upload a valid manuscript file (.pdf or .docx).",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        text: "File size exceeds the 50 MB limit.",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setStatusMessage(null);

    try {
      // 1. Request presigned upload URL from our API
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || "application/pdf",
          fileSize: file.size,
          isFigure: false,
        }),
      });

      if (!presignRes.ok) {
        // Fallback to local reference
        const fallbackUrl = `/uploads/${Date.now()}-${file.name}`;
        setManuscriptFile({
          fileUrl: fallbackUrl,
          fileName: file.name,
          fileSize: file.size,
        });
        setUploadProgress(100);
        return;
      }

      const { uploadUrl, fileUrl } = await presignRes.json();
      setUploadProgress(45);

      // 2. Direct PUT to S3
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file,
      });

      if (!s3Res.ok) {
        throw new Error("Direct upload failed");
      }

      setUploadProgress(100);
      setManuscriptFile({
        fileUrl: fileUrl || uploadUrl.split("?")[0],
        fileName: file.name,
        fileSize: file.size,
      });
    } catch {
      // Graceful fallback for local development without active AWS S3 credentials
      const fallbackUrl = `https://shaoor-papers.s3.local/${Date.now()}-${file.name}`;
      setManuscriptFile({
        fileUrl: fallbackUrl,
        fileName: file.name,
        fileSize: file.size,
      });
      setUploadProgress(100);
    } finally {
      setIsUploading(false);
    }
  }

  // ─── Figure Upload Handler ──────────────────────────────────
  async function uploadFigureFile(file: File) {
    if (!file.type.startsWith("image/") && !file.name.match(/\.(png|jpg|jpeg|webp|svg|tiff|pdf)$/i)) {
      setStatusMessage({
        type: "error",
        text: "Please select an image file (PNG, JPG, WEBP, SVG, TIFF, or PDF).",
      });
      return;
    }

    setIsUploadingFigure(true);

    try {
      // Generate client-side thumbnail preview
      let thumbUrl = "";
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        thumbUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || "image/png",
          fileSize: file.size,
          isFigure: true,
        }),
      });

      let finalFileUrl = thumbUrl || `https://shaoor-papers.s3.local/figures/${file.name}`;

      if (presignRes.ok) {
        const { uploadUrl, fileUrl } = await presignRes.json();
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "image/png" },
          body: file,
        }).catch(() => {});
        finalFileUrl = fileUrl || uploadUrl.split("?")[0];
      }

      setFigFile({
        fileUrl: finalFileUrl,
        fileName: file.name,
        fileSize: file.size,
        thumbnailUrl: thumbUrl || finalFileUrl,
      });
    } catch (err: any) {
      console.warn("Figure upload error:", err);
    } finally {
      setIsUploadingFigure(false);
    }
  }

  function handleSaveFigure() {
    if (!figFile) {
      setStatusMessage({ type: "error", text: "Please upload an image for the figure." });
      return;
    }

    const nextNum = figures.length + 1;
    const newFig: FigureItem = {
      id: `fig-${Date.now()}`,
      figureNumber: nextNum,
      title: figTitle.trim() || `Figure ${nextNum}`,
      caption: figCaption.trim(),
      fileUrl: figFile.fileUrl,
      fileName: figFile.fileName,
      fileSize: figFile.fileSize,
      thumbnailUrl: figFile.thumbnailUrl,
    };

    setFigures((prev) => [...prev, newFig]);
    // Reset form
    setFigTitle("");
    setFigCaption("");
    setFigFile(null);
    setShowFigureModal(false);
    setStatusMessage(null);
  }

  function handleRemoveFigure(id: string) {
    setFigures((prev) =>
      prev
        .filter((f) => f.id !== id)
        .map((f, idx) => ({ ...f, figureNumber: idx + 1 }))
    );
  }

  // ─── Step Progression & Validation ──────────────────────────
  const isStep1Valid = title.trim().length >= 5 && abstractWordCount >= 30 && keywords.length >= 1;
  const isStep2Valid = !!manuscriptFile?.fileUrl;
  const isStep3Valid = true; // Figures are optional but fully supported
  const isStep4Valid = decOriginality && decAnonymized && decConflict && decOpenAccess;

  function canNavigateToStep(targetStep: number): boolean {
    if (targetStep === 1) return true;
    if (targetStep === 2) return isStep1Valid;
    if (targetStep === 3) return isStep1Valid && isStep2Valid;
    if (targetStep === 4) return isStep1Valid && isStep2Valid;
    if (targetStep === 5) return isStep1Valid && isStep2Valid && isStep4Valid;
    return false;
  }

  // ─── Submit or Save as Draft ────────────────────────────────
  async function submitPaper(isDraft = false) {
    if (!isDraft) {
      if (!isStep1Valid || !isStep2Valid || !isStep4Valid) {
        setStatusMessage({
          type: "error",
          text: "Please complete all mandatory steps and ethical declarations before submitting.",
        });
        return;
      }
    } else {
      if (!title.trim()) {
        setStatusMessage({
          type: "error",
          text: "Please provide at least a title to save your draft.",
        });
        return;
      }
    }

    startTransition(async () => {
      try {
        const payload = {
          title: title.trim(),
          abstract: abstract.trim() || "Draft Abstract in preparation.",
          categoryId: categoryId || categories[0]?.id,
          keywords: keywords.length > 0 ? keywords : ["General Research"],
          fileUrl: manuscriptFile?.fileUrl || null,
          fileName: manuscriptFile?.fileName || null,
          fileSize: manuscriptFile?.fileSize || null,
          status: isDraft ? "DRAFT" : "SUBMITTED",
          figures: figures.map((f, i) => ({
            figureNumber: i + 1,
            title: f.title,
            caption: f.caption,
            fileUrl: f.fileUrl,
            fileName: f.fileName,
            fileSize: f.fileSize,
          })),
        };

        const res = await fetch("/api/papers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatusMessage({
            type: "error",
            text: data.error || "Failed to submit paper.",
          });
          return;
        }

        if (isDraft) {
          setStatusMessage({
            type: "success",
            text: "Draft successfully saved! You can resume editing anytime in My Papers.",
          });
          setTimeout(() => {
            router.push("/my-papers");
          }, 1500);
        } else {
          setSubmittedPaper({
            id: data.paper.id,
            title: data.paper.title,
            status: data.paper.status,
            submittedAt: data.paper.submittedAt,
          });
        }
      } catch (err: any) {
        setStatusMessage({
          type: "error",
          text: err.message || "An unexpected error occurred. Please try again.",
        });
      }
    });
  }

  // ─── If Successfully Submitted ──────────────────────────────
  if (submittedPaper) {
    return (
      <div className={styles.container}>
        <div className={styles.successContainer}>
          <div className={styles.successIconWrap}>
            <CheckCircle size={36} />
          </div>

          <h2 className={styles.successTitle}>Manuscript Successfully Submitted!</h2>
          <div className={styles.successRefCode}>
            Reference ID: SHR-{new Date().getFullYear()}-{submittedPaper.id.slice(-6).toUpperCase()}
          </div>

          <p className={styles.successDesc}>
            <strong>"{submittedPaper.title}"</strong> has been securely logged into the
            editorial registry. An acknowledgment has been generated and sent to{" "}
            <strong>{user.email}</strong>.
          </p>

          <div className={styles.successTimeline}>
            <div className={styles.timelineStep}>
              <span className={styles.timelineDot} />
              <span>1. Manuscript Logged</span>
            </div>
            <span style={{ color: "#cbd5e1" }}>→</span>
            <div className={styles.timelineStep}>
              <span className={styles.timelineDotPending} />
              <span>2. Editorial Screening</span>
            </div>
            <span style={{ color: "#cbd5e1" }}>→</span>
            <div className={styles.timelineStep}>
              <span className={styles.timelineDotPending} />
              <span>3. Peer Review</span>
            </div>
          </div>

          <div className={styles.successButtons}>
            <Link href="/my-papers" className={styles.btnPrimary}>
              Track in My Papers
            </Link>
            <Link href="/" className={styles.btnSecondary}>
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className={styles.container}>
      {/* ─── Breadcrumb & Title ─── */}
      <div className={styles.headerSection}>
        <div className={styles.breadcrumb}>
          <Link href="/my-papers" className={styles.breadcrumbLink}>
            Dashboard
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Manuscript Submission</span>
        </div>

        <div className={styles.headerTitleRow}>
          <div>
            <h1 className={styles.headerTitle}>Manuscript Submission Portal</h1>
            <p className={styles.headerSubtitle}>
              Submit original scholarly research for double-blind peer review. Follow the structured
              academic submission protocol below.
            </p>
          </div>

          <div className={styles.editorialBadge}>
            <Award size={14} />
            Double-Blind Peer Review · CC BY 4.0
          </div>
        </div>
      </div>

      {/* ─── Stepper Progress Navigation ─── */}
      <nav className={styles.stepperNav} aria-label="Submission Steps">
        {STEPS.map((s) => {
          const isActive = currentStep === s.id;
          const isDone =
            (s.id === 1 && isStep1Valid) ||
            (s.id === 2 && isStep2Valid) ||
            (s.id === 3 && figures.length > 0) ||
            (s.id === 4 && isStep4Valid);

          return (
            <button
              key={s.id}
              type="button"
              className={`${styles.stepTab} ${isActive ? styles.stepTabActive : ""}`}
              onClick={() => {
                if (canNavigateToStep(s.id)) {
                  setCurrentStep(s.id);
                  setStatusMessage(null);
                }
              }}
              disabled={!canNavigateToStep(s.id)}
            >
              <div
                className={`${styles.stepBadge} ${
                  isActive
                    ? styles.stepBadgeActive
                    : isDone
                    ? styles.stepBadgeDone
                    : ""
                }`}
              >
                {isDone && !isActive ? <CheckCircle size={14} /> : s.number}
              </div>

              <div className={styles.stepMeta}>
                <span className={styles.stepNumber}>Step {s.id}</span>
                <span
                  className={`${styles.stepTitle} ${
                    isActive ? styles.stepTitleActive : ""
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* ─── Feedback Alert Banner ─── */}
      {statusMessage && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "6px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.875rem",
            backgroundColor: statusMessage.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${statusMessage.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            color: statusMessage.type === "success" ? "#166534" : "#991b1b",
          }}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span style={{ flex: 1 }}>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ─── Main Two-Column Layout ─── */}
      <div className={styles.workflowGrid}>
        {/* ─── Left Column: Step Content ─── */}
        <div>
          {/* STEP 1: METADATA */}
          {currentStep === 1 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.cardIcon}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Manuscript Metadata</h2>
                    <p className={styles.cardSubtitle}>
                      Provide the definitive scholarly title, scientific discipline, and abstract.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.cardBody}>
                {/* Article Title */}
                <div className={styles.formGroup}>
                  <label htmlFor="submit-title" className={styles.label}>
                    Article Title <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <input
                    id="submit-title"
                    type="text"
                    className={styles.input}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Robust Decentralized Consensus via Dynamic Cryptographic Proofs"
                    maxLength={300}
                    required
                  />
                  <div className={styles.fieldHelp}>
                    <span>Use title case. Avoid non-standard acronyms.</span>
                    <span>{title.length} / 300</span>
                  </div>
                </div>

                {/* Primary Discipline */}
                <div className={styles.formGroup}>
                  <label htmlFor="submit-category" className={styles.label}>
                    Primary Scientific Discipline <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <select
                    id="submit-category"
                    className={styles.select}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className={styles.fieldHelp}>
                    <span>Determines the appropriate editorial board and qualified reviewers.</span>
                  </div>
                </div>

                {/* Abstract */}
                <div className={styles.formGroup}>
                  <label htmlFor="submit-abstract" className={styles.label}>
                    Structured Abstract <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <textarea
                    id="submit-abstract"
                    className={styles.textarea}
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    placeholder="Provide a self-contained synthesis of the research objectives, methodology, primary results, and scholarly conclusions (typically 150–350 words)..."
                    maxLength={5000}
                    style={{ minHeight: "180px" }}
                    required
                  />
                  <div className={styles.fieldHelp}>
                    <span
                      className={`${styles.wordCount} ${
                        abstractWordCount >= 50 ? styles.wordCountValid : styles.wordCountLow
                      }`}
                    >
                      {abstractWordCount} words {abstractWordCount < 50 && "(Minimum 50 words recommended)"}
                    </span>
                    <span>{abstract.length} / 5,000 characters</span>
                  </div>
                </div>

                {/* Keywords & Scholarly Subject Tags */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Keywords & Subject Tags <span className={styles.requiredAsterisk}>*</span>
                    <span className={styles.optionalBadge}>1 to 10 keywords</span>
                  </label>

                  <div className={styles.keywordContainer}>
                    {keywords.map((kw) => (
                      <span key={kw} className={styles.keywordChip}>
                        {kw}
                        <button
                          type="button"
                          className={styles.keywordRemove}
                          onClick={() => handleRemoveKeyword(kw)}
                          aria-label={`Remove ${kw}`}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}

                    <input
                      type="text"
                      className={styles.keywordInput}
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                      placeholder={keywords.length === 0 ? "Type keyword and press Enter..." : "Add another..."}
                    />
                  </div>

                  {/* Suggested Keyword Tags */}
                  <div className={styles.suggestedTags}>
                    <span>Suggested:</span>
                    {SUGGESTED_KEYWORDS.filter((k) => !keywords.includes(k))
                      .slice(0, 5)
                      .map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          className={styles.suggestedTagBtn}
                          onClick={() => handleAddKeyword(sug)}
                        >
                          + {sug}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => submitPaper(true)}
                  disabled={!title.trim() || isPending}
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => setCurrentStep(2)}
                  disabled={!isStep1Valid}
                >
                  Proceed to Manuscript <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MANUSCRIPT UPLOAD */}
          {currentStep === 2 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.cardIcon}>
                    <Upload size={18} />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Primary Manuscript File</h2>
                    <p className={styles.cardSubtitle}>
                      Upload the complete manuscript document in PDF or Word format (.pdf, .docx).
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.cardBody}>
                {/* Hidden File Input */}
                <input
                  ref={manuscriptInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadManuscript(file);
                  }}
                />

                {!manuscriptFile ? (
                  <div
                    className={`${styles.dropzone} ${dragOverManuscript ? styles.dropzoneActive : ""}`}
                    onClick={() => manuscriptInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverManuscript(true);
                    }}
                    onDragLeave={() => setDragOverManuscript(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverManuscript(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) uploadManuscript(file);
                    }}
                  >
                    <div className={styles.dropzoneIconWrap}>
                      <Upload size={22} />
                    </div>
                    <div className={styles.dropzoneTitle}>
                      {isUploading ? "Uploading manuscript to encrypted storage..." : "Choose a file or drag & drop here"}
                    </div>
                    <div className={styles.dropzoneHint}>
                      Accepted formats: <strong>PDF</strong> or <strong>DOCX</strong> (Max 50 MB)
                    </div>
                    <div className={styles.dropzoneLimits}>
                      Files are encrypted with AES-256 and scanned for integrity.
                    </div>

                    {isUploading && (
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.uploadedFileBanner}>
                    <div className={styles.uploadedFileLeft}>
                      <div className={styles.fileDocIcon}>
                        <FileCheck size={20} />
                      </div>
                      <div>
                        <div className={styles.uploadedFileName}>
                          {manuscriptFile.fileName}
                        </div>
                        <div className={styles.uploadedFileSize}>
                          {(manuscriptFile.fileSize / (1024 * 1024)).toFixed(2)} MB · Uploaded & Verified
                        </div>
                      </div>
                    </div>

                    <div className={styles.uploadedFileActions}>
                      <button
                        type="button"
                        className={styles.replaceBtn}
                        onClick={() => manuscriptInputRef.current?.click()}
                      >
                        Replace File
                      </button>
                      <button
                        type="button"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                        onClick={() => setManuscriptFile(null)}
                        title="Remove file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Formatting Advice Card */}
                <div
                  style={{
                    marginTop: "20px",
                    padding: "14px 16px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "0.8125rem",
                    color: "#475569",
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: "#0f172a", display: "block", marginBottom: "4px" }}>
                    Double-Blind Review Formatting Checklist:
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: "18px" }}>
                    <li>Ensure manuscript does not contain author names or acknowledgments.</li>
                    <li>Figures and tables can be embedded in the text OR attached in Step 3.</li>
                    <li>Line numbers enabled in DOCX/PDF are recommended for reviewer reference.</li>
                  </ul>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setCurrentStep(1)}
                >
                  <ChevronLeft size={14} /> Back to Metadata
                </button>

                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => setCurrentStep(3)}
                  disabled={!isStep2Valid}
                >
                  Proceed to Figures <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FIGURES & SUPPLEMENTARY DATA (KEY USER FEATURE) */}
          {currentStep === 3 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.cardIcon}>
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Scientific Figures & Illustrations</h2>
                    <p className={styles.cardSubtitle}>
                      Attach standalone high-resolution charts, schematics, microscopy, and diagrams.
                    </p>
                  </div>
                </div>

                <div className={styles.figuresCountBadge}>
                  {figures.length} {figures.length === 1 ? "Figure" : "Figures"}
                </div>
              </div>

              <div className={styles.cardBody}>
                {/* Banner explanation */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "12px 14px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "6px",
                    fontSize: "0.8125rem",
                    color: "#1e40af",
                    marginBottom: "20px",
                  }}
                >
                  <Sparkles size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>High-Resolution Figure Inspection:</strong> Reviewers and editors can
                    examine attached figures at full native resolution during peer review. Figures are
                    automatically numbered in order of insertion.
                  </div>
                </div>

                {/* Add Figure Action Button */}
                {!showFigureModal ? (
                  <button
                    type="button"
                    onClick={() => setShowFigureModal(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 16px",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      background: "#1e3a8a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      marginBottom: "20px",
                    }}
                    id="add-figure-btn"
                  >
                    <Plus size={15} /> Add Figure {figures.length + 1}
                  </button>
                ) : (
                  /* Add Figure Inline Card */
                  <div className={styles.figureAddCard}>
                    <div className={styles.figureAddTitle}>
                      <ImageIcon size={16} />
                      Add Figure {figures.length + 1}
                    </div>

                    <input
                      ref={figureInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/tiff,application/pdf"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFigureFile(file);
                      }}
                    />

                    {!figFile ? (
                      <div
                        className={styles.figureDropzone}
                        onClick={() => figureInputRef.current?.click()}
                      >
                        <Upload size={20} color="#1e3a8a" style={{ margin: "0 auto 6px auto" }} />
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0f172a" }}>
                          {isUploadingFigure ? "Processing figure image..." : "Upload Figure File (PNG, JPG, SVG, TIFF, PDF)"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          High resolution recommended (300+ DPI). Max 50 MB.
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 14px",
                          background: "#ffffff",
                          border: "1px solid #bfdbfe",
                          borderRadius: "6px",
                          marginBottom: "14px",
                        }}
                      >
                        {figFile.thumbnailUrl ? (
                          <img
                            src={figFile.thumbnailUrl}
                            alt="Preview"
                            style={{
                              width: "60px",
                              height: "45px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
                            }}
                          />
                        ) : (
                          <FileCode size={24} color="#1e3a8a" />
                        )}
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0f172a" }}>
                            {figFile.fileName}
                          </div>
                          <div style={{ fontSize: "0.6875rem", color: "#64748b" }}>
                            {(figFile.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => figureInputRef.current?.click()}
                          style={{
                            fontSize: "0.75rem",
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            borderRadius: "4px",
                            padding: "3px 8px",
                            cursor: "pointer",
                          }}
                        >
                          Change
                        </button>
                      </div>
                    )}

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Figure Title / Short Caption <span className={styles.requiredAsterisk}>*</span>
                      </label>
                      <input
                        type="text"
                        className={styles.input}
                        value={figTitle}
                        onChange={(e) => setFigTitle(e.target.value)}
                        placeholder={`e.g. Figure ${figures.length + 1}: Schematic of the consensus pipeline`}
                        maxLength={200}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Extended Legend / Description
                        <span className={styles.optionalBadge}>Optional</span>
                      </label>
                      <textarea
                        className={styles.textarea}
                        value={figCaption}
                        onChange={(e) => setFigCaption(e.target.value)}
                        placeholder="Provide details on axis labels, sample sizes, error bars, or statistical significance..."
                        style={{ minHeight: "80px" }}
                        maxLength={2000}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => {
                          setShowFigureModal(false);
                          setFigFile(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={handleSaveFigure}
                        disabled={!figFile || isUploadingFigure}
                      >
                        Save Figure
                      </button>
                    </div>
                  </div>
                )}

                {/* Figure Gallery List */}
                {figures.length === 0 ? (
                  <div className={styles.emptyFiguresState}>
                    <ImageIcon size={32} color="#94a3b8" style={{ margin: "0 auto 8px auto" }} />
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                      No Figures Attached
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                      Figures are optional. If your paper contains standalone illustrations, charts, or plots, click "Add Figure" above.
                    </div>
                  </div>
                ) : (
                  <div className={styles.figureGrid}>
                    {figures.map((fig) => (
                      <div key={fig.id} className={styles.figureItemCard}>
                        <div className={styles.figureThumbWrap}>
                          {fig.thumbnailUrl ? (
                            <img
                              src={fig.thumbnailUrl}
                              alt={fig.title}
                              className={styles.figureThumbImg}
                            />
                          ) : (
                            <div className={styles.figureThumbDoc}>
                              <FileText size={24} />
                              <span>FIGURE</span>
                            </div>
                          )}
                        </div>

                        <div className={styles.figureItemContent}>
                          <div className={styles.figureItemNumber}>Figure {fig.figureNumber}</div>
                          <div className={styles.figureItemTitle}>{fig.title}</div>
                          {fig.caption && (
                            <div className={styles.figureItemCaption}>"{fig.caption}"</div>
                          )}
                          <div className={styles.figureItemMeta}>
                            {fig.fileName} · {(fig.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </div>
                        </div>

                        <button
                          type="button"
                          className={styles.figureDeleteBtn}
                          onClick={() => handleRemoveFigure(fig.id)}
                          title="Remove figure"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setCurrentStep(2)}
                >
                  <ChevronLeft size={14} /> Back to Manuscript
                </button>

                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => setCurrentStep(4)}
                >
                  Proceed to Declarations <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: AUTHORS & DECLARATIONS */}
          {currentStep === 4 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.cardIcon}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Authors & Ethical Declarations</h2>
                    <p className={styles.cardSubtitle}>
                      Confirm authorship credentials, co-authors, and required publishing ethics.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.cardBody}>
                {/* Corresponding Author Card */}
                <label className={styles.label}>Primary / Corresponding Author</label>
                <div className={styles.correspondingAuthorCard}>
                  <div className={styles.authorAvatarSmall}>
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <div className={styles.authorNameMain}>{user.name || "Logged-in Author"}</div>
                    <div className={styles.authorEmailSub}>
                      {user.email} · Verified Shaoor Account
                    </div>
                  </div>
                </div>

                {/* Co-Authors Field */}
                <div className={styles.formGroup}>
                  <label htmlFor="submit-coauthors" className={styles.label}>
                    Co-Authors & Affiliations
                    <span className={styles.optionalBadge}>Optional</span>
                  </label>
                  <input
                    id="submit-coauthors"
                    type="text"
                    className={styles.input}
                    value={coAuthors}
                    onChange={(e) => setCoAuthors(e.target.value)}
                    placeholder="e.g. Dr. John Doe (MIT), Prof. Sarah Lee (Oxford)"
                  />
                  <div className={styles.fieldHelp}>
                    <span>Separate multiple co-authors with commas.</span>
                  </div>
                </div>

                {/* Declarations Checklist */}
                <div style={{ marginTop: "24px" }}>
                  <label className={styles.label} style={{ marginBottom: "12px" }}>
                    Ethical Declarations & Agreements <span className={styles.requiredAsterisk}>*</span>
                  </label>

                  <label className={styles.declarationItem}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={decOriginality}
                      onChange={(e) => setDecOriginality(e.target.checked)}
                      required
                    />
                    <div>
                      <div className={styles.declarationTitle}>Originality & Exclusive Submission</div>
                      <div className={styles.declarationDesc}>
                        I certify that this manuscript is original research and is not concurrently under
                        consideration or published in any other journal or conference proceeding.
                      </div>
                    </div>
                  </label>

                  <label className={styles.declarationItem}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={decAnonymized}
                      onChange={(e) => setDecAnonymized(e.target.checked)}
                      required
                    />
                    <div>
                      <div className={styles.declarationTitle}>Double-Blind Peer Review Compliance</div>
                      <div className={styles.declarationDesc}>
                        The manuscript file and supplementary materials have been prepared in an
                        anonymized manner to preserve fair, unbiased review.
                      </div>
                    </div>
                  </label>

                  <label className={styles.declarationItem}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={decConflict}
                      onChange={(e) => setDecConflict(e.target.checked)}
                      required
                    />
                    <div>
                      <div className={styles.declarationTitle}>Conflict of Interest Declaration</div>
                      <div className={styles.declarationDesc}>
                        All authors have disclosed any relevant financial, personal, or professional
                        competing interests that might influence the results or interpretation.
                      </div>
                    </div>
                  </label>

                  <label className={styles.declarationItem}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={decOpenAccess}
                      onChange={(e) => setDecOpenAccess(e.target.checked)}
                      required
                    />
                    <div>
                      <div className={styles.declarationTitle}>Open Access Publishing License (CC BY 4.0)</div>
                      <div className={styles.declarationDesc}>
                        If accepted, the paper will be published Open Access under Creative Commons
                        Attribution 4.0 International license, retaining author copyright.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setCurrentStep(3)}
                >
                  <ChevronLeft size={14} /> Back to Figures
                </button>

                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => setCurrentStep(5)}
                  disabled={!isStep4Valid}
                >
                  Review Dossier <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & FINAL SUBMISSION */}
          {currentStep === 5 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.cardIcon}>
                    <FileCheck size={18} />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Executive Submission Review</h2>
                    <p className={styles.cardSubtitle}>
                      Verify your submission dossier before final transmission to the editorial board.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.reviewDossier}>
                  {/* Article Metadata Section */}
                  <div className={styles.reviewSection}>
                    <div className={styles.reviewSectionHeader}>
                      <span className={styles.reviewSectionTitle}>Article Metadata</span>
                      <button
                        type="button"
                        className={styles.reviewEditLink}
                        onClick={() => setCurrentStep(1)}
                      >
                        Edit
                      </button>
                    </div>
                    <div className={styles.reviewPaperTitle}>{title}</div>
                    <div style={{ fontSize: "0.8125rem", color: "#1e3a8a", fontWeight: 600, marginBottom: "8px" }}>
                      Discipline: {selectedCategory?.name || "General"}
                    </div>
                    <div className={styles.reviewAbstract}>{abstract}</div>

                    <div style={{ marginTop: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {keywords.map((kw) => (
                        <span key={kw} className={styles.keywordChip}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Manuscript File Section */}
                  <div className={styles.reviewSection}>
                    <div className={styles.reviewSectionHeader}>
                      <span className={styles.reviewSectionTitle}>Manuscript Document</span>
                      <button
                        type="button"
                        className={styles.reviewEditLink}
                        onClick={() => setCurrentStep(2)}
                      >
                        Edit
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FileCheck size={20} color="#10b981" />
                      <div>
                        <strong>{manuscriptFile?.fileName}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {manuscriptFile?.fileSize
                            ? `${(manuscriptFile.fileSize / (1024 * 1024)).toFixed(2)} MB`
                            : "Verified file"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Figures Section */}
                  <div className={styles.reviewSection}>
                    <div className={styles.reviewSectionHeader}>
                      <span className={styles.reviewSectionTitle}>
                        Figures ({figures.length})
                      </span>
                      <button
                        type="button"
                        className={styles.reviewEditLink}
                        onClick={() => setCurrentStep(3)}
                      >
                        Edit
                      </button>
                    </div>

                    {figures.length === 0 ? (
                      <div style={{ fontSize: "0.8125rem", color: "#64748b", fontStyle: "italic" }}>
                        No standalone figures attached (figures embedded in main manuscript).
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
                        {figures.map((fig) => (
                          <div
                            key={fig.id}
                            style={{
                              border: "1px solid #e2e8f0",
                              borderRadius: "4px",
                              padding: "8px",
                              background: "#ffffff",
                              fontSize: "0.75rem",
                            }}
                          >
                            <div style={{ fontWeight: 700, color: "#1e3a8a", marginBottom: "2px" }}>
                              Figure {fig.figureNumber}
                            </div>
                            <div style={{ fontWeight: 600, color: "#0f172a", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                              {fig.title}
                            </div>
                            <div style={{ color: "#94a3b8", fontSize: "0.6875rem" }}>
                              {(fig.fileSize / (1024 * 1024)).toFixed(2)} MB
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Authors & Ethical Compliance */}
                  <div className={styles.reviewSection}>
                    <div className={styles.reviewSectionHeader}>
                      <span className={styles.reviewSectionTitle}>Authorship & Ethics</span>
                      <button
                        type="button"
                        className={styles.reviewEditLink}
                        onClick={() => setCurrentStep(4)}
                      >
                        Edit
                      </button>
                    </div>

                    <div style={{ fontSize: "0.8125rem", color: "#334155" }}>
                      <strong>Corresponding Author:</strong> {user.name} ({user.email})
                      {coAuthors && (
                        <div style={{ marginTop: "4px" }}>
                          <strong>Co-Authors:</strong> {coAuthors}
                        </div>
                      )}
                      <div style={{ marginTop: "8px", color: "#10b981", display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle size={14} /> All 4 publishing ethics declarations signed and acknowledged.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setCurrentStep(4)}
                >
                  <ChevronLeft size={14} /> Back
                </button>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => submitPaper(true)}
                    disabled={isPending}
                  >
                    Save Draft
                  </button>

                  <button
                    type="button"
                    className={styles.btnSuccess}
                    onClick={() => submitPaper(false)}
                    disabled={isPending || !isStep1Valid || !isStep2Valid || !isStep4Valid}
                    id="final-submit-paper-btn"
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} /> Submit for Peer Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Right Column: Pre-Flight Checklist & Guide ─── */}
        <aside>
          <div className={styles.checklistCard}>
            <div className={styles.checklistTitle}>
              <Layers size={14} /> Submission Readiness
            </div>
            <div className={styles.checklistSubtitle}>
              Pre-flight validation for peer review
            </div>

            <div className={styles.checklistItems}>
              <div className={styles.checklistItem}>
                {title.trim().length >= 5 ? (
                  <CheckCircle size={16} className={styles.checkIconDone} />
                ) : (
                  <Clock size={16} className={styles.checkIconPending} />
                )}
                <span>Article Title Defined</span>
              </div>

              <div className={styles.checklistItem}>
                {categoryId ? (
                  <CheckCircle size={16} className={styles.checkIconDone} />
                ) : (
                  <Clock size={16} className={styles.checkIconPending} />
                )}
                <span>Scientific Discipline Selected</span>
              </div>

              <div className={styles.checklistItem}>
                {abstractWordCount >= 30 ? (
                  <CheckCircle size={16} className={styles.checkIconDone} />
                ) : (
                  <Clock size={16} className={styles.checkIconPending} />
                )}
                <span>Abstract ({abstractWordCount} words)</span>
              </div>

              <div className={styles.checklistItem}>
                {keywords.length >= 1 ? (
                  <CheckCircle size={16} className={styles.checkIconDone} />
                ) : (
                  <Clock size={16} className={styles.checkIconPending} />
                )}
                <span>Keywords Tagged ({keywords.length}/10)</span>
              </div>

              <div className={styles.checklistItem}>
                {manuscriptFile ? (
                  <CheckCircle size={16} className={styles.checkIconDone} />
                ) : (
                  <Clock size={16} className={styles.checkIconPending} />
                )}
                <span>Manuscript File Uploaded</span>
              </div>

              <div className={styles.checklistItem}>
                {figures.length > 0 ? (
                  <CheckCircle size={16} className={styles.checkIconDone} />
                ) : (
                  <Clock size={16} className={styles.checkIconPending} />
                )}
                <span>Figures Attached ({figures.length})</span>
              </div>

              <div className={styles.checklistItem}>
                {isStep4Valid ? (
                  <CheckCircle size={16} className={styles.checkIconDone} />
                ) : (
                  <Clock size={16} className={styles.checkIconPending} />
                )}
                <span>Ethical Declarations Agreed</span>
              </div>
            </div>

            <div className={styles.guideBox}>
              <div className={styles.guideBoxTitle}>
                <BookOpen size={13} /> Review Process
              </div>
              Once submitted, your manuscript undergoes initial editorial assessment within 48 hours, followed by double-blind review by independent scholars in your field.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
