import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TeamEditorView } from "./TeamEditorView";

export const metadata: Metadata = {
  title: "Edit Our Team — Shaoor",
  description: "Platform owner portal for managing editorial team members, leadership, and reviewers.",
};

export default async function EditTeamPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;
  if (role !== "ADMIN" && role !== "DESIGNER") {
    redirect("/my-papers");
  }

  const rawMembers = await prisma.teamMember.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const members = rawMembers.map((m) => ({
    id: m.id,
    name: m.name,
    designation: m.designation,
    institution: m.institution,
    summary: m.summary,
    image: m.image,
    email: m.email,
    sortOrder: m.sortOrder,
    isActive: m.isActive,
  }));

  return <TeamEditorView initialMembers={members} />;
}
