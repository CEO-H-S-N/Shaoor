"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, BookOpen, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./Header.module.css";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const user = session?.user;
  const role = (user as any)?.role as "CUSTOMER" | "ADMIN" | "DESIGNER" | undefined;

  const dashboardHref =
    role === "ADMIN" || role === "DESIGNER" ? "/review" : "/my-papers";
  const dashboardLabel =
    role === "ADMIN" ? "Admin Queue" : role === "DESIGNER" ? "Management" : "Dashboard";

  return (
    <header className={styles.header}>
      {/* Top Info Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <span>Open Access Academic Publishing Platform</span>
          <ul className={styles.topBarLinks}>
            <li><Link href="/about">About</Link></li>
            <li><a href="mailto:contact@shaoor.org">Contact</a></li>
          </ul>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={styles.mainNav}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <BookOpen size={22} />
          </div>
          <div>
            <div className={styles.logoText}>Shaoor</div>
            <div className={styles.logoTagline}>Academic Review Platform</div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <ul className={styles.navLinks}>
          <li>
            <Link href="/" className={`${styles.navLink} ${isActive("/") ? styles.navLinkActive : ""}`}>Home</Link>
          </li>
          <li>
            <Link href="/papers" className={`${styles.navLink} ${isActive("/papers") ? styles.navLinkActive : ""}`}>Papers</Link>
          </li>
          <li>
            <Link href="/about" className={`${styles.navLink} ${isActive("/about") ? styles.navLinkActive : ""}`}>About</Link>
          </li>
          <li>
            <Link href="/submit" className={`${styles.navLink} ${isActive("/submit") ? styles.navLinkActive : ""}`}>Submit Paper</Link>
          </li>
        </ul>

        {/* Auth Area */}
        <div className={styles.authArea}>
          {isLoggedIn ? (
            <div className={styles.authDesktopGroup}>
              <Link href={dashboardHref} className={styles.dashboardLink} id="header-dashboard-link">
                <LayoutDashboard size={14} />
                {dashboardLabel}
              </Link>

              <div className={styles.userBadge}>
                <div className={styles.userInitial}>
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <span className={styles.userName}>{user?.name || user?.email}</span>
                {role && role !== "CUSTOMER" && (
                  <span className={styles.userRoleBadge}>{role}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className={styles.logoutBtn}
                id="header-logout-btn"
                title="Sign out of your account"
              >
                <LogOut size={14} />
                Log Out
              </button>
            </div>
          ) : (
            <div className={styles.authDesktopGroup}>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Submit a Paper
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ""}`}>
        <ul className={styles.mobileNavLinks}>
          <li><Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link></li>
          <li><Link href="/papers" onClick={() => setMobileMenuOpen(false)}>Papers</Link></li>
          <li><Link href="/about" onClick={() => setMobileMenuOpen(false)}>About</Link></li>
          <li><Link href="/submit" onClick={() => setMobileMenuOpen(false)}>Submit Paper</Link></li>
          {isLoggedIn ? (
            <li style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link
                href={dashboardHref}
                onClick={() => setMobileMenuOpen(false)}
                className={styles.dashboardLink}
                style={{ justifyContent: "center", padding: "10px" }}
              >
                <LayoutDashboard size={16} />
                {dashboardLabel}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: "/login" });
                }}
                className={styles.logoutBtn}
                style={{ width: "100%", justifyContent: "center", padding: "10px" }}
              >
                <LogOut size={16} />
                Log Out
              </button>
            </li>
          ) : (
            <li style={{ marginTop: "var(--space-3)" }}>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" fullWidth>Sign In / Register</Button>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}
