import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ABOUT_CONTENT, PageTemplateData } from "@/lib/pageContentDefaults";
import { PageEditorView } from "../PageEditorView";

export const metadata: Metadata = {
  title: "Edit About Page — Shaoor",
  description: "Administrative editor for the About Shaoor public publication portal.",
};

export default async function EditAboutPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isMaster = !!(session.user as any)?.isMaster || session.user.email === "shouket.tilwani@gmail.com";
  if (!isMaster) {
    redirect("/review");
  }

  const page = await prisma.pageContent.findUnique({
    where: { slug: "about" },
  });

  let initialData: PageTemplateData = DEFAULT_ABOUT_CONTENT;
  if (page) {
    try {
      initialData = {
        title: page.title,
        subtitle: page.subtitle ?? DEFAULT_ABOUT_CONTENT.subtitle,
        sections: JSON.parse(page.content),
      };
    } catch {
      // Fallback
    }
  }

  return (
    <PageEditorView
      slug="about"
      pageName="About Page"
      publicUrl="/about"
      initialData={initialData}
      defaultData={DEFAULT_ABOUT_CONTENT}
      lastUpdated={page?.updatedAt?.toISOString()}
      updatedBy={page?.updatedBy}
    />
  );
}
