import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { FileText, Plus, Clock, CheckCircle, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "My Papers — Shaoor",
  description: "Manage your submitted and published papers on Shaoor.",
};

// Status config for display
const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  DRAFT:              { label: "Draft",            className: styles.statusDraft,     icon: FileText    },
  SUBMITTED:          { label: "Submitted",         className: styles.statusSubmitted, icon: Clock       },
  UNDER_REVIEW:       { label: "Under Review",      className: styles.statusReview,    icon: Eye         },
  REVISION_REQUESTED: { label: "Revision Needed",   className: styles.statusRevision,  icon: AlertCircle },
  ACCEPTED:           { label: "Accepted",           className: styles.statusAccepted,  icon: CheckCircle },
  PUBLISHED:          { label: "Published",          className: styles.statusPublished, icon: CheckCircle },
  REJECTED:           { label: "Rejected",           className: styles.statusRejected,  icon: AlertCircle },
};

// Demo data — will be fetched from API
const DEMO_PAPERS = [
  {
    id: "1",
    title: "Machine Learning Approaches for Early Detection of Neurodegenerative Diseases",
    abstract: "This paper presents a novel approach using deep learning models to identify early biomarkers...",
    status: "PUBLISHED",
    submittedAt: "2026-08-10",
    version: 2,
  },
  {
    id: "2",
    title: "The Digital Divide in Rural Education: A Comprehensive Policy Analysis",
    abstract: "Examining how socioeconomic disparities in access to digital technology impact educational outcomes...",
    status: "UNDER_REVIEW",
    submittedAt: "2026-09-01",
    version: 1,
  },
  {
    id: "3",
    title: "Sustainability Metrics in Urban Construction Projects",
    abstract: "A framework for evaluating sustainability in large-scale urban development...",
    status: "REVISION_REQUESTED",
    submittedAt: "2026-07-20",
    version: 1,
  },
  {
    id: "4",
    title: "Draft: Quantum Cryptography in Cloud Infrastructure",
    abstract: "Preliminary analysis of post-quantum encryption algorithms applicable to cloud systems...",
    status: "DRAFT",
    submittedAt: null,
    version: 1,
  },
];

const STATUS_COUNTS = {
  all: DEMO_PAPERS.length,
  active: DEMO_PAPERS.filter(p => ["SUBMITTED","UNDER_REVIEW","REVISION_REQUESTED"].includes(p.status)).length,
  published: DEMO_PAPERS.filter(p => p.status === "PUBLISHED").length,
  draft: DEMO_PAPERS.filter(p => p.status === "DRAFT").length,
};

export default async function MyPapersPage() {
  const session = await auth();

  return (
    <div className={styles.page}>
      {/* ─── Header ────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>My Papers</h1>
          <p>Track and manage all your submissions.</p>
        </div>
        <Link href="/submit">
          <Button variant="primary" size="md">
            <Plus size={18} />
            New Submission
          </Button>
        </Link>
      </div>

      {/* ─── Stats Strip ───────────────────────────────── */}
      <div className={styles.statsStrip}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{STATUS_COUNTS.all}</div>
          <div className={styles.statLabel}>Total Papers</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{STATUS_COUNTS.active}</div>
          <div className={styles.statLabel}>In Review</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{STATUS_COUNTS.published}</div>
          <div className={styles.statLabel}>Published</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{STATUS_COUNTS.draft}</div>
          <div className={styles.statLabel}>Drafts</div>
        </div>
      </div>

      {/* ─── Filter Tabs ────────────────────────────────── */}
      <div className={styles.filterTabs} role="tablist">
        {[
          { label: `All (${STATUS_COUNTS.all})`, key: "all" },
          { label: "Under Review", key: "active" },
          { label: "Published", key: "published" },
          { label: "Drafts", key: "draft" },
          { label: "Rejected", key: "rejected" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`${styles.filterTab} ${tab.key === "all" ? styles.filterTabActive : ""}`}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Papers List ────────────────────────────────── */}
      {DEMO_PAPERS.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <FileText size={32} />
          </div>
          <h2 className={styles.emptyTitle}>No papers yet</h2>
          <p className={styles.emptyText}>
            Submit your first paper to get started with peer review.
          </p>
          <Link href="/submit">
            <Button variant="primary">
              <Plus size={18} />
              Submit Your First Paper
            </Button>
          </Link>
        </div>
      ) : (
        <div className={styles.papersList}>
          {DEMO_PAPERS.map((paper) => {
            const statusCfg = STATUS_CONFIG[paper.status];
            const StatusIcon = statusCfg.icon;
            return (
              <article key={paper.id} className={styles.paperCard}>
                <div className={styles.paperCardLeft}>
                  <div className={styles.paperCardMeta}>
                    <span className={`${styles.statusBadge} ${statusCfg.className}`}>
                      <StatusIcon size={10} />
                      {statusCfg.label}
                    </span>
                    {paper.submittedAt && (
                      <span className={styles.paperDate}>
                        Submitted {paper.submittedAt}
                      </span>
                    )}
                    <span className={styles.paperDate}>v{paper.version}</span>
                  </div>
                  <h2 className={styles.paperTitle}>{paper.title}</h2>
                  <p className={`${styles.paperAbstract} line-clamp-2`}>{paper.abstract}</p>
                </div>

                <div className={styles.paperActions}>
                  <Link href={`/papers/${paper.id}`}>
                    <Button variant="secondary" size="sm">View</Button>
                  </Link>
                  {paper.status === "DRAFT" && (
                    <Link href={`/submit?draft=${paper.id}`}>
                      <Button variant="ghost" size="sm">Continue</Button>
                    </Link>
                  )}
                  {paper.status === "REVISION_REQUESTED" && (
                    <Link href={`/submit?draft=${paper.id}`}>
                      <Button variant="outline" size="sm">Revise</Button>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
