import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FileText, Plus, Clock, CheckCircle, AlertCircle, Eye, FileType } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "My Papers — Shaoor",
  description: "Manage your submitted and published papers on Shaoor.",
};

// Status config for display
const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  DRAFT:              { label: "Draft",           className: styles.statusDraft,     icon: FileText    },
  SUBMITTED:          { label: "Submitted",        className: styles.statusSubmitted, icon: Clock       },
  UNDER_REVIEW:       { label: "Under Review",     className: styles.statusReview,    icon: Eye         },
  REVISION_REQUESTED: { label: "Revision Needed",  className: styles.statusRevision,  icon: AlertCircle },
  ACCEPTED:           { label: "Accepted",          className: styles.statusAccepted,  icon: CheckCircle },
  PUBLISHED:          { label: "Published",         className: styles.statusPublished, icon: CheckCircle },
  REJECTED:           { label: "Rejected",          className: styles.statusRejected,  icon: AlertCircle },
};

function getFileType(fileName: string | null | undefined): "PDF" | "DOCX" | "Figure" | "Other" | null {
  if (!fileName) return null;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "PDF";
  if (ext === "docx" || ext === "doc") return "DOCX";
  if (["png", "jpg", "jpeg", "gif", "svg", "tiff", "eps"].includes(ext ?? "")) return "Figure";
  return "Other";
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function MyPapersPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  // Live Prisma query — all papers authored by the logged-in user
  const papers = await prisma.paper.findMany({
    where: { authorId: userId },
    include: {
      category: { select: { name: true, color: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Real counts
  const counts = {
    all: papers.length,
    active: papers.filter(p => ["SUBMITTED", "UNDER_REVIEW", "REVISION_REQUESTED"].includes(p.status)).length,
    published: papers.filter(p => p.status === "PUBLISHED").length,
    draft: papers.filter(p => p.status === "DRAFT").length,
    rejected: papers.filter(p => p.status === "REJECTED").length,
  };

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
            <Plus size={16} />
            New Submission
          </Button>
        </Link>
      </div>

      {/* ─── Stats Strip ───────────────────────────────── */}
      <div className={styles.statsStrip}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{counts.all}</div>
          <div className={styles.statLabel}>Total Papers</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{counts.active}</div>
          <div className={styles.statLabel}>In Review</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{counts.published}</div>
          <div className={styles.statLabel}>Published</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{counts.draft}</div>
          <div className={styles.statLabel}>Drafts</div>
        </div>
      </div>

      {/* ─── Papers List ────────────────────────────────── */}
      {papers.length === 0 ? (
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
              <Plus size={16} />
              Submit Your First Paper
            </Button>
          </Link>
        </div>
      ) : (
        <div className={styles.papersList}>
          {papers.map((paper) => {
            const statusCfg = STATUS_CONFIG[paper.status] ?? STATUS_CONFIG["DRAFT"];
            const StatusIcon = statusCfg.icon;
            const fileType = getFileType(paper.fileName);
            const fileSize = formatFileSize(paper.fileSize);
            const dateLabel = paper.publishedAt
              ? `Published ${formatDate(paper.publishedAt)}`
              : paper.submittedAt
              ? `Submitted ${formatDate(paper.submittedAt)}`
              : `Created ${formatDate(paper.createdAt)}`;

            return (
              <article key={paper.id} className={styles.paperCard}>
                <div className={styles.paperCardLeft}>
                  {/* Status + meta row */}
                  <div className={styles.paperCardMeta}>
                    <span className={`${styles.statusBadge} ${statusCfg.className}`}>
                      <StatusIcon size={10} />
                      {statusCfg.label}
                    </span>

                    {paper.category && (
                      <span
                        className={styles.categoryBadge}
                        style={{ borderColor: paper.category.color ?? "#1e3a8a" }}
                      >
                        {paper.category.name}
                      </span>
                    )}

                    {fileType && (
                      <span className={styles.fileTypeBadge}>
                        <FileType size={10} />
                        {fileType}
                        {fileSize && ` · ${fileSize}`}
                      </span>
                    )}

                    <span className={styles.paperDate}>{dateLabel}</span>
                    <span className={styles.paperDate}>v{paper.version}</span>

                    {paper._count.reviews > 0 && (
                      <span className={styles.reviewCount}>
                        {paper._count.reviews} review{paper._count.reviews !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <h2 className={styles.paperTitle}>{paper.title}</h2>
                  <p className={`${styles.paperAbstract} line-clamp-2`}>{paper.abstract}</p>

                  {/* Keywords */}
                  {paper.keywords.length > 0 && (
                    <div className={styles.keywords}>
                      {paper.keywords.slice(0, 4).map((kw) => (
                        <span key={kw} className={styles.keyword}>{kw}</span>
                      ))}
                      {paper.keywords.length > 4 && (
                        <span className={styles.keyword}>+{paper.keywords.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.paperActions}>
                  {paper.status === "PUBLISHED" && (
                    <Link href={`/papers/${paper.id}`}>
                      <Button variant="secondary" size="sm">View</Button>
                    </Link>
                  )}
                  {paper.status === "DRAFT" && (
                    <Link href={`/submit?draft=${paper.id}`}>
                      <Button variant="primary" size="sm">Continue</Button>
                    </Link>
                  )}
                  {paper.status === "REVISION_REQUESTED" && (
                    <Link href={`/submit?draft=${paper.id}`}>
                      <Button variant="outline" size="sm">Revise</Button>
                    </Link>
                  )}
                  {["SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED"].includes(paper.status) && (
                    <Link href={`/papers/${paper.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
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
