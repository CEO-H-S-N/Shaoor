import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReviewQueueView, ReviewPaperItem } from "./ReviewQueueView";

export const metadata: Metadata = {
  title: "Review Queue — Shaoor",
  description: "Peer review evaluation workspace for editorial assessment, manuscript approval, and feedback dispatch.",
};

export default async function ReviewQueuePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;
  if (role !== "ADMIN" && role !== "DESIGNER") {
    redirect("/my-papers");
  }

  // Load real papers from AWS RDS PostgreSQL
  const rawPapers = await prisma.paper.findMany({
    where: {
      status: {
        in: ["SUBMITTED", "UNDER_REVIEW", "REVISION_REQUESTED", "ACCEPTED", "REJECTED"],
      },
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
          affiliation: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      figures: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const now = new Date().getTime();

  const papers: ReviewPaperItem[] = rawPapers.map((p) => {
    const submitTime = p.submittedAt ? new Date(p.submittedAt).getTime() : new Date(p.createdAt).getTime();
    const daysInQueue = Math.max(0, Math.floor((now - submitTime) / (1000 * 60 * 60 * 24)));

    return {
      id: p.id,
      title: p.title,
      abstract: p.abstract,
      category: p.category?.name ?? "General Science",
      authorName: p.author.name ?? "Scholar",
      authorEmail: p.author.email ?? "Unknown",
      submittedAt: new Date(submitTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      daysInQueue,
      status: p.status,
      version: p.version,
      decisionMessage: p.decisionMessage,
      decisionBy: p.decisionBy,
      decisionAt: p.decisionAt ? p.decisionAt.toISOString() : null,
      figuresCount: p.figures.length,
    };
  });

  return <ReviewQueueView initialPapers={papers} />;
}
