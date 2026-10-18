import type { Metadata } from "next";
import Link from "next/link";
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
  Settings,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { DEFAULT_JOURNALS_PAGE_CONTENT as DEFAULT_CMS } from "@/lib/pageContentDefaults";
import styles from "./content.module.css";

export const metadata: Metadata = {
  title: "Academic Journals & Content Directory — Shaoor",
  description:
    "Explore peer-reviewed journals, published volumes, and categorized academic research papers across Shaoor.",
};

export default async function ContentJournalsPage() {
  const session = await auth();
  const isOwner =
    !!(session?.user as any)?.isMaster ||
    session?.user?.email === "shouket.tilwani@gmail.com";

  // ── Load CMS Content ─────────────────────────────────
  let cms = { ...DEFAULT_CMS };
  try {
    const pageRow = await prisma.pageContent.findUnique({
      where: { slug: "journals" },
    });
    if (pageRow) {
      let parsed: any = {};
      try {
        parsed = JSON.parse(pageRow.content);
      } catch {
        // fallback
      }
      cms = {
        title: pageRow.title || DEFAULT_CMS.title,
        subtitle: pageRow.subtitle || DEFAULT_CMS.subtitle,
        badge: parsed.badge || DEFAULT_CMS.badge,
        metric1Label: parsed.metric1Label || DEFAULT_CMS.metric1Label,
        metric1Value: parsed.metric1Value || DEFAULT_CMS.metric1Value,
        metric2Label: parsed.metric2Label || DEFAULT_CMS.metric2Label,
        metric2Value: parsed.metric2Value || DEFAULT_CMS.metric2Value,
        metric3Label: parsed.metric3Label || DEFAULT_CMS.metric3Label,
        metric3Value: parsed.metric3Value || DEFAULT_CMS.metric3Value,
        archiveHeading: parsed.archiveHeading || DEFAULT_CMS.archiveHeading,
        archiveSubheading: parsed.archiveSubheading || DEFAULT_CMS.archiveSubheading,
        emptyStateTitle: parsed.emptyStateTitle || DEFAULT_CMS.emptyStateTitle,
        emptyStateMessage: parsed.emptyStateMessage || DEFAULT_CMS.emptyStateMessage,
      };
    }
  } catch (err) {
    console.error("Failed to load journals CMS content:", err);
  }

  // ── Load Journals from Database ───────────────────────
  let rawJournals: any[] = [];
  try {
    rawJournals = await prisma.journal.findMany({
      where: isOwner ? {} : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { volume: "desc" }, { issue: "desc" }],
      include: {
        entries: {
          take: 3,
          orderBy: { sortOrder: "asc" },
          include: {
            paper: {
              select: { id: true, title: true },
            },
          },
        },
        _count: {
          select: { entries: true },
        },
      },
    });
  } catch (err) {
    console.error("Failed to load journals:", err);
  }

  return (
    <div className={styles.page}>
      <Header />

      <main>
        {/* ── Hero Section ───────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.badge}>
              <BookOpen size={13} />
              {cms.badge}
            </div>
            <h1 className={styles.title}>{cms.title}</h1>
            <p className={styles.subtitle}>{cms.subtitle}</p>

            <div className={styles.heroMetrics}>
              <div className={styles.metricItem}>
                <span className={styles.metricVal}>{cms.metric1Value}</span>
                <span className={styles.metricLabel}>{cms.metric1Label}</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricVal}>{cms.metric2Value}</span>
                <span className={styles.metricLabel}>{cms.metric2Label}</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricVal}>{cms.metric3Value}</span>
                <span className={styles.metricLabel}>{cms.metric3Label}</span>
              </div>
            </div>

            {isOwner && (
              <div className={styles.ownerBar}>
                <Link href="/admin/edit-journals" className={styles.adminEditBadge}>
                  <Settings size={13} />
                  Edit Content Page Text (Platform Owner)
                </Link>
                <Link href="/admin/journals" className={styles.adminEditBadge}>
                  <Settings size={13} />
                  Manage Journals &amp; Categorize Papers (Platform Owner)
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── Journals Directory Grid ─────────────────────────── */}
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{cms.archiveHeading}</h2>
              <p className={styles.sectionSub}>{cms.archiveSubheading}</p>
            </div>
          </div>

          {rawJournals.length === 0 ? (
            <div className={styles.emptyState}>
              <BookOpen size={48} className={styles.emptyIcon} />
              <h3>{cms.emptyStateTitle}</h3>
              <p>{cms.emptyStateMessage}</p>
            </div>
          ) : (
            <div className={styles.journalsGrid}>
              {rawJournals.map((journal) => {
                const journalHref = `/shaoor/${encodeURIComponent(journal.slug || journal.id)}`;
                const paperCount = journal._count.entries;

                return (
                  <div key={journal.id} className={styles.journalCard}>
                    <div className={styles.cardBanner}>
                      <div className={styles.volumeTag}>
                        <Layers size={13} />
                        Vol. {journal.volume} · Issue {journal.issue}
                      </div>
                      <div className={styles.peerBadge}>
                        <ShieldCheck size={13} />
                        Peer-Reviewed
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      <h3 className={styles.journalName}>
                        <Link href={journalHref}>{journal.title}</Link>
                      </h3>

                      {journal.description && (
                        <p className={styles.journalDesc}>{journal.description}</p>
                      )}

                      {/* Preview of papers in this journal */}
                      {journal.entries.length > 0 && (
                        <div className={styles.paperPreviewList}>
                          <div className={styles.paperPreviewHeader}>
                            <FileText size={11} />
                            Featured Articles ({paperCount} Total)
                          </div>
                          {journal.entries.map((entry: any) => (
                            <div
                              key={entry.paper.id}
                              className={styles.paperPreviewItem}
                              title={entry.paper.title}
                            >
                              <span>•</span>
                              <span>{entry.paper.title}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.cardFooter}>
                        <Link href={journalHref} className={styles.openJournalLink}>
                          <span>Open Journal &amp; Read Papers</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
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
