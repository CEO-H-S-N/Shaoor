import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HomeEditorView } from "./HomeEditorView";
import { DEFAULT_HOMEPAGE_CONTENT } from "@/lib/pageContentDefaults";

export const metadata: Metadata = {
  title: "Edit Homepage — Shaoor",
  description: "Platform owner editor for the public landing page hero text and headlines.",
};

export default async function EditHomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isMaster = !!(session.user as any)?.isMaster || session.user.email === "shouket.tilwani@gmail.com";
  if (!isMaster) {
    redirect("/review");
  }

  const page = await prisma.pageContent.findUnique({
    where: { slug: "homepage" },
  });

  let initialData = DEFAULT_HOMEPAGE_CONTENT;
  if (page) {
    try {
      const parsed = JSON.parse(page.content);
      initialData = {
        title: page.title || DEFAULT_HOMEPAGE_CONTENT.title,
        subtitle: page.subtitle || DEFAULT_HOMEPAGE_CONTENT.subtitle,
        description: parsed.description || DEFAULT_HOMEPAGE_CONTENT.description,
      };
    } catch {
      initialData = {
        title: page.title || DEFAULT_HOMEPAGE_CONTENT.title,
        subtitle: page.subtitle || DEFAULT_HOMEPAGE_CONTENT.subtitle,
        description: page.content || DEFAULT_HOMEPAGE_CONTENT.description,
      };
    }
  }

  return <HomeEditorView initialData={initialData} />;
}
