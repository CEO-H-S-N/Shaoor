"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  ShieldCheck,
  Key,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Ban,
  CheckCircle,
  AlertCircle,
  Building,
  Mail,
  User,
} from "lucide-react";
import styles from "./createAdmin.module.css";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  affiliation: string | null;
  isActive: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
  _count?: {
    reviews: number;
    papers: number;
  };
}

interface Props {
  initialAdmins: AdminUser[];
  currentUserId: string;
  currentUserEmail: string;
}

function generateSecurePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*";
  let pwd = "";
  for (let i = 0; i < 14; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export function CreateAdminView({ initialAdmins, currentUserId, currentUserEmail }: Props) {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(generateSecurePassword());
  const [affiliation, setAffiliation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Invitation info card
  const [lastCreated, setLastCreated] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Generate random password
  function handleRegeneratePassword() {
    setPassword(generateSecurePassword());
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          affiliation: affiliation.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate administrator account");
      }

      setMessage({
        type: "success",
        text: `Administrator account for ${data.user.name || data.user.email} generated successfully!`,
      });

      setLastCreated({
        name: data.user.name || name,
        email: data.user.email || email,
        password: password,
      });

      // Refresh admins list
      const listRes = await fetch("/api/admin/create-admin");
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.admins) setAdmins(listData.admins);
      }

      // Reset form
      setName("");
      setEmail("");
      setPassword(generateSecurePassword());
      setAffiliation("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  }

  // Toggle Ban/Unban
  async function handleToggleBan(admin: AdminUser) {
    if (admin.email === "shouket.tilwani@gmail.com") {
      alert("The Platform Owner / Master Account cannot be suspended.");
      return;
    }

    const action = admin.isActive ? "temporarily suspend / ban" : "reinstate / unban";
    if (!confirm(`Are you sure you want to ${action} ${admin.name || admin.email}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${admin.id}/toggle-ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: admin.isActive ? "Suspended by Platform Administrator" : undefined }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update account status");

      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, isActive: data.user.isActive } : a))
      );
    } catch (err: any) {
      alert(err.message || "Failed to toggle status");
    }
  }

  // Delete Admin
  async function handleDelete(admin: AdminUser) {
    if (admin.email === "shouket.tilwani@gmail.com") {
      alert("The Platform Owner / Master Account cannot be deleted.");
      return;
    }

    if (admin.id === currentUserId || admin.email === currentUserEmail) {
      alert("You cannot delete your own account.");
      return;
    }

    if (!confirm(`Are you sure you want to PERMANENTLY DELETE ${admin.name || admin.email}? This action is irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${admin.id}/delete`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");

      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      alert(`Account ${admin.email} deleted successfully.`);
    } catch (err: any) {
      alert(err.message || "Failed to delete account");
    }
  }

  // Copy invitation note
  function copyInviteText() {
    if (!lastCreated) return;
    const text = `Dear ${lastCreated.name},\n\nYou have been registered as an Academic Administrator on the Shaoor Journal Platform.\n\nLogin URL: https://shaoor.org/login\nEmail: ${lastCreated.email}\nInitial Password: ${lastCreated.password}\n\nPlease sign in, review pending submissions, and customize your academic profile in Settings.\n\nBest regards,\nDr. Shoukat Tilwani\nEditor-in-Chief, Shaoor Academic Journal`;
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  }

  return (
    <div className={styles.container}>
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <nav className={styles.breadcrumb}>
          <Link href="/my-papers" className={styles.breadcrumbLink}>Dashboard</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Make Admin Account</span>
        </nav>
        <div className={styles.headerText}>
          <h1>Make Admin Account</h1>
          <p className={styles.headerSubtitle}>
            Authorize professors, department chairs, and editorial board members with full administrative privileges.
          </p>
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

      {/* ── Two-Column Creation & Invitation Area ──────────── */}
      <div className={styles.grid}>
        {/* Create Form */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <UserPlus size={18} color="#1e3a8a" />
              Generate Administrator Account
            </h2>
            <p className={styles.cardDesc}>
              Creates a valid account with access to the Review Queue and Paper Management.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Professor / Scholar Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Prof. Tariq Mahmood"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Institutional Email Address <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. t.mahmood@university.edu"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className={styles.hint}>
                This email will be immediately verified and active on the platform.
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Initial Password <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordWrap}>
                <input
                  type="text"
                  required
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.genBtn}
                  onClick={handleRegeneratePassword}
                  title="Generate a new secure random password"
                >
                  <RefreshCw size={14} />
                  Randomize
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Institutional Affiliation / University</label>
              <input
                type="text"
                placeholder="e.g. Stanford University, Dept. of Applied Sciences"
                className={styles.input}
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
              id="submit-create-admin-btn"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Generating Account...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Create Admin Account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right side: Instructions / Invitation Dispatch */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Key size={18} color="#1e3a8a" />
              Invitation Dispatch
            </h2>
            <p className={styles.cardDesc}>
              Copy the credentials below to deliver them to the designated scholar.
            </p>
          </div>

          {lastCreated ? (
            <div className={styles.inviteBox}>
              <div className={styles.inviteSuccessBadge}>
                <Check size={12} />
                Admin Credentials Ready
              </div>
              <div className={styles.invitePreview}>
{`Dear ${lastCreated.name},

You have been registered as an Academic Administrator on the Shaoor Journal Platform.

Login URL: https://shaoor.org/login
Email: ${lastCreated.email}
Password: ${lastCreated.password}

Please sign in to access the Review Queue and complete your profile in Settings.`}
              </div>

              <button
                type="button"
                onClick={copyInviteText}
                className={styles.copyInviteBtn}
                id="copy-admin-invite-btn"
              >
                {copiedInvite ? <Check size={14} /> : <Copy size={14} />}
                {copiedInvite ? "Invitation Copied!" : "Copy Full Invitation"}
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                color: "#64748b",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px dashed #cbd5e1",
              }}
            >
              <Mail size={32} style={{ margin: "0 auto 12px auto", color: "#94a3b8" }} />
              <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#334155" }}>
                Ready to Generate
              </div>
              <p style={{ fontSize: "0.8125rem", margin: "6px 0 0 0" }}>
                Fill out the scholar's information on the left. Once created, a personalized ready-to-send invitation note will appear here.
              </p>
            </div>
          )}

          <div style={{ marginTop: "20px", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.6 }}>
            <strong>Permissions Granted:</strong>
            <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
              <li>Full evaluation access to the Peer Review Queue (`/review`)</li>
              <li>Manuscript submission & tracking privileges</li>
              <li>Academic Profile customization via Settings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Table: Certified Platform Administrators ───────── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>
            Certified Platform Administrators
          </div>
          <span className={styles.tableCount}>{admins.length} Admins</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Affiliation</th>
                <th>Status</th>
                <th>Activity</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No administrators found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const isOwner = admin.email === "shouket.tilwani@gmail.com";
                  const isSelf = admin.id === currentUserId || admin.email === currentUserEmail;

                  return (
                    <tr key={admin.id}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.avatar}>
                            {admin.name
                              ? admin.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                              : "AD"}
                          </div>
                          <div>
                            <div className={styles.userName}>
                              {admin.name || "Administrator"}
                              {isOwner && (
                                <span style={{ marginLeft: "6px", fontSize: "10px", background: "#fef3c7", color: "#b45309", padding: "1px 6px", borderRadius: "9999px", fontWeight: 700 }}>
                                  OWNER
                                </span>
                              )}
                            </div>
                            <div className={styles.userEmail}>{admin.email}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.8125rem", color: "#475569" }}>
                          {admin.affiliation || "—"}
                        </span>
                      </td>

                      <td>
                        {admin.isActive ? (
                          <span className={styles.statusActive}>
                            <CheckCircle size={11} />
                            Active
                          </span>
                        ) : (
                          <span className={styles.statusBanned}>
                            <Ban size={11} />
                            Suspended
                          </span>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {admin._count?.reviews ?? 0} reviews • {admin._count?.papers ?? 0} papers
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {new Date(admin.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div className={styles.actionsCell} style={{ justifyContent: "flex-end" }}>
                          {!isOwner && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleBan(admin)}
                                className={styles.actionBtn}
                                title={admin.isActive ? "Temporarily Suspend Account" : "Activate Account"}
                              >
                                <Ban size={12} color={admin.isActive ? "#b91c1c" : "#15803d"} />
                                {admin.isActive ? "Suspend" : "Reinstate"}
                              </button>

                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(admin)}
                                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                  title="Permanently Delete Admin Account"
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
