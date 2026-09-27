import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = {
  title: "Account Settings — Shaoor",
  description: "Manage your academic profile, avatar, affiliation, and ORCID iD on Shaoor.",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Live Prisma query for full user record
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      image: true,
      role: true,
      affiliation: true,
      bio: true,
      orcidId: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          papers: true,
          reviews: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return <SettingsForm initialUser={user} />;
}
