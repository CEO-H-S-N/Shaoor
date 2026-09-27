"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle,
  Ban,
  Trash2,
  Search,
  Crown,
  FileText,
  ClipboardList,
} from "lucide-react";
import styles from "./page.module.css";

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  username: string | null;
  affiliation: string | null;
  isActive: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
  _count?: {
    papers: number;
    reviews: number;
  };
}

interface Stats {
  total: number;
  active: number;
  banned: number;
  admins: number;
}

interface Props {
  initialUsers: UserItem[];
  initialStats: Stats;
  currentUserId: string;
  currentUserEmail: string;
}

export function UsersManagementView({
  initialUsers,
  initialStats,
  currentUserId,
  currentUserEmail,
}: Props) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ADMIN" | "CUSTOMER" | "ACTIVE" | "BANNED">("ALL");

  // Filter users in memory
  const filteredUsers = users.filter((u) => {
    // Search
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.affiliation && u.affiliation.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    // Tabs
    if (activeTab === "ADMIN") return u.role === "ADMIN";
    if (activeTab === "CUSTOMER") return u.role === "CUSTOMER";
    if (activeTab === "ACTIVE") return u.isActive;
    if (activeTab === "BANNED") return !u.isActive;

    return true;
  });

  // Toggle Ban / Unban
  async function handleToggleBan(user: UserItem) {
    if (user.email === "shouket.tilwani@gmail.com") {
      alert("The Platform Owner / Master Account cannot be suspended.");
      return;
    }

    if (user.id === currentUserId || user.email === currentUserEmail) {
      alert("You cannot suspend your own account.");
      return;
    }

    const action = user.isActive ? "temporarily suspend / ban" : "reinstate / unban";
    if (!confirm(`Are you sure you want to ${action} ${user.name || user.email}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}/toggle-ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: user.isActive ? "Administrative suspension" : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update account status");

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: data.user.isActive } : u))
      );

      setStats((prev) => ({
        ...prev,
        active: user.isActive ? prev.active - 1 : prev.active + 1,
        banned: user.isActive ? prev.banned + 1 : prev.banned - 1,
      }));
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  }

  // Delete User
  async function handleDelete(user: UserItem) {
    if (user.email === "shouket.tilwani@gmail.com") {
      alert("The Platform Owner / Master Account cannot be deleted.");
      return;
    }

    if (user.id === currentUserId || user.email === currentUserEmail) {
      alert("You cannot delete your own account.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to PERMANENTLY DELETE ${user.name || user.email}? This will remove all their associated draft submissions, reviews, and sessions.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}/delete`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setStats((prev) => ({
        ...prev,
        total: prev.total - 1,
        active: user.isActive ? prev.active - 1 : prev.active,
        banned: !user.isActive ? prev.banned - 1 : prev.banned,
        admins: user.role === "ADMIN" ? prev.admins - 1 : prev.admins,
      }));

      alert(`Account ${user.email} deleted successfully.`);
    } catch (err: any) {
      alert(err.message || "Failed to delete account");
    }
  }

  return (
    <div className={styles.container}>
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <nav className={styles.breadcrumb}>
          <Link href="/my-papers" className={styles.breadcrumbLink}>
            Dashboard
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Manage Accounts</span>
        </nav>
        <div className={styles.headerText}>
          <div>
            <h1>Manage Accounts</h1>
            <p className={styles.headerSubtitle}>
              Author, reviewer, and administrator registry with live database synchronization.
            </p>
          </div>
          <Link href="/manage/create-admin" className={styles.createAdminBtn}>
            <UserPlus size={15} />
            Make Admin Account
          </Link>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#eff6ff", color: "#1e3a8a" }}>
            <Users size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Registered Accounts</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#dcfce7", color: "#15803d" }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.active}</div>
            <div className={styles.statLabel}>Active &amp; Verified</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#fee2e2", color: "#b91c1c" }}>
            <Ban size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.banned}</div>
            <div className={styles.statLabel}>Temporarily Suspended</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#faf5ff", color: "#7e22ce" }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.admins}</div>
            <div className={styles.statLabel}>Platform Administrators</div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────── */}
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search accounts by name, email, or affiliation..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "ALL" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            All Accounts ({users.length})
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "ADMIN" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("ADMIN")}
          >
            Administrators ({users.filter((u) => u.role === "ADMIN").length})
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "CUSTOMER" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("CUSTOMER")}
          >
            Authors ({users.filter((u) => u.role === "CUSTOMER").length})
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "ACTIVE" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("ACTIVE")}
          >
            Active ({users.filter((u) => u.isActive).length})
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "BANNED" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("BANNED")}
          >
            Suspended ({users.filter((u) => !u.isActive).length})
          </button>
        </div>
      </div>

      {/* ── Real Database Table ─────────────────────────────── */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
                <th>Affiliation</th>
                <th>Status</th>
                <th>Activity</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "#94a3b8" }}>
                    No matching user accounts found in AWS RDS database.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isOwner = user.email === "shouket.tilwani@gmail.com";
                  const isSelf = user.id === currentUserId || user.email === currentUserEmail;

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className={styles.userCell}>
                          <div
                            className={styles.avatar}
                            style={isOwner ? { background: "#d97706" } : undefined}
                          >
                            {user.name
                              ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                              : "SH"}
                          </div>
                          <div>
                            <div className={styles.userName}>
                              {user.name || "Academic User"}
                              {isOwner && (
                                <span
                                  style={{
                                    marginLeft: "6px",
                                    fontSize: "10px",
                                    background: "#fef3c7",
                                    color: "#b45309",
                                    padding: "2px 6px",
                                    borderRadius: "9999px",
                                    fontWeight: 700,
                                  }}
                                >
                                  MASTER
                                </span>
                              )}
                            </div>
                            <div className={styles.userEmail}>{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {user.role === "ADMIN" ? (
                          <span className={styles.roleBadgeAdmin}>Admin</span>
                        ) : user.role === "DESIGNER" ? (
                          <span className={styles.roleBadgeDesigner}>Designer</span>
                        ) : (
                          <span className={styles.roleBadgeAuthor}>Author</span>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: "0.8125rem", color: "#475569" }}>
                          {user.affiliation || "—"}
                        </span>
                      </td>

                      <td>
                        {user.isActive ? (
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
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          <span>{user._count?.papers ?? 0} papers</span>
                          {user.role === "ADMIN" && (
                            <span> • {user._count?.reviews ?? 0} reviews</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {new Date(user.createdAt).toLocaleDateString("en-US", {
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
                                onClick={() => handleToggleBan(user)}
                                className={styles.actionBtn}
                                title={
                                  user.isActive
                                    ? "Temporarily Suspend Account"
                                    : "Reinstate Active Status"
                                }
                              >
                                <Ban size={12} color={user.isActive ? "#b91c1c" : "#15803d"} />
                                {user.isActive ? "Suspend" : "Reinstate"}
                              </button>

                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(user)}
                                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                  title="Permanently Delete User Account"
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
