"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, LogOut, LayoutDashboard, ChevronLeft } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import styles from "./JournalHeader.module.css";

export function JournalHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const user = session?.user;
  const role = (user as any)?.role as "CUSTOMER" | "ADMIN" | "DESIGNER" | undefined;

  const dashboardHref =
    role === "ADMIN" || role === "DESIGNER" ? "/review" : "/my-papers";
  const dashboardLabel =
    role === "ADMIN" ? "Admin Queue" : role === "DESIGNER" ? "Management" : "Dashboard";

  return (
    <header className={styles.header}>
      <nav className={styles.mainNav}>
        {/* Logo */}
        <Link href="/content" className={styles.logo} aria-label="Back to Journals">
          <Image
            src="/shaoor-logo.png"
            alt="Shaoor"
            width={60}
            height={46}
            priority
            className={styles.logoImage}
          />
        </Link>

        {/* Back breadcrumb */}
        <Link href="/content" className={styles.backLink}>
          <ChevronLeft size={15} />
          All Journals
        </Link>

        <span className={styles.divider} />
        <span className={styles.journalLabel}>Journal View</span>

        {/* Auth Area */}
        <div className={styles.authArea}>
          {isLoggedIn ? (
            <div className={styles.authGroup}>
              <NotificationBell />

              <Link href={dashboardHref} className={styles.dashboardLink} id="jh-dashboard-link">
                <LayoutDashboard size={14} />
                {dashboardLabel}
              </Link>

              <Link
                href="/settings"
                className={styles.userBadge}
                id="jh-user-badge"
                title="Account Settings"
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className={styles.userAvatarImg}
                  />
                ) : (
                  <div className={styles.userInitial}>
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                )}
                <span className={styles.userName}>{user?.name || user?.email}</span>
                {role && role !== "CUSTOMER" && (
                  <span className={styles.userRoleBadge}>{role}</span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className={styles.logoutBtn}
                id="jh-logout-btn"
                title="Sign out"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          ) : (
            <div className={styles.authGroup}>
              <Link href="/login" className={styles.signInBtn}>Sign in</Link>
            </div>
          )}

          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ""}`}>
        <ul className={styles.mobileNavLinks}>
          <li>
            <Link href="/content" onClick={() => setMobileMenuOpen(false)}>
              ← All Journals
            </Link>
          </li>
          {isLoggedIn ? (
            <>
              <li>
                <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)} className={styles.mobileDashLink}>
                  {dashboardLabel}
                </Link>
              </li>
              <li>
                <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className={styles.mobileSettingsLink}>
                  Account Settings
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/login" }); }}
                  className={styles.mobileLogoutBtn}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className={styles.mobileSignInBtn}>
                Sign In
              </Link>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}
