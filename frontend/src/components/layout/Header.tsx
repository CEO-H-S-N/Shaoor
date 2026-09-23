"use client";

import React, { useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useSplash } from "@/lib/splash-context";
import styles from "./Header.module.css";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { trigger: triggerSplash } = useSplash();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const user = session?.user;
  const role = (user as any)?.role as "CUSTOMER" | "ADMIN" | "DESIGNER" | undefined;

  const dashboardHref =
    role === "ADMIN" || role === "DESIGNER" ? "/review" : "/my-papers";
  const dashboardLabel =
    role === "ADMIN" ? "Admin Queue" : role === "DESIGNER" ? "Management" : "Dashboard";

  function handleLogoClick(e: React.MouseEvent) {
    e.preventDefault();
    // Show splash then navigate home
    triggerSplash(() => {
      router.push("/");
    });
  }

  return (
    <header className={styles.header}>
      <nav className={styles.mainNav}>
        {/* Logo — fires splash on click */}
        <a href="/" onClick={handleLogoClick} className={styles.logo} id="header-logo" aria-label="Shaoor Home">
          <Image
            src="/shaoor-logo.png"
            alt="Shaoor"
            width={60}
            height={46}
            priority
            className={styles.logoImage}
          />
        </a>

        {/* Desktop Nav Links */}
        <ul className={styles.navLinks}>
          <li>
            <a href="/" className={`${styles.navLink} ${isActive("/") ? styles.navLinkActive : ""}`}>Home</a>
          </li>
          <li>
            <a href="/papers" className={`${styles.navLink} ${isActive("/papers") ? styles.navLinkActive : ""}`}>Papers</a>
          </li>
          <li>
            <a href="/about" className={`${styles.navLink} ${isActive("/about") ? styles.navLinkActive : ""}`}>About</a>
          </li>
          <li>
            <a href="/submit" className={`${styles.navLink} ${isActive("/submit") ? styles.navLinkActive : ""}`}>Submit</a>
          </li>
        </ul>

        {/* Auth Area */}
        <div className={styles.authArea}>
          {isLoggedIn ? (
            <div className={styles.authDesktopGroup}>
              <a href={dashboardHref} className={styles.dashboardLink} id="header-dashboard-link">
                <LayoutDashboard size={14} />
                {dashboardLabel}
              </a>

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
                title="Sign out"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          ) : (
            <div className={styles.authDesktopGroup}>
              <a href="/login" className={styles.signInBtn}>Sign in</a>
              <a href="/login" className={styles.submitBtn}>Submit a Paper</a>
            </div>
          )}

          {/* Mobile Menu Toggle */}
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
          <li><a href="/" onClick={() => setMobileMenuOpen(false)}>Home</a></li>
          <li><a href="/papers" onClick={() => setMobileMenuOpen(false)}>Papers</a></li>
          <li><a href="/about" onClick={() => setMobileMenuOpen(false)}>About</a></li>
          <li><a href="/submit" onClick={() => setMobileMenuOpen(false)}>Submit a Paper</a></li>
          {isLoggedIn ? (
            <li style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <a
                href={dashboardHref}
                onClick={() => setMobileMenuOpen(false)}
                className={styles.dashboardLink}
                style={{ justifyContent: "center" }}
              >
                <LayoutDashboard size={15} />
                {dashboardLabel}
              </a>
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/login" }); }}
                className={styles.logoutBtn}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </li>
          ) : (
            <li style={{ marginTop: "12px" }}>
              <a href="/login" onClick={() => setMobileMenuOpen(false)} className={styles.submitBtn} style={{ display: "block", textAlign: "center", width: "100%" }}>
                Sign In / Register
              </a>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}
