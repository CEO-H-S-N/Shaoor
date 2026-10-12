import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  Calendar,
  Layers,
  FileText,
  User,
  Hash,
  Download,
  ExternalLink,
  Settings,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import styles from "./issue.module.css";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const journal = await prisma.journal.findUnique({
    where: { id: resolved.id },
    select: { title: true, volume: true, issue: true },
  });

  if (!journal) {
    return { title: "Journal Issue — Shaoor" };
  }

  return {
    title: `Vol. ${journal.volume}, Iss. ${journal.issue} — ${journal.title} — Shaoor`,
    description: `Browse scholarly articles and peer-reviewed research in Shaoor Volume ${journal.volume}, Issue ${journal.issue}.`,
  };
}

export default async function JournalIssueDetailPage({ params }: PageProps) {
  const resolved = await Promise.resolve(params);
  const journalId = resolved.id;

  const session = await auth();
  const isOwner =
    !!(session?.user as any)?.isMaster ||
    session?.user?.email === "shouket.tilwani@gmail.com";

  const journal = await prisma.journal.findUnique({
    where: { id: journalId },
    include: {
      entries: {
        orderBy: { sortOrder: "asc" },
        include: {
          paper: {
            include: {
              author: { select: { name: true, email: true, affiliation: true } },
              category: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!journal || (!journal.isActive && !isOwner)) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        {/* ── Breadcrumb Bar ─────────────────────────────────── */}
        <div className={styles.breadcrumbBar}>
          <div className={styles.container}>
            <Link href="/journals" className={styles.backLink}>
              <ArrowLeft size={14} /> Back to All Journals
            </Link>
          </div>
        </div>

        {/* ── Issue Header ───────────────────────────────────── */}
        <section className={styles.headerSection}>
          <div className={styles.container}>
            <div className={styles.volBadge}>
              <Layers size={14} /> Volume {journal.volume} · Issue {journal.issue}
            </div>

            <h1 className={styles.journalTitle}>{journal.title}</h1>
            {journal.description && (
              <p className={styles.journalDesc}>{journal.description}</p>
            )}

            <div className={styles.metaRow}>
              <span>
                <Calendar size={14} /> Published:{" "}
                {new Date(journal.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span>
                <FileText size={14} /> {journal.entries.length} Article
                {journal.entries.length !== 1 ? "s" : ""}
              </span>
              <span>
                <ShieldCheck size={14} /> Open Access (CC-BY 4.0)
              </span>
            </div>

            {isOwner && (
              <div className={styles.ownerBar}>
                <Link
                  href={`/admin/journals/${journal.id}`}
                  className={styles.ownerManageBtn}
                >
                  <Settings size={13} />
                  Manage Papers for this Issue (Owner)
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── Table of Contents ──────────────────────────────── */}
        <section className={styles.contentSection}>
          <div className={styles.container}>
            <div className={styles.sectionTitleRow}>
              <h2>Table of Contents</h2>
              <span className={styles.articleCount}>
                {journal.entries.length} published article
                {journal.entries.length !== 1 ? "s" : ""}
              </span>
            </div>

            {journal.entries.length === 0 ? (
              <div className={styles.emptyNotice}>
                <BookOpen size={40} className={styles.emptyIcon} />
                <h3>No Articles Compiled in this Issue Yet</h3>
                <p>
                  Articles for this volume/issue are currently undergoing final proofing and editorial layout.
                </p>
                {isOwner && (
                  <div style={{ marginTop: "16px" }}>
                    <Link
                      href={`/admin/journals/${journal.id}`}
                      className={styles.addPapersBtn}
                    >
                      Add Approved Papers Now
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.articlesList}>
                {journal.entries.map((entry, idx) => (
                  <article key={entry.id} className={styles.articleCard}>
                    <div className={styles.cardTop}>
                      <span className={styles.catBadge}>
                        {entry.paper.category?.name || "General"}
                      </span>
                      {(entry.pageStart || entry.pageEnd) && (
                        <span className={styles.pagesBadge}>
                          <Hash size={11} /> pp. {entry.pageStart || "1"}–
                          {entry.pageEnd || ""}
                        </span>
                      )}
                    </div>

                    <h3 className={styles.articleTitle}>
                      <Link href={`/papers/${entry.paper.id}`}>
                        {entry.paper.title}
                      </Link>
                    </h3>

                    <div className={styles.authorRow}>
                      <User size={13} />
                      <span className={styles.authorName}>
                        {entry.paper.author.name || entry.paper.author.email}
                      </span>
                      {entry.paper.author.affiliation && (
                        <span className={styles.affiliation}>
                          — {entry.paper.author.affiliation}
                        </span>
                      )}
                    </div>

                    <p className={styles.abstractSnippet}>
                      {entry.paper.abstract}
                    </p>

                    <div className={styles.articleFooter}>
                      <Link
                        href={`/papers/${entry.paper.id}`}
                        className={styles.readArticleBtn}
                      >
                        Read Full Manuscript <ArrowLeft size={13} style={{ transform: "rotate(180deg)" }} />
                      </Link>
                      {entry.paper.fileUrl && (
                        <a
                          href={entry.paper.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.pdfBtn}
                        >
                          <Download size={13} /> Download PDF
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
