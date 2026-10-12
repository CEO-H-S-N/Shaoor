import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookOpen, Layers, Calendar, FileText, ArrowRight, Settings, ShieldCheck, Sparkles } from "lucide-react";
import styles from "./journals.module.css";

export const metadata: Metadata = {
  title: "Academic Journals & Issues — Shaoor",
  description:
    "Explore peer-reviewed journal issues, published volumes, and multidisciplinary scientific archives from Shaoor Journal.",
};

import { DEFAULT_JOURNALS_PAGE_CONTENT as DEFAULT_CMS } from "@/lib/pageContentDefaults";

export default async function PublicJournalsPage() {
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

  // ── Load Journals ────────────────────────────────────
  let rawJournals: any[] = [];
  try {
    rawJournals = await prisma.journal.findMany({
      where: isOwner ? {} : { isActive: true },
      orderBy: [{ volume: "desc" }, { issue: "desc" }],
      include: {
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
                  Edit Page Content (Platform Owner)
                </Link>
                <Link href="/admin/journals" className={styles.adminEditBadge}>
                  <Settings size={13} />
                  Manage Journals &amp; Add Papers (Platform Owner)
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── Issues Archive Grid ─────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <div>
                <h2>{cms.archiveHeading}</h2>
                <p>{cms.archiveSubheading}</p>
              </div>
            </div>

            {rawJournals.length === 0 ? (
              <div className={styles.emptyState}>
                <BookOpen size={48} className={styles.emptyIcon} />
                <h3>{cms.emptyStateTitle}</h3>
                <p>{cms.emptyStateMessage}</p>
                <div style={{ marginTop: "20px" }}>
                  <Link href="/submit" className={styles.submitPaperBtn}>
                    Submit a Manuscript
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.issuesGrid}>
                {rawJournals.map((journal) => (
                  <div key={journal.id} className={styles.issueCard}>
                    <div className={styles.issueCardHeader}>
                      <div className={styles.volumePill}>
                        <Layers size={13} />
                        Vol. {journal.volume} · Issue {journal.issue}
                      </div>
                      <div className={styles.datePill}>
                        <Calendar size={12} />
                        {new Date(journal.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <h3 className={styles.issueTitle}>{journal.title}</h3>
                    {journal.description && (
                      <p className={styles.issueDesc}>{journal.description}</p>
                    )}

                    <div className={styles.issueMeta}>
                      <span className={styles.paperCountBadge}>
                        <FileText size={13} />
                        {journal._count.entries} Manuscript{journal._count.entries !== 1 ? "s" : ""}
                      </span>
                      <span className={styles.issnText}>
                        <ShieldCheck size={13} /> Peer Reviewed
                      </span>
                    </div>

                    <div className={styles.issueFooter}>
                      <Link href={`/journals/${journal.id}`} className={styles.viewIssueBtn}>
                        Browse Issue Contents <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
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
