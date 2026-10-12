import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FAQEditorView } from "./FAQEditorView";
import { DEFAULT_FAQ_CONTENT, FaqPageData } from "@/lib/pageContentDefaults";

export const metadata: Metadata = {
  title: "Edit FAQ Page — Shaoor",
  description: "Platform owner CMS editor for the public Frequently Asked Questions page.",
};

export default async function EditFaqPage() {
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
    where: { slug: "faq" },
  });

  let initialData: FaqPageData = DEFAULT_FAQ_CONTENT;
  if (page) {
    try {
      const parsed = JSON.parse(page.content);
      initialData = {
        title: page.title || DEFAULT_FAQ_CONTENT.title,
        subtitle: page.subtitle || DEFAULT_FAQ_CONTENT.subtitle,
        badge: parsed.badge || DEFAULT_FAQ_CONTENT.badge,
        contactHeading: parsed.contactHeading || DEFAULT_FAQ_CONTENT.contactHeading,
        contactDescription: parsed.contactDescription || DEFAULT_FAQ_CONTENT.contactDescription,
        contactEmail: parsed.contactEmail || DEFAULT_FAQ_CONTENT.contactEmail,
        items: Array.isArray(parsed.items) && parsed.items.length > 0
          ? parsed.items
          : DEFAULT_FAQ_CONTENT.items,
      };
    } catch {
      // fallback to defaults
    }
  }

  return <FAQEditorView initialData={initialData} />;
}
