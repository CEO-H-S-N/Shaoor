import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreateAdminView } from "./CreateAdminView";

export const metadata: Metadata = {
  title: "Make Admin Account — Shaoor",
  description: "Generate and manage administrator credentials for scholarly peers and professors.",
};

export default async function CreateAdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;
  if (role !== "ADMIN" && role !== "DESIGNER") {
    redirect("/my-papers");
  }

  // Load existing admins from DB
  const rawAdmins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      affiliation: true,
      isActive: true,
      bannedAt: true,
      bannedReason: true,
      createdAt: true,
      _count: {
        select: {
          reviews: true,
          papers: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const admins = rawAdmins.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    bannedAt: a.bannedAt ? a.bannedAt.toISOString() : null,
  }));

  return (
    <CreateAdminView
      initialAdmins={admins}
      currentUserId={session.user.id!}
      currentUserEmail={session.user.email!}
    />
  );
}
