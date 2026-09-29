import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AnnouncementEditorView, AnnouncementData } from "./AnnouncementEditorView";

export const metadata: Metadata = {
  title: "Edit Announcement — Shaoor",
  description: "Create and manage site-wide announcements and homepage popup notifications.",
};

export default async function EditAnnouncementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;
  if (role !== "ADMIN" && role !== "DESIGNER") {
    redirect("/my-papers");
  }

  // Load existing announcement
  const existing = await prisma.announcement.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  const initialData: AnnouncementData = existing
    ? {
        id: existing.id,
        title: existing.title,
        message: existing.message,
        imageUrl: existing.imageUrl || "",
        linkUrl: existing.linkUrl || "",
        linkLabel: existing.linkLabel || "",
        isActive: existing.isActive,
        showPopup: existing.showPopup,
        updatedBy: existing.updatedBy,
        updatedAt: existing.updatedAt?.toISOString() || null,
      }
    : {
        title: "",
        message: "",
        imageUrl: "",
        linkUrl: "",
        linkLabel: "",
        isActive: false,
        showPopup: false,
      };

  return <AnnouncementEditorView initialData={initialData} />;
}
