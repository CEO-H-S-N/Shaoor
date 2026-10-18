import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BookOpen,
  Layers,
  Calendar,
  FileText,
  ArrowRight,
  ChevronRight,
  Download,
  Settings,
  ShieldCheck,
  Eye,
  Hash,
} from "lucide-react";
import styles from "./journal.module.css";

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

// Generate dynamic metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const raw = decodeURIComponent(resolved.slug);

  const journal = await prisma.journal.findFirst({
    where: {
      OR: [
        { slug: raw },
        { id: raw },
        { title: { equals: raw, mode: "insensitive" } },
      ],
    },
    select: { title: true, description: true, volume: true, issue: true },
  });

  if (!journal) {
    return {
      title: "Journal Not Found — Shaoor",
    };
  }

  return {
    title: `${journal.title} (Vol. ${journal.volume}, Issue ${journal.issue}) — Shaoor`,
    description:
      journal.description ||
      `Official publications and peer-reviewed research papers in ${journal.title}.`,
  };
}

export default async function JournalBySlugPage({ params }: PageProps) {
  const session = await auth();
  const isOwner =
    !!(session?.user as any)?.isMaster ||
    session?.user?.email === "shouket.tilwani@gmail.com";

  const resolved = await Promise.resolve(params);
  const rawSlug = decodeURIComponent(resolved.slug);

  // Find journal by slug, id, or title match
  let journal = await prisma.journal.findFirst({
    where: {
      OR: [
        { slug: rawSlug },
        { id: rawSlug },
        { title: { equals: rawSlug, mode: "insensitive" } },
      ],
    },
    include: {
      entries: {
        orderBy: { sortOrder: "asc" },
        include: {
          paper: {
            include: {
              author: { select: { name: true, affiliation: true, email: true } },
              category: { select: { name: true, color: true } },
            },
          },
        },
      },
    },
  });

  // If not found, try slugifying all active journals to see if one matches
  if (!journal) {
    const all = await prisma.journal.findMany({
      include: {
        entries: {
          orderBy: { sortOrder: "asc" },
          include: {
            paper: {
              include: {
                author: { select: { name: true, affiliation: true, email: true } },
                category: { select: { name: true, color: true } },
              },
            },
          },
        },
      },
    });

    journal =
      all.find(
        (j) =>
          j.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ===
          rawSlug.toLowerCase()
      ) || null;
  }

  if (!journal) {
    notFound();
  }

  const entries = journal.entries;

  return (
    <div className={styles.page}>
      <Header />

      <main>
        {/* ── Hero Section ───────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
              <Link href="/">Home</Link>
              <ChevronRight size={13} />
              <Link href="/content">Content &amp; Journals</Link>
              <ChevronRight size={13} />
              <span>{journal.title}</span>
            </div>

            {/* Pills */}
            <div className={styles.heroMetaPills}>
              <div className={styles.volumePill}>
                <Layers size={13} />
                Volume {journal.volume} · Issue {journal.issue}
              </div>
              <div className={styles.badgePill}>
                <ShieldCheck size={13} />
                Peer-Reviewed &amp; Open Access
              </div>
            </div>

            <h1 className={styles.title}>{journal.title}</h1>
            {journal.description && (
              <p className={styles.description}>{journal.description}</p>
            )}

            <div className={styles.metricsRow}>
              <div className={styles.metricItem}>
                <Calendar size={15} style={{ color: "#93c5fd" }} />
                <span>
                  Published:{" "}
                  <strong>
                    {new Date(journal.publishedAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                </span>
              </div>
              <div className={styles.metricItem}>
                <FileText size={15} style={{ color: "#93c5fd" }} />
                <span>
                  Catalogued Articles: <strong>{entries.length}</strong>
                </span>
              </div>
              <div className={styles.metricItem}>
                <BookOpen size={15} style={{ color: "#93c5fd" }} />
                <span>
                  License: <strong>CC-BY 4.0 International</strong>
                </span>
              </div>
            </div>

            {isOwner && (
              <div className={styles.ownerBar}>
                <Link
                  href={`/admin/journals/${journal.id}`}
                  className={styles.ownerBadge}
                >
                  <Settings size={14} />
                  Manage Papers for this Journal (Master Admin)
                </Link>
                <Link href="/admin/journals" className={styles.ownerBadge}>
                  <BookOpen size={14} />
                  All Journals Directory
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── Main Articles List ──────────────────────────────── */}
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Published Manuscripts in this Journal
            </h2>
            <span className={styles.papersCount}>
              {entries.length} {entries.length === 1 ? "Article" : "Articles"}
            </span>
          </div>

          {entries.length === 0 ? (
            <div className={styles.emptyState}>
              <BookOpen size={48} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>
                No Manuscripts Currently Indexed in this Journal
              </h3>
              <p className={styles.emptyDesc}>
                Manuscripts currently undergoing peer review for this volume will
                appear here upon final editorial board approval and compilation.
              </p>
              <Link href="/content" className={styles.emptyBackBtn}>
                Browse Other Journals <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className={styles.papersList}>
              {entries.map((entry, idx) => {
                const paper = entry.paper;
                return (
                  <article key={entry.id} className={styles.paperCard}>
                    <div className={styles.cardTopRow}>
                      <span className={styles.cardCategory}>
                        {paper.category?.name || "Multidisciplinary Research"}
                      </span>
                      {entry.pageStart && entry.pageEnd ? (
                        <span className={styles.cardPagination}>
                          <Hash size={12} />
                          Pages {entry.pageStart}–{entry.pageEnd}
                        </span>
                      ) : (
                        <span className={styles.cardPagination}>
                          Article #{idx + 1}
                        </span>
                      )}
                    </div>

                    <h3 className={styles.cardTitle}>
                      <Link href={`/papers/${paper.id}`}>{paper.title}</Link>
                    </h3>

                    {paper.abstract && (
                      <p className={styles.cardAbstract}>{paper.abstract}</p>
                    )}

                    <div className={styles.cardFooter}>
                      <div className={styles.authorMeta}>
                        <span className={styles.authorName}>
                          {paper.author?.name || "Author Team"}
                        </span>
                        {paper.author?.affiliation && (
                          <span className={styles.authorAffil}>
                            {paper.author.affiliation}
                          </span>
                        )}
                      </div>

                      <div className={styles.cardActions}>
                        <Link
                          href={`/papers/${paper.id}`}
                          className={styles.readBtn}
                        >
                          Read Article <ArrowRight size={14} />
                        </Link>
                        {paper.fileUrl && (
                          <a
                            href={paper.fileUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.pdfBtn}
                            title="Download Official Manuscript PDF"
                          >
                            <Download size={14} />
                            PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
