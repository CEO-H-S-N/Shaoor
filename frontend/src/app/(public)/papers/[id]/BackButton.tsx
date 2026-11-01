"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./page.module.css";

/**
 * Smart back button that reads ?from= query param.
 *
 * Case 1 — Opened from a journal page (?from=/shaoor/...):
 *   Shows "← Back to Journal" and navigates to that journal URL.
 *
 * Case 2 — Opened from papers page or any other page (no ?from=):
 *   Shows "← Back to Papers" and navigates to /papers.
 */
export function BackButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const isFromJournal = from && from.startsWith("/shaoor/");
  const label = isFromJournal ? "Back to Journal" : "Back to Papers";
  const href = isFromJournal ? from : "/papers";

  return (
    <Link
      href={href}
      className={styles.backBtn}
      aria-label={label}
    >
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}

/**
 * Smart breadcrumb — shows the correct parent based on ?from= param.
 *
 * From journal: Journal › Category
 * From papers:  Papers › Category
 */
export function SmartBreadcrumb({ category }: { category: string }) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const isFromJournal = from && from.startsWith("/shaoor/");

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {isFromJournal ? (
        <>
          <Link href={from}>Journal</Link>
          <span className={styles.breadcrumbSep}>›</span>
        </>
      ) : (
        <>
          <Link href="/papers">Papers</Link>
          <span className={styles.breadcrumbSep}>›</span>
        </>
      )}
      <span style={{ color: "var(--color-neutral-600)" }}>{category}</span>
    </nav>
  );
}

