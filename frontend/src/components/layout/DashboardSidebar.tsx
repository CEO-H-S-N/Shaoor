"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Send,
  ClipboardList,
  Bell,
  Settings,
  Users,
  FolderKanban,
  BarChart3,
  BookOpen,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import styles from "@/app/(dashboard)/layout.module.css";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  roles: Array<"CUSTOMER" | "ADMIN" | "DESIGNER">;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/my-papers",  label: "My Papers",    icon: FileText,       roles: ["CUSTOMER", "ADMIN", "DESIGNER"] },
  { href: "/submit",     label: "Submit Paper",  icon: Send,           roles: ["CUSTOMER", "ADMIN", "DESIGNER"] },
  { href: "/review",     label: "Review Queue",  icon: ClipboardList,  roles: ["ADMIN", "DESIGNER"] },
  { href: "/manage/users",      label: "Users",          icon: Users,          roles: ["DESIGNER"] },
  { href: "/manage/categories", label: "Categories",     icon: FolderKanban,   roles: ["DESIGNER"] },
  { href: "/manage/analytics",  label: "Analytics",      icon: BarChart3,      roles: ["DESIGNER"] },
];

const SECONDARY_ITEMS: NavItem[] = [
  { href: "/papers",    label: "Browse Papers",  icon: BookOpen,    roles: ["CUSTOMER", "ADMIN", "DESIGNER"] },
  { href: "/settings",  label: "Settings",        icon: Settings,    roles: ["CUSTOMER", "ADMIN", "DESIGNER"] },
];

interface Props {
  role: "CUSTOMER" | "ADMIN" | "DESIGNER";
  unreadNotifications?: number;
}

export function DashboardSidebar({ role, unreadNotifications = 0 }: Props) {
  const pathname = usePathname();

  const visibleMain = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const visibleSecondary = SECONDARY_ITEMS.filter((item) => item.roles.includes(role));

  function navLink(item: NavItem) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`}
      >
        <item.icon className={styles.sidebarIcon} size={18} />
        {item.label}
        {item.badge ? (
          <span className={styles.sidebarBadge}>{item.badge}</span>
        ) : null}
      </Link>
    );
  }

  return (
    <aside className={styles.sidebar} aria-label="Dashboard navigation">
      {/* Role badge */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-2) var(--space-3)",
        marginBottom: "var(--space-4)",
        background: role === "DESIGNER"
          ? "linear-gradient(135deg, var(--color-primary-50), var(--color-accent-50))"
          : role === "ADMIN"
          ? "var(--color-success-50)"
          : "var(--color-neutral-100)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid",
        borderColor: role === "DESIGNER"
          ? "var(--color-accent-200)"
          : role === "ADMIN"
          ? "var(--color-success-500)"
          : "var(--color-neutral-200)",
      }}>
        <ShieldCheck size={16} style={{ color: role === "DESIGNER" ? "var(--color-accent-500)" : role === "ADMIN" ? "var(--color-success-500)" : "var(--color-neutral-500)" }} />
        <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-neutral-700)" }}>
          {role === "DESIGNER" ? "Designer" : role === "ADMIN" ? "Admin" : "Author"}
        </span>
      </div>

      {/* Main nav */}
      <div className={styles.sidebarSection}>
        <div className={styles.sidebarLabel}>Dashboard</div>
        {visibleMain.map(navLink)}
      </div>

      {/* Notifications */}
      <div className={styles.sidebarSection}>
        <Link
          href="/notifications"
          className={`${styles.sidebarLink} ${pathname === "/notifications" ? styles.sidebarLinkActive : ""}`}
        >
          <Bell className={styles.sidebarIcon} size={18} />
          Notifications
          {unreadNotifications > 0 && (
            <span className={styles.sidebarBadge}>{unreadNotifications}</span>
          )}
        </Link>
      </div>

      {/* Secondary nav */}
      <div className={styles.sidebarSection} style={{ marginTop: "auto" }}>
        <div className={styles.sidebarLabel}>General</div>
        {visibleSecondary.map(navLink)}
        
        {/* Logout Button */}
        <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-neutral-200)" }}>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={styles.logoutButton}
            id="sidebar-logout-btn"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
