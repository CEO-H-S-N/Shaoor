"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import styles from "./page.module.css";

/**
 * Smart back button that uses browser history when possible.
 * - If opened from a journal page (/shaoor/...) → "Back to Journal"
 * - If opened from /papers              → "Back to Papers"
 * - If there's any other history        → "Back"
 * - If no history (direct link)         → falls back to /papers
 */
export function BackButton() {
  const router = useRouter();
  const [label, setLabel] = useState("Back to Papers");
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    // history.length > 1 means there is at least one page to go back to
    setHasHistory(window.history.length > 1);

    const ref = document.referrer;
    if (ref) {
      if (ref.includes("/shaoor/")) {
        setLabel("Back to Journal");
      } else if (ref.includes("/papers")) {
        setLabel("Back to Papers");
      } else {
        setLabel("Back");
      }
    }
  }, []);

  function handleBack(e: React.MouseEvent) {
    e.preventDefault();
    if (hasHistory && document.referrer) {
      router.back();
    } else {
      router.push("/papers");
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={styles.backBtn}
      aria-label={label}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}

/**
 * Smart breadcrumb — shows the correct parent based on referrer.
 * Renders server-safe (no referrer on server), hydrates on client.
 */
export function SmartBreadcrumb({ category }: { category: string }) {
  const [origin, setOrigin] = useState<{ href: string; label: string } | null>(null);

  useEffect(() => {
    const ref = document.referrer;
    if (ref && ref.includes("/shaoor/")) {
      // Extract the journal slug from the referrer URL
      try {
        const url = new URL(ref);
        setOrigin({ href: url.pathname, label: "Journal" });
      } catch {
        setOrigin({ href: "/content", label: "Journals" });
      }
    } else {
      setOrigin({ href: "/papers", label: "Papers" });
    }
  }, []);

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {origin ? (
        <>
          <a href={origin.href}>{origin.label}</a>
          <span className={styles.breadcrumbSep}>›</span>
        </>
      ) : (
        <>
          <a href="/papers">Papers</a>
          <span className={styles.breadcrumbSep}>›</span>
        </>
      )}
      <span style={{ color: "var(--color-neutral-600)" }}>{category}</span>
    </nav>
  );
}
