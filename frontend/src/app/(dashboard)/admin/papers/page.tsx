import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ManagePapersView, ManagedPaper } from "./ManagePapersView";

export const metadata: Metadata = {
  title: "Manage & Delete Papers — Shaoor Master Admin",
  description: "Master administrative console to search, inspect, categorize, and permanently delete manuscripts.",
};

export default async function AdminPapersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;
  const isMaster =
    !!(session.user as any)?.isMaster ||
    session.user.email === "shouket.tilwani@gmail.com";

  if (!isMaster && role !== "ADMIN" && role !== "DESIGNER") {
    redirect("/review");
  }

  const rawPapers = await prisma.paper.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      journalEntries: {
        include: {
          journal: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  const papers: ManagedPaper[] = rawPapers.map((p) => {
    const journalEntry = p.journalEntries && p.journalEntries.length > 0 ? p.journalEntries[0] : null;
    return {
      id: p.id,
      title: p.title,
      slug: (p as any).slug || null,
      status: p.status,
      abstract: p.abstract,
      viewCount: p.viewCount || 0,
      downloadCount: p.downloadCount || 0,
      createdAt: p.createdAt.toISOString(),
      author: {
        id: p.author?.id,
        name: p.author?.name || null,
        email: p.author?.email || null,
      },
      category: p.category
        ? {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
          }
        : null,
      journal: journalEntry
        ? {
            id: journalEntry.journal.id,
            title: journalEntry.journal.title,
            slug: journalEntry.journal.slug,
          }
        : null,
    };
  });

  return <ManagePapersView papers={papers} isMaster={isMaster} />;
}
