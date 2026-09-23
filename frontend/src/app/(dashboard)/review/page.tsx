import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  ClipboardList,
  Clock,
  User,
  Calendar,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Review Queue — Shaoor",
  description: "Review and evaluate submitted academic papers awaiting peer assessment.",
};

// ── Demo data — will be replaced with API calls ──────────────
const DEMO_PAPERS = [
  {
    id: "p1",
    title: "Machine Learning Approaches for Early Detection of Neurodegenerative Diseases",
    abstract:
      "This paper presents a novel approach using deep learning models to identify early biomarkers associated with Alzheimer's and Parkinson's disease through analysis of multi-modal biomedical imaging data.",
    category: "Medicine & Health Sciences",
    author: { name: "Dr. Aisha Siddiqui", institution: "Lahore University of Management Sciences" },
    submittedAt: "2026-09-05",
    daysInQueue: 15,
    status: "UNDER_REVIEW",
    priority: true,
    reviewers: ["MK", "SA"],
    version: 2,
  },
  {
    id: "p2",
    title: "The Digital Divide in Rural Education: A Comprehensive Policy Analysis",
    abstract:
      "Examining how socioeconomic disparities in access to digital technology impact educational outcomes in rural Pakistan. The study employs mixed-methods research over a three-year period.",
    category: "Social Sciences",
    author: { name: "Prof. Zahir Rahman", institution: "Karachi University" },
    submittedAt: "2026-09-12",
    daysInQueue: 8,
    status: "SUBMITTED",
    priority: false,
    reviewers: [],
    version: 1,
  },
  {
    id: "p3",
    title: "Quantum Cryptography in Cloud Infrastructure: A Security Analysis",
    abstract:
      "Preliminary analysis of post-quantum encryption algorithms and their applicability to distributed cloud computing environments, with focus on NIST-standardized algorithms.",
    category: "Computer Science",
    author: { name: "Dr. Bilal Chaudhry", institution: "FAST-NUCES" },
    submittedAt: "2026-09-15",
    daysInQueue: 5,
    status: "SUBMITTED",
    priority: false,
    reviewers: [],
    version: 1,
  },
  {
    id: "p4",
    title: "Sustainability Metrics in Urban Construction: A GIS-Based Framework",
    abstract:
      "A framework for evaluating sustainability in large-scale urban development projects using geospatial analytics and carbon footprint modeling.",
    category: "Engineering",
    author: { name: "Eng. Fatima Al-Noor", institution: "NED University" },
    submittedAt: "2026-09-01",
    daysInQueue: 19,
    status: "UNDER_REVIEW",
    priority: true,
    reviewers: ["RK"],
    version: 1,
  },
];

const STATS = {
  total:      DEMO_PAPERS.length,
  submitted:  DEMO_PAPERS.filter((p) => p.status === "SUBMITTED").length,
  inReview:   DEMO_PAPERS.filter((p) => p.status === "UNDER_REVIEW").length,
  priority:   DEMO_PAPERS.filter((p) => p.priority).length,
};

export default async function ReviewQueuePage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  // Only Admins and Designers can access this page
  if (role === "CUSTOMER") {
    redirect("/my-papers");
  }

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>Review Queue</h1>
          <p>
            {STATS.total} paper{STATS.total !== 1 ? "s" : ""} awaiting evaluation
          </p>
        </div>
      </div>

      {/* ── Stats Strip ────────────────────────────────────── */}
      <div className={styles.statsStrip}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{STATS.total}</div>
          <div className={styles.statLabel}>Total in Queue</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{STATS.submitted}</div>
          <div className={styles.statLabel}>Awaiting Assignment</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{STATS.inReview}</div>
          <div className={styles.statLabel}>Under Review</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{STATS.priority}</div>
          <div className={styles.statLabel}>High Priority</div>
        </div>
      </div>

      {/* ── Filter Tabs ────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.filterTabs} role="tablist">
          {[
            { label: `All (${STATS.total})`, key: "all" },
            { label: `Awaiting (${STATS.submitted})`, key: "submitted" },
            { label: `In Review (${STATS.inReview})`, key: "review" },
            { label: `Priority (${STATS.priority})`, key: "priority" },
          ].map((tab, i) => (
            <button
              key={tab.key}
              id={`review-tab-${tab.key}`}
              className={`${styles.filterTab} ${i === 0 ? styles.filterTabActive : ""}`}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Paper Cards ────────────────────────────────────── */}
      {DEMO_PAPERS.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <CheckCircle size={28} />
          </div>
          <h2 className={styles.emptyTitle}>Queue is clear!</h2>
          <p className={styles.emptyText}>
            All submitted papers have been reviewed. Check back later for new submissions.
          </p>
        </div>
      ) : (
        <div className={styles.papersList}>
          {DEMO_PAPERS.map((paper) => (
            <article
              key={paper.id}
              className={`${styles.paperCard} ${paper.priority ? styles.paperCardPriority : ""}`}
            >
              <div className={styles.paperCardLeft}>
                {/* Meta row */}
                <div className={styles.paperCardMeta}>
                  {paper.status === "UNDER_REVIEW" ? (
                    <span className={`${styles.badge} ${styles.badgeUnderReview}`}>
                      <Eye size={10} />
                      Under Review
                    </span>
                  ) : (
                    <span className={`${styles.badge} ${styles.badgeSubmitted}`}>
                      <Clock size={10} />
                      Awaiting Assignment
                    </span>
                  )}
                  {paper.priority && (
                    <span className={`${styles.badge} ${styles.badgePriority}`}>
                      <AlertTriangle size={10} />
                      Priority
                    </span>
                  )}
                  <span className={`${styles.badge} ${styles.badgeCategory}`}>
                    {paper.category}
                  </span>
                </div>

                <h2 className={styles.paperTitle}>{paper.title}</h2>
                <p className={styles.paperAbstract}>{paper.abstract}</p>

                {/* Secondary meta */}
                <div className={styles.paperMeta2}>
                  <span>
                    <User size={11} />
                    {paper.author.name} · {paper.author.institution}
                  </span>
                  <span>
                    <Calendar size={11} />
                    Submitted {paper.submittedAt}
                  </span>
                  <span>
                    <Clock size={11} />
                    {paper.daysInQueue} days in queue
                  </span>
                  <span>
                    <BookOpen size={11} />
                    v{paper.version}
                  </span>
                </div>

                {/* Reviewer Avatars */}
                {paper.reviewers.length > 0 && (
                  <div className={styles.reviewerRow} style={{ marginTop: "var(--space-2)" }}>
                    {paper.reviewers.map((initials) => (
                      <span key={initials} className={styles.avatar}>
                        {initials}
                      </span>
                    ))}
                    <span className={styles.avatarCount}>
                      {paper.reviewers.length} reviewer{paper.reviewers.length !== 1 ? "s" : ""} assigned
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className={styles.paperActions}>
                <Link href={`/papers/${paper.id}`}>
                  <Button variant="primary" size="sm">
                    <Eye size={14} />
                    Review
                  </Button>
                </Link>
                {paper.status === "SUBMITTED" && (
                  <Button variant="secondary" size="sm">
                    Assign Reviewer
                  </Button>
                )}
                {paper.status === "UNDER_REVIEW" && (
                  <Button variant="outline" size="sm">
                    View Feedback
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
