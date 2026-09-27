"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  ExternalLink,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Upload,
  RefreshCw,
} from "lucide-react";
import styles from "./teamEditor.module.css";

export interface TeamMemberItem {
  id: string;
  name: string;
  designation: string;
  institution: string;
  summary: string;
  image: string | null;
  email: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Props {
  initialMembers: TeamMemberItem[];
}

export function TeamEditorView({ initialMembers }: Props) {
  const [members, setMembers] = useState<TeamMemberItem[]>(initialMembers);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [institution, setInstitution] = useState("");
  const [summary, setSummary] = useState("");
  const [image, setImage] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Picture file upload helper
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImage(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  // Submit add or edit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (editingId) {
        // Edit mode
        const res = await fetch(`/api/admin/team/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            designation: designation.trim(),
            institution: institution.trim(),
            summary: summary.trim(),
            image: image || null,
            email: email.trim() || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update member");

        setMembers((prev) =>
          prev.map((m) => (m.id === editingId ? { ...m, ...data.member } : m))
        );
        setMessage({ type: "success", text: `${data.member.name} updated successfully!` });
        cancelEdit();
      } else {
        // Create mode
        const res = await fetch("/api/admin/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            designation: designation.trim(),
            institution: institution.trim(),
            summary: summary.trim(),
            image: image || null,
            email: email.trim() || null,
            sortOrder: members.length + 1,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add team member");

        setMembers((prev) => [...prev, data.member]);
        setMessage({ type: "success", text: `${data.member.name} added to Our Team!` });

        // Reset form
        setName("");
        setDesignation("");
        setInstitution("");
        setSummary("");
        setImage("");
        setEmail("");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save team member" });
    } finally {
      setLoading(false);
    }
  }

  function startEdit(member: TeamMemberItem) {
    setEditingId(member.id);
    setName(member.name);
    setDesignation(member.designation);
    setInstitution(member.institution);
    setSummary(member.summary);
    setImage(member.image || "");
    setEmail(member.email || "");
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setDesignation("");
    setInstitution("");
    setSummary("");
    setImage("");
    setEmail("");
  }

  // Delete
  async function handleDelete(member: TeamMemberItem) {
    if (!confirm(`Are you sure you want to remove ${member.name} from Our Team?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/team/${member.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete member");

      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      if (editingId === member.id) cancelEdit();
      setMessage({ type: "success", text: `${member.name} removed from Our Team.` });
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  }

  // Reorder
  async function handleMove(index: number, direction: "up" | "down") {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === members.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newMembers = [...members];
    const temp = newMembers[index];
    newMembers[index] = newMembers[targetIndex];
    newMembers[targetIndex] = temp;

    // Update sortOrder
    const updated = newMembers.map((m, i) => ({ ...m, sortOrder: i + 1 }));
    setMembers(updated);

    // Save orders in background
    for (const m of updated) {
      fetch(`/api/admin/team/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: m.sortOrder }),
      }).catch(() => null);
    }
  }

  return (
    <div className={styles.container}>
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <nav className={styles.breadcrumb}>
          <Link href="/my-papers" className={styles.breadcrumbLink}>Dashboard</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Edit Our Team</span>
        </nav>
        <div className={styles.headerText}>
          <div>
            <h1>Edit Our Team &amp; Editorial Board</h1>
            <p className={styles.headerSubtitle}>
              Manage public editorial leadership, board members, academic reviewers, and bios.
            </p>
          </div>

          <Link
            href="/team"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewPublicLink}
          >
            <ExternalLink size={14} />
            View Public Page
          </Link>
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

      {/* ── Grid: Form on Left, List on Right ───────────────── */}
      <div className={styles.grid}>
        {/* Form Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <UserPlus size={18} color="#1e3a8a" />
              {editingId ? "Edit Team Member" : "Add Team Member"}
            </h2>
            <p className={styles.cardDesc}>
              {editingId
                ? "Update this scholar's institutional role and biographical summary."
                : "Add an editor, advisory board scholar, or reviewer to the public directory."}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Full Name &amp; Title <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Shoukat Tilwani"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Designation / Editorial Role <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Editor-in-Chief / Section Editor"
                className={styles.input}
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Institution / University <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Stanford Institute for Theoretical Science"
                className={styles.input}
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Scholar Photo / Picture</label>
              <div className={styles.imageUploadWrap}>
                <div className={styles.avatarPreview}>
                  {image ? (
                    <img src={image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span>{name ? name.charAt(0) : "IMG"}</span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    id="team-photo-upload"
                    style={{ display: "none" }}
                    onChange={handleImageUpload}
                  />
                  <label
                    htmlFor="team-photo-upload"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 12px",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    <Upload size={13} />
                    Upload Photo
                  </label>
                  <input
                    type="text"
                    placeholder="Or paste image URL directly..."
                    className={styles.input}
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Short Biographical Summary <span className={styles.required}>*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Brief summary of research domains, career background, and scholarly achievements..."
                className={styles.textarea}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
                id="submit-team-member-btn"
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Saving to DB...
                  </>
                ) : editingId ? (
                  "Update Team Member"
                ) : (
                  "Add to Our Team"
                )}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={{
                    padding: "10px 18px",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    color: "#475569",
                    cursor: "pointer",
                    marginTop: "8px",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Members Directory Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Users size={18} color="#1e3a8a" />
              Current Team Members ({members.length})
            </h2>
            <p className={styles.cardDesc}>
              Reorder or edit scholars as they appear on the public editorial page.
            </p>
          </div>

          <div>
            {members.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "0.875rem" }}>
                No team members added yet. Use the form to add the first scholar.
              </div>
            ) : (
              members.map((member, idx) => (
                <div key={member.id} className={styles.memberItem}>
                  {member.image ? (
                    <img src={member.image} alt={member.name} className={styles.memberImg} />
                  ) : (
                    <div className={styles.memberImg}>
                      {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                  )}

                  <div className={styles.memberInfo}>
                    <div className={styles.memberName}>{member.name}</div>
                    <span className={styles.memberDesignation}>{member.designation}</span>
                    <div className={styles.memberInstitution}>{member.institution}</div>
                    <p className={styles.memberSummary}>{member.summary}</p>
                  </div>

                  <div className={styles.memberActions}>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "up")}
                      disabled={idx === 0}
                      className={styles.iconBtn}
                      title="Move up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "down")}
                      disabled={idx === members.length - 1}
                      className={styles.iconBtn}
                      title="Move down"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(member)}
                      className={styles.iconBtn}
                      title="Edit member"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(member)}
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      title="Delete member"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
