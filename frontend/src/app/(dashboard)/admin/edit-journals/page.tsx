import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JournalPageEditorView } from "./JournalPageEditorView";
import { DEFAULT_JOURNALS_PAGE_CONTENT } from "@/lib/pageContentDefaults";

export const metadata: Metadata = {
  title: "Edit Journals Page — Shaoor",
  description:
    "Platform owner editor for the public journals landing page — customize hero text, metrics, and archive descriptions.",
};

export default async function EditJournalsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isMaster =
    !!(session.user as any)?.isMaster ||
    session.user.email === "shouket.tilwani@gmail.com";
  if (!isMaster) {
    redirect("/review");
  }

  const page = await prisma.pageContent.findUnique({
    where: { slug: "journals" },
  });

  let initialData = DEFAULT_JOURNALS_PAGE_CONTENT;
  if (page) {
    try {
      const parsed = JSON.parse(page.content);
      initialData = {
        title: page.title || DEFAULT_JOURNALS_PAGE_CONTENT.title,
        subtitle: page.subtitle || DEFAULT_JOURNALS_PAGE_CONTENT.subtitle,
        badge: parsed.badge || DEFAULT_JOURNALS_PAGE_CONTENT.badge,
        metric1Label:
          parsed.metric1Label || DEFAULT_JOURNALS_PAGE_CONTENT.metric1Label,
        metric1Value:
          parsed.metric1Value || DEFAULT_JOURNALS_PAGE_CONTENT.metric1Value,
        metric2Label:
          parsed.metric2Label || DEFAULT_JOURNALS_PAGE_CONTENT.metric2Label,
        metric2Value:
          parsed.metric2Value || DEFAULT_JOURNALS_PAGE_CONTENT.metric2Value,
        metric3Label:
          parsed.metric3Label || DEFAULT_JOURNALS_PAGE_CONTENT.metric3Label,
        metric3Value:
          parsed.metric3Value || DEFAULT_JOURNALS_PAGE_CONTENT.metric3Value,
        archiveHeading:
          parsed.archiveHeading ||
          DEFAULT_JOURNALS_PAGE_CONTENT.archiveHeading,
        archiveSubheading:
          parsed.archiveSubheading ||
          DEFAULT_JOURNALS_PAGE_CONTENT.archiveSubheading,
        emptyStateTitle:
          parsed.emptyStateTitle ||
          DEFAULT_JOURNALS_PAGE_CONTENT.emptyStateTitle,
        emptyStateMessage:
          parsed.emptyStateMessage ||
          DEFAULT_JOURNALS_PAGE_CONTENT.emptyStateMessage,
      };
    } catch {
      // Content could not be parsed, use defaults
    }
  }

  return <JournalPageEditorView initialData={initialData} />;
}
