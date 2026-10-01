"use client";

import React, { useState, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Building2,
  FileText,
  Upload,
  Sparkles,
  Trash2,
  CheckCircle,
  AlertCircle,
  Lock,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Award,
  Info,
  X,
  Loader2,
} from "lucide-react";
import styles from "./settings.module.css";

// ─── Academic Vector Avatar Presets (Static SVGs to prevent cookie bloat) ───
export const ACADEMIC_AVATARS = [
  {
    id: "scholar-indigo",
    label: "Indigo Scholar",
    bg: "#1e3a8a",
    url: "/avatars/scholar-indigo.svg",
  },
  {
    id: "scientist-emerald",
    label: "Emerald Bio",
    bg: "#065f46",
    url: "/avatars/scientist-emerald.svg",
  },
  {
    id: "theorist-violet",
    label: "Violet Physics",
    bg: "#581c87",
    url: "/avatars/theorist-violet.svg",
  },
  {
    id: "astronomer-amber",
    label: "Amber Cosmos",
    bg: "#78350f",
    url: "/avatars/astronomer-amber.svg",
  },
  {
    id: "mathematician-slate",
    label: "Slate Math",
    bg: "#0f172a",
    url: "/avatars/mathematician-slate.svg",
  },
  {
    id: "cyan-engineer",
    label: "Cyan Systems",
    bg: "#0e7490",
    url: "/avatars/cyan-engineer.svg",
  },
];

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  role: "CUSTOMER" | "ADMIN" | "DESIGNER";
  affiliation: string | null;
  bio: string | null;
  orcidId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    papers: number;
    reviews: number;
  };
}

interface Props {
  initialUser: UserProfile;
}

