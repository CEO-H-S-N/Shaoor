import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JournalsManagerView } from "./JournalsManagerView";

export const metadata: Metadata = {
  title: "Manage Journals — Shaoor",
  description: "Platform owner journal publication portal. Create volumes, manage issues, and publish accepted manuscripts.",
};

interface PageProps {
  searchParams?: Promise<{ create?: string }>;
}

export default async function AdminJournalsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isMaster = !!(session.user as any)?.isMaster || session.user.email === "shouket.tilwani@gmail.com";
  if (!isMaster) {
    redirect("/review");
  }

  const params = searchParams ? await searchParams : {};
  const autoOpenCreate = params.create === "true";

  const [rawJournals, rawPapers] = await Promise.all([
    prisma.journal.findMany({
      orderBy: [{ volume: "desc" }, { issue: "desc" }],
      include: {
        _count: {
          select: { entries: true },
        },
      },
    }),
    prisma.paper.findMany({
      where: { status: { in: ["ACCEPTED", "PUBLISHED"] } },
      select: {
        id: true,
        title: true,
        category: { select: { name: true } },
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const journals = rawJournals.map((j) => ({
    id: j.id,
    title: j.title,
    slug: j.slug,
    description: j.description,
    volume: j.volume,
    issue: j.issue,
    coverImage: j.coverImage,
    publishedAt: j.publishedAt.toISOString(),
    isActive: j.isActive,
    papersCount: j._count.entries,
  }));

  const availablePapers = rawPapers.map((p) => ({
    id: p.id,
    title: p.title,
    categoryName: p.category?.name || "General Research",
    authorName: p.author?.name || "Anonymous Researcher",
  }));

  return (
    <JournalsManagerView
      initialJournals={journals}
      availablePapers={availablePapers}
      autoOpenCreate={autoOpenCreate}
    />
  );
}
