import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UsersManagementView } from "./UsersManagementView";

export const metadata: Metadata = {
  title: "Manage Accounts — Shaoor",
  description: "User account management, access controls, temporary suspensions, and administrative registry.",
};

export default async function ManageUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;
  if (role !== "ADMIN" && role !== "DESIGNER") {
    redirect("/my-papers");
  }

  // Load all users from DB
  const rawUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      username: true,
      affiliation: true,
      isActive: true,
      bannedAt: true,
      bannedReason: true,
      createdAt: true,
      _count: {
        select: {
          papers: true,
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const users = rawUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    bannedAt: u.bannedAt ? u.bannedAt.toISOString() : null,
  }));

  const totalCount = await prisma.user.count();
  const activeCount = await prisma.user.count({ where: { isActive: true } });
  const bannedCount = await prisma.user.count({ where: { isActive: false } });
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });

  return (
    <UsersManagementView
      initialUsers={users}
      initialStats={{
        total: totalCount,
        active: activeCount,
        banned: bannedCount,
        admins: adminCount,
      }}
      currentUserId={session.user.id!}
      currentUserEmail={session.user.email!}
    />
  );
}
