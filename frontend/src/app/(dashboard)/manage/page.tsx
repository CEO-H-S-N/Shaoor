import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Users,
  FolderKanban,
  BarChart3,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Management Portal — Shaoor",
  description: "Designer-only control panel for managing users, categories, and analytics on Shaoor.",
};

// ── Demo Data ─────────────────────────────────────────────────
const DEMO_USERS = [
  { id: "u1", name: "Dr. Aisha Siddiqui", email: "aisha@lums.edu.pk", role: "ADMIN", papers: 12, joinedAt: "2026-03-10", active: true },
  { id: "u2", name: "Prof. Zahir Rahman", email: "zahir@ku.edu.pk", role: "CUSTOMER", papers: 4, joinedAt: "2026-06-22", active: true },
  { id: "u3", name: "Dr. Bilal Chaudhry", email: "bilal@nu.edu.pk", role: "CUSTOMER", papers: 7, joinedAt: "2026-07-05", active: true },
  { id: "u4", name: "Eng. Fatima Al-Noor", email: "fatima@ned.edu.pk", role: "CUSTOMER", papers: 2, joinedAt: "2026-08-14", active: false },
  { id: "u5", name: "Dr. Mariam Karim", email: "mariam@aku.edu.pk", role: "ADMIN", papers: 9, joinedAt: "2026-05-01", active: true },
];

const DEMO_CATEGORIES = [
  { id: "c1", name: "Medicine & Health Sciences", color: "#e53e3e", papers: 23 },
  { id: "c2", name: "Computer Science", color: "#3182ce", papers: 41 },
  { id: "c3", name: "Social Sciences", color: "#d69e2e", papers: 17 },
  { id: "c4", name: "Engineering", color: "#38a169", papers: 29 },
  { id: "c5", name: "Natural Sciences", color: "#805ad5", papers: 14 },
  { id: "c6", name: "Business & Economics", color: "#dd6b20", papers: 8 },
];

const ANALYTICS = {
  totalUsers:      DEMO_USERS.length,
  activeUsers:     DEMO_USERS.filter((u) => u.active).length,
  totalCategories: DEMO_CATEGORIES.length,
  totalPapers:     DEMO_CATEGORIES.reduce((acc, c) => acc + c.papers, 0),
  monthlyBar: [
    { month: "Apr", submitted: 14, published: 8 },
    { month: "May", submitted: 22, published: 13 },
    { month: "Jun", submitted: 18, published: 11 },
    { month: "Jul", submitted: 31, published: 19 },
    { month: "Aug", submitted: 27, published: 16 },
    { month: "Sep", submitted: 20, published: 10 },
  ],
};

const maxSubmitted = Math.max(...ANALYTICS.monthlyBar.map((m) => m.submitted));

export default async function ManagePage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  // Only Designers can access this portal
  if (role !== "DESIGNER") {
    redirect("/my-papers");
  }

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>Management Portal</h1>
          <p>Platform administration — users, categories &amp; analytics</p>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-accent-600)", background: "var(--color-accent-50)", border: "1px solid var(--color-accent-200)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-full)" }}>
          <ShieldCheck size={14} />
          Designer Access
        </span>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}><Users size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statNumber}>{ANALYTICS.totalUsers}</div>
            <div className={styles.statLabel}>Total Users</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}><CheckCircle size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statNumber}>{ANALYTICS.activeUsers}</div>
            <div className={styles.statLabel}>Active Users</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPurple}`}><FolderKanban size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statNumber}>{ANALYTICS.totalCategories}</div>
            <div className={styles.statLabel}>Categories</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}><FileText size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statNumber}>{ANALYTICS.totalPapers}</div>
            <div className={styles.statLabel}>Total Papers</div>
          </div>
        </div>
      </div>

      {/* ── Users Table ────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <Users size={16} />
            User Management
          </span>
          <Button variant="primary" size="sm">
            <Plus size={14} />
            Invite User
          </Button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Papers</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_USERS.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.roleBadge} ${
                      user.role === "DESIGNER" ? styles.roleDesigner :
                      user.role === "ADMIN" ? styles.roleAdmin :
                      styles.roleCustomer
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.papers}</td>
                  <td>{user.joinedAt}</td>
                  <td>
                    <span className={user.active ? styles.statusActive : styles.statusInactive}>
                      {user.active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-1)" }}>
                      <button
                        className={styles.iconBtn}
                        title="Edit role"
                        id={`edit-user-${user.id}`}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className={styles.iconBtn}
                        title={user.active ? "Deactivate" : "Activate"}
                        id={`toggle-user-${user.id}`}
                      >
                        <ToggleLeft size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Categories + Analytics Row ──────────────────────── */}
      <div className={styles.analyticsGrid}>
        {/* Categories */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <FolderKanban size={16} />
              Categories
            </span>
            <Button variant="outline" size="sm">
              <Plus size={14} />
              Add
            </Button>
          </div>
          <div className={styles.categoryList}>
            {DEMO_CATEGORIES.map((cat) => (
              <div key={cat.id} className={styles.categoryRow}>
                <div
                  className={styles.categoryDot}
                  style={{ background: cat.color }}
                />
                <span className={styles.categoryName}>{cat.name}</span>
                <span className={styles.categoryCount}>{cat.papers} papers</span>
                <div className={styles.categoryActions}>
                  <button className={styles.iconBtn} title="Edit" id={`edit-cat-${cat.id}`}>
                    <Edit size={13} />
                  </button>
                  <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Delete" id={`del-cat-${cat.id}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Submission Analytics */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <BarChart3 size={16} />
              Monthly Activity
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-400)" }}>
              Last 6 months
            </span>
          </div>
          <div style={{ padding: "var(--space-5) var(--space-6)" }}>
            {/* Legend */}
            <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-neutral-500)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                <span style={{ width: 10, height: 10, background: "var(--color-primary-400)", borderRadius: 2, display: "inline-block" }} />
                Submitted
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                <span style={{ width: 10, height: 10, background: "var(--color-success-400)", borderRadius: 2, display: "inline-block" }} />
                Published
              </span>
            </div>

            <div className={styles.barChart}>
              {ANALYTICS.monthlyBar.map((m) => (
                <div key={m.month} className={styles.barRow}>
                  <span className={styles.barLabel}>{m.month}</span>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${(m.submitted / maxSubmitted) * 100}%`,
                          background: "var(--color-primary-400)",
                        }}
                      />
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${(m.published / maxSubmitted) * 100}%`,
                          background: "var(--color-success-400)",
                        }}
                      />
                    </div>
                  </div>
                  <span className={styles.barValue}>{m.submitted}</span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={{ display: "flex", gap: "var(--space-6)", marginTop: "var(--space-5)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--color-neutral-100)" }}>
              <div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-primary-600)" }}>
                  {ANALYTICS.monthlyBar.reduce((a, m) => a + m.submitted, 0)}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-400)" }}>Total submitted</div>
              </div>
              <div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-success-600)" }}>
                  {ANALYTICS.monthlyBar.reduce((a, m) => a + m.published, 0)}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-400)" }}>Total published</div>
              </div>
              <div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-neutral-700)" }}>
                  {Math.round(
                    (ANALYTICS.monthlyBar.reduce((a, m) => a + m.published, 0) /
                    ANALYTICS.monthlyBar.reduce((a, m) => a + m.submitted, 0)) * 100
                  )}%
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-400)" }}>Acceptance rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
