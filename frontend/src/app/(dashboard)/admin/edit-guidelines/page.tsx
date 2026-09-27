import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DEFAULT_GUIDELINES_CONTENT, PageTemplateData } from "@/lib/pageContentDefaults";
import { PageEditorView } from "../PageEditorView";

export const metadata: Metadata = {
  title: "Edit Author Guidelines — Shaoor",
  description: "Administrative editor for Author Guidelines and manuscript submission instructions.",
};

export default async function EditGuidelinesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isMaster = !!(session.user as any)?.isMaster || session.user.email === "shouket.tilwani@gmail.com";
  if (!isMaster) {
    redirect("/review");
  }

  const page = await prisma.pageContent.findUnique({
    where: { slug: "author-guidelines" },
  });

  let initialData: PageTemplateData = DEFAULT_GUIDELINES_CONTENT;
  if (page) {
    try {
      initialData = {
        title: page.title,
        subtitle: page.subtitle ?? DEFAULT_GUIDELINES_CONTENT.subtitle,
        sections: JSON.parse(page.content),
      };
    } catch {
      // Fallback
    }
  }

  return (
    <PageEditorView
      slug="author-guidelines"
      pageName="Author Guidelines"
      publicUrl="/guidelines"
      initialData={initialData}
      defaultData={DEFAULT_GUIDELINES_CONTENT}
      lastUpdated={page?.updatedAt?.toISOString()}
      updatedBy={page?.updatedBy}
    />
  );
}
