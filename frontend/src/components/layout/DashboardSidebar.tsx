"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Send,
  ClipboardList,
  Settings,
  Users,
  FolderKanban,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import styles from "@/app/(dashboard)/layout.module.css";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Array<"CUSTOMER" | "ADMIN" | "DESIGNER">;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/my-papers",  label: "My Papers",    icon: FileText,      roles: ["CUSTOMER", "ADMIN", "DESIGNER"] },
  { href: "/submit",     label: "Submit Paper",  icon: Send,          roles: ["CUSTOMER", "ADMIN", "DESIGNER"] },
  { href: "/review",     label: "Review Queue",  icon: ClipboardList, roles: ["ADMIN", "DESIGNER"] },
  { href: "/manage/users",      label: "Users",       icon: Users,         roles: ["DESIGNER"] },
  { href: "/manage/categories", label: "Categories",  icon: FolderKanban,  roles: ["DESIGNER"] },
  { href: "/manage/analytics",  label: "Analytics",   icon: BarChart3,     roles: ["DESIGNER"] },
];

interface Props {
  role: "CUSTOMER" | "ADMIN" | "DESIGNER";
}

export function DashboardSidebar({ role }: Props) {
  const pathname = usePathname();

  const visibleMain = NAV_ITEMS.filter((item) => item.roles.includes(role));

  function navLink(item: NavItem) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`}
      >
        <item.icon className={styles.sidebarIcon} size={16} />
        {item.label}
      </Link>
    );
  }

  return (
    <>
      {/* Mobile Nav Strip (visible only on mobile < 768px) */}
      <nav className={styles.mobileDashboardNav} aria-label="Dashboard mobile navigation">
        <div className={styles.mobileNavPills}>
          <div className={styles.mobileRoleBadge}>
            <ShieldCheck size={12} />
            <span>{role === "DESIGNER" ? "Designer" : role === "ADMIN" ? "Admin" : "Author"}</span>
          </div>

          {visibleMain.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.mobilePill} ${isActive ? styles.mobilePillActive : ""}`}
              >
                <item.icon size={13} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <Link
            href="/settings"
            className={`${styles.mobilePill} ${pathname === "/settings" ? styles.mobilePillActive : ""}`}
          >
            <Settings size={13} />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* Desktop Sidebar (visible >= 768px) */}
      <aside className={styles.sidebar} aria-label="Dashboard navigation">
        {/* Role badge */}
        <div className={styles.roleBadgeRow}>
          <ShieldCheck size={14} className={styles.roleIcon} />
          <span className={styles.roleLabel}>
            {role === "DESIGNER" ? "Designer" : role === "ADMIN" ? "Admin" : "Author"}
          </span>
        </div>

        {/* Main nav */}
        <div className={styles.sidebarSection}>
          <div className={styles.sidebarLabel}>Navigation</div>
          {visibleMain.map(navLink)}
        </div>

        {/* Bottom section: Settings */}
        <div className={styles.sidebarBottom}>
          <Link
            href="/settings"
            className={`${styles.sidebarLink} ${pathname === "/settings" ? styles.sidebarLinkActive : ""}`}
          >
            <Settings className={styles.sidebarIcon} size={16} />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}