export function SettingsForm({ initialUser }: Props) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState(initialUser.name || "");
  const [username, setUsername] = useState(initialUser.username || "");
  const [image, setImage] = useState<string | null>(initialUser.image || null);
  const [affiliation, setAffiliation] = useState(initialUser.affiliation || "");
  const [bio, setBio] = useState(initialUser.bio || "");
  const [orcidId, setOrcidId] = useState(initialUser.orcidId || "");

  // UI state
  const [showPresets, setShowPresets] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Check if form is dirty
  const isDirty =
    name !== (initialUser.name || "") ||
    username !== (initialUser.username || "") ||
    image !== (initialUser.image || null) ||
    affiliation !== (initialUser.affiliation || "") ||
    bio !== (initialUser.bio || "") ||
    orcidId !== (initialUser.orcidId || "");

  // Format ORCID input as 0000-0000-0000-0000
  function handleOrcidChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.toUpperCase().replace(/[^0-9X-]/g, "");
    // Auto-hyphenate if typing cleanly
    const digitsOnly = val.replace(/-/g, "");
    if (digitsOnly.length > 0) {
      const parts = [];
      for (let i = 0; i < digitsOnly.length && i < 16; i += 4) {
        parts.push(digitsOnly.slice(i, i + 4));
      }
      val = parts.join("-");
    }
    setOrcidId(val.slice(0, 19));
    setStatusMessage(null);
  }

  // Handle client-side square crop and direct S3 upload (avoids base64 cookie bloat)
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "Please upload an image file (JPEG, PNG, WEBP)." });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Selected image exceeds 8MB. Please choose a smaller file." });
      return;
    }

    setUploadingImage(true);
    setStatusMessage(null);

    try {
      const reader = new FileReader();
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = fileDataUrl;
      });

      // Canvas square crop to 256x256
      const canvas = document.createElement("canvas");
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize image processor");

      const minDim = Math.min(img.width, img.height);
      const startX = (img.width - minDim) / 2;
      const startY = (img.height - minDim) / 2;
      ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85);
      });

      if (!blob) throw new Error("Could not compress avatar image");

      // Request S3 presigned upload URL via existing /api/upload
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: `avatar-${Date.now()}.jpg`,
          fileType: "image/jpeg",
          fileSize: blob.size,
          isFigure: true,
        }),
      });

      if (!presignRes.ok) {
        const errData = await presignRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to initialize image upload");
      }

      const { uploadUrl, fileUrl } = await presignRes.json();

      // Upload directly to S3
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });

      if (!s3Res.ok) {
        throw new Error("Failed to save image to cloud storage");
      }

      setImage(fileUrl);
      setStatusMessage({ type: "success", text: "Photo uploaded successfully! Click 'Save Changes' to update your profile." });
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to upload image. Please try again.",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  function handleReset() {
    setName(initialUser.name || "");
    setUsername(initialUser.username || "");
    setImage(initialUser.image || null);
    setAffiliation(initialUser.affiliation || "");
    setBio(initialUser.bio || "");
    setOrcidId(initialUser.orcidId || "");
    setStatusMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    // Basic client checks
    if (!name.trim()) {
      setStatusMessage({ type: "error", text: "Name cannot be empty." });
      return;
    }

    if (orcidId.trim() && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcidId.trim())) {
      setStatusMessage({
        type: "error",
        text: "ORCID iD must follow the 16-digit format: 0000-0000-0000-0000.",
      });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            username: username.trim() || null,
            image: image || null,
            affiliation: affiliation.trim() || null,
            bio: bio.trim() || null,
            orcidId: orcidId.trim() || null,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatusMessage({
            type: "error",
            text: data.error || "Failed to update profile.",
          });
          return;
        }

        // Update Auth.js session in the browser immediately
        await updateSession({
          name: name.trim(),
          image: image || null,
        });

        setStatusMessage({
          type: "success",
          text: "Your profile and settings have been saved successfully!",
        });

        router.refresh();
      } catch (err: any) {
        setStatusMessage({
          type: "error",
          text: err.message || "A network error occurred. Please try again.",
        });
      }
    });
  }

  // Format date helper
  const memberSince = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(initialUser.createdAt));

  const roleLabel =
    initialUser.role === "DESIGNER"
      ? "Platform Designer"
      : initialUser.role === "ADMIN"
      ? "Reviewer / Editor"
      : "Author & Researcher";

  const userInitial = name ? name[0].toUpperCase() : "U";

  return (
    <div className={styles.container}>
      {/* ─── Breadcrumb & Title ─── */}
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumb}>
          <Link href="/my-papers" className={styles.breadcrumbLink}>
            Dashboard
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Account Settings</span>
        </div>
        <div className={styles.headerText}>
          <h1>Account Settings</h1>
          <p className={styles.headerSubtitle}>
            Update your profile picture, academic identity, institutional affiliation, and research bio.
          </p>
        </div>
      </div>

      {/* ─── Notification Banner ─── */}
      {statusMessage && (
        <div
          className={`${styles.banner} ${
            statusMessage.type === "success" ? styles.bannerSuccess : styles.bannerError
          }`}
          role="alert"
        >
          {statusMessage.type === "success" ? (
            <CheckCircle size={18} className={styles.bannerIcon} />
          ) : (
            <AlertCircle size={18} className={styles.bannerIcon} />
          )}
          <span>{statusMessage.text}</span>
          <button
            type="button"
            className={styles.bannerClose}
            onClick={() => setStatusMessage(null)}
            aria-label="Dismiss alert"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className={styles.layoutGrid}>
        {/* ─── Left Column: Form ─── */}
        <form onSubmit={handleSubmit}>
          {/* Card 1: Profile Photo */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <User size={16} color="#1e3a8a" />
                Profile Picture
              </h2>
              <p className={styles.cardSubtitle}>
                Add a professional photo or select an academic scholar avatar.
              </p>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarContainer}>
                  {image ? (
                    <img
                      src={image}
                      alt={name || "User Avatar"}
                      className={styles.avatarImage}
                    />
                  ) : (
                    <div className={styles.avatarFallback}>{userInitial}</div>
                  )}
                </div>

                <div className={styles.avatarControls}>
                  <div className={styles.avatarButtons}>
                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      style={{ display: "none" }}
                      onChange={handleImageUpload}
                    />

                    <button
                      type="button"
                      className={styles.uploadBtn}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      id="upload-pfp-btn"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 size={14} className={styles.loadingSpinner} />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          Upload Photo
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className={styles.presetToggleBtn}
                      onClick={() => setShowPresets(!showPresets)}
                      disabled={uploadingImage}
                      id="toggle-presets-btn"
                    >
                      <Sparkles size={14} />
                      {showPresets ? "Hide Presets" : "Scholar Avatars"}
                    </button>

                    {image && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => setImage(null)}
                        disabled={uploadingImage}
                        title="Remove custom photo"
                        id="remove-pfp-btn"
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    )}
                  </div>

                  <p className={styles.avatarHelp}>
                    Supports JPG, PNG, or WebP. Auto-centered and uploaded securely to cloud storage.
                  </p>
                </div>
              </div>

              {/* Scholar Presets Picker */}
              {showPresets && (
                <div className={styles.presetsContainer}>
                  <div className={styles.presetsTitle}>Select an Academic Motif:</div>
                  <div className={styles.presetsGrid}>
                    {ACADEMIC_AVATARS.map((preset) => {
                      const isSelected = image === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          className={`${styles.presetOption} ${
                            isSelected ? styles.presetOptionActive : ""
                          }`}
                          onClick={() => {
                            setImage(preset.url);
                            setStatusMessage(null);
                          }}
                          title={preset.label}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className={styles.presetSvg}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Personal & Identity Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <FileText size={16} color="#1e3a8a" />
                Personal Information
              </h2>
              <p className={styles.cardSubtitle}>
                Your name as it appears on published papers and reviews.
              </p>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.formGrid2}>
                {/* Full Name */}
                <div className={styles.formGroup}>
                  <label htmlFor="settings-name" className={styles.label}>
                    Full Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    id="settings-name"
                    type="text"
                    className={styles.input}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setStatusMessage(null);
                    }}
                    placeholder="e.g. Dr. Aisha Rahman"
                    required
                  />
                  <div className={styles.fieldHelp}>
                    <span>Display name on all paper submissions</span>
                  </div>
                </div>

                {/* Username */}
                <div className={styles.formGroup}>
                  <label htmlFor="settings-username" className={styles.label}>
                    Username
                    <span className={styles.optionalBadge}>Optional</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputPrefix}>@</span>
                    <input
                      id="settings-username"
                      type="text"
                      className={`${styles.input} ${styles.inputWithPrefix}`}
                      value={username}
                      onChange={(e) => {
                        setUsername(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_-]/g, "")
                        );
                        setStatusMessage(null);
                      }}
                      placeholder="username"
                      maxLength={30}
                    />
                  </div>
                  <div className={styles.fieldHelp}>
                    <span>Unique handle for your public profile</span>
                  </div>
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div className={styles.formGroup}>
                <label htmlFor="settings-email" className={styles.label}>
                  Email Address
                  <span className={styles.optionalBadge}>Primary Account</span>
                </label>
                <div className={styles.inputWrap}>
                  <Mail size={15} className={styles.inputIcon} />
                  <input
                    id="settings-email"
                    type="email"
                    className={`${styles.input} ${styles.inputWithIcon} ${styles.inputDisabled}`}
                    value={initialUser.email || ""}
                    disabled
                    readOnly
                  />
                  <div className={styles.inputRightBadge}>
                    <Lock size={10} />
                    Verified
                  </div>
                </div>
                <div className={styles.fieldHelp}>
                  <span>Email is locked to protect your publication authorship.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Academic Affiliation & ORCID */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Building2 size={16} color="#1e3a8a" />
                Academic Affiliation & ORCID
              </h2>
              <p className={styles.cardSubtitle}>
                Link your institutional credentials and scholarly persistent identifier.
              </p>
            </div>

            <div className={styles.cardBody}>
              {/* Institution / Affiliation */}
              <div className={styles.formGroup}>
                <label htmlFor="settings-affiliation" className={styles.label}>
                  Affiliation / University
                  <span className={styles.optionalBadge}>Recommended</span>
                </label>
                <div className={styles.inputWrap}>
                  <Building2 size={15} className={styles.inputIcon} />
                  <input
                    id="settings-affiliation"
                    type="text"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    value={affiliation}
                    onChange={(e) => {
                      setAffiliation(e.target.value);
                      setStatusMessage(null);
                    }}
                    placeholder="e.g. Department of Computer Science, University of Oxford"
                    maxLength={200}
                  />
                </div>
                <div className={styles.fieldHelp}>
                  <span>Your current university, research laboratory, or company</span>
                </div>
              </div>

              {/* ORCID iD */}
              <div className={styles.formGroup}>
                <label htmlFor="settings-orcid" className={styles.label}>
                  ORCID iD
                  <span className={styles.optionalBadge}>Persistent Identifier</span>
                </label>
                <div className={styles.inputWrap}>
                  <span
                    style={{
                      position: "absolute",
                      left: "12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#a6ce39",
                      pointerEvents: "none",
                    }}
                  >
                    iD
                  </span>
                  <input
                    id="settings-orcid"
                    type="text"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    value={orcidId}
                    onChange={handleOrcidChange}
                    placeholder="0000-0002-1825-0097"
                    maxLength={19}
                  />
                  {orcidId && /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcidId) && (
                    <a
                      href={`https://orcid.org/${orcidId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.orcidLinkBtn}
                      style={{ position: "absolute", right: "12px" }}
                      title="View live ORCID record"
                    >
                      <ExternalLink size={13} />
                      Verify
                    </a>
                  )}
                </div>
                <div className={styles.fieldHelp}>
                  <span>
                    Connects your papers across scientific repositories. Format: 0000-0000-0000-0000
                  </span>
                </div>
              </div>

              {/* Bio / Research Interests */}
              <div className={styles.formGroup}>
                <label htmlFor="settings-bio" className={styles.label}>
                  Research Bio & Interests
                  <span className={styles.optionalBadge}>Up to 2,000 characters</span>
                </label>
                <textarea
                  id="settings-bio"
                  className={styles.textarea}
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    setStatusMessage(null);
                  }}
                  placeholder="Summarize your scholarly background, primary research fields, and scientific interests..."
                  maxLength={2000}
                />
                <div className={styles.fieldHelp}>
                  <span>Displayed on your public papers and reviewer profiles</span>
                  <span
                    className={`${styles.charCount} ${
                      bio.length > 1800 ? styles.charCountNear : ""
                    }`}
                  >
                    {bio.length} / 2,000
                  </span>
                </div>
              </div>
            </div>

            {/* Sticky Actions Bar */}
            <div className={styles.cardActions}>
              <div className={styles.changesStatus}>
                {isDirty ? (
                  <>
                    <span className={styles.dirtyDot} />
                    <span>Unsaved changes</span>
                  </>
                ) : (
                  <>
                    <span className={styles.cleanDot} />
                    <span>All changes saved</span>
                  </>
                )}
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleReset}
                  disabled={!isDirty || isPending}
                >
                  Discard
                </button>

                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={!isDirty || isPending}
                  id="save-settings-btn"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* ─── Right Column: Live Identity Preview & Academic Stats ─── */}
        <aside className={styles.sidebarCol}>
          {/* Live Preview Card */}
          <div className={styles.previewCard}>
            <div className={styles.previewTop} />
            <div className={styles.previewBody}>
              <div className={styles.previewAvatarWrap}>
                {image ? (
                  <img
                    src={image}
                    alt={name || "User Avatar"}
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarFallback}>{userInitial}</div>
                )}
              </div>

              <h3 className={styles.previewName}>{name || "Anonymous Scholar"}</h3>
              <div className={styles.previewHandle}>
                {username ? `@${username}` : initialUser.email}
              </div>

              <div className={styles.roleBadge}>{roleLabel}</div>

              <div className={styles.previewMeta}>
                <div className={styles.previewMetaRow} title={affiliation || "No affiliation added"}>
                  <Building2 size={14} className={styles.previewMetaIcon} />
                  <span>{affiliation || "No institution specified"}</span>
                </div>

                {orcidId && /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcidId) ? (
                  <div className={styles.previewMetaRow}>
                    <a
                      href={`https://orcid.org/${orcidId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.orcidBadge}
                    >
                      <span
                        style={{
                          background: "#a6ce39",
                          color: "#fff",
                          padding: "1px 4px",
                          borderRadius: "3px",
                          fontSize: "10px",
                          fontWeight: 700,
                        }}
                      >
                        iD
                      </span>
                      {orcidId}
                    </a>
                  </div>
                ) : (
                  <div className={styles.previewMetaRow} style={{ color: "#94a3b8" }}>
                    <ShieldCheck size={14} className={styles.previewMetaIcon} />
                    <span>ORCID not connected</span>
                  </div>
                )}
              </div>

              {bio ? (
                <div className={styles.previewBio}>
                  "{bio.length > 160 ? `${bio.slice(0, 160)}...` : bio}"
                </div>
              ) : (
                <div className={styles.previewBio} style={{ color: "#94a3b8" }}>
                  "No academic bio provided yet. Add your scholarly focus to help editors find you."
                </div>
              )}
            </div>
          </div>

          {/* Academic Stats Summary */}
          <div className={styles.statsCard}>
            <div className={styles.statsTitle}>Academic Portfolio</div>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {initialUser._count?.papers ?? 0}
                </div>
                <div className={styles.statText}>Papers Authored</div>
              </div>

              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {initialUser._count?.reviews ?? 0}
                </div>
                <div className={styles.statText}>Reviews Completed</div>
              </div>
            </div>

            <div className={styles.infoTip}>
              <Info size={14} style={{ flexShrink: 0 }} />
              <div>
                <strong>Member Since:</strong> {memberSince}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
