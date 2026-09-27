import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmitWizard } from "./SubmitWizard";

export const metadata: Metadata = {
  title: "Manuscript Submission Portal — Shaoor",
  description:
    "Submit your original academic paper for double-blind peer review and open-access publication on Shaoor.",
};

export default async function SubmitPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Live Prisma query for active scientific categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
    },
  });

  return (
    <SubmitWizard
      categories={categories}
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    />
  );
}
