import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JournalDetailEditorView } from "./JournalDetailEditorView";

export const metadata: Metadata = {
  title: "Issue Manuscript Editor — Shaoor",
  description: "Curate and publish approved academic manuscripts into journal issues.",
};

export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isMaster = !!(session.user as any)?.isMaster || session.user.email === "shouket.tilwani@gmail.com";
  if (!isMaster) {
    redirect("/review");
  }

  const resolved = await Promise.resolve(params);
  const journalId = resolved.id;

  const [journal, acceptedPapers] = await Promise.all([
    prisma.journal.findUnique({
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
    }),
    prisma.paper.findMany({
      where: { status: { in: ["ACCEPTED", "PUBLISHED"] } },
      select: {
        id: true,
        title: true,
        abstract: true,
        version: true,
        author: { select: { name: true, email: true } },
        category: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  if (!journal) {
    notFound();
  }

  const entries = journal.entries.map((e) => ({
    id: e.id,
    paperId: e.paperId,
    title: e.paper.title,
    authorName: e.paper.author.name || e.paper.author.email || "Author",
    authorAffiliation: e.paper.author.affiliation || "",
    category: e.paper.category?.name || "General",
    pageStart: e.pageStart,
    pageEnd: e.pageEnd,
    sortOrder: e.sortOrder,
    addedAt: e.addedAt.toISOString(),
  }));

  const availablePapers = acceptedPapers
    .filter((p) => !journal.entries.some((e) => e.paperId === p.id))
    .map((p) => ({
      id: p.id,
      title: p.title,
      authorName: p.author.name || p.author.email || "Author",
      category: p.category?.name || "General",
    }));

  return (
    <JournalDetailEditorView
      journal={{
        id: journal.id,
        title: journal.title,
        slug: journal.slug,
        volume: journal.volume,
        issue: journal.issue,
        description: journal.description,
        publishedAt: journal.publishedAt.toISOString(),
      }}
      initialEntries={entries}
      availablePapers={availablePapers}
    />
  );
}
