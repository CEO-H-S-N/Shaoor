import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JournalsManagerView } from "./JournalsManagerView";

export const metadata: Metadata = {
  title: "Manage Journals — Shaoor",
  description: "Platform owner journal publication portal. Create volumes, manage issues, and publish accepted manuscripts.",
};

export default async function AdminJournalsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isMaster = !!(session.user as any)?.isMaster || session.user.email === "shouket.tilwani@gmail.com";
  if (!isMaster) {
    redirect("/review");
  }

  const rawJournals = await prisma.journal.findMany({
    orderBy: [{ volume: "desc" }, { issue: "desc" }],
    include: {
      _count: {
        select: { entries: true },
      },
    },
  });

  const journals = rawJournals.map((j) => ({
    id: j.id,
    title: j.title,
    description: j.description,
    volume: j.volume,
    issue: j.issue,
    coverImage: j.coverImage,
    publishedAt: j.publishedAt.toISOString(),
    isActive: j.isActive,
    papersCount: j._count.entries,
  }));

  return <JournalsManagerView initialJournals={journals} />;
}
