import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users, FileEdit, Building } from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Our Team & Editorial Board — Shaoor",
  description:
    "Distinguished editorial leadership, section editors, and academic peer reviewers guiding the scholarly rigor of Shaoor Journal.",
};

const DEFAULT_TEAM = [
  {
    name: "Dr. Shoukat Tilwani",
    designation: "Editor-in-Chief & Founder",
    institution: "Stanford Institute for Theoretical Science",
    summary:
      "Leading researcher and academic chair overseeing strategic publication ethics, editorial governance, and transdisciplinary peer review standards.",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Prof. Tariq Mahmood",
    designation: "Senior Review Editor",
    institution: "Quaid-i-Azam University, Dept. of Applied Sciences",
    summary:
      "Specialist in algorithmic validation, cognitive systems, and data-driven computational methodologies with over 15 years of editorial experience.",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Dr. Aisha Siddiqui",
    designation: "Section Editor (Biomedicine)",
    institution: "Lahore University of Management Sciences",
    summary:
      "Pioneer in neurodegenerative disease biomarkers, biomedical imaging informatics, and clinical translation research.",
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Prof. Zahir Rahman",
    designation: "Section Editor (Social Sciences)",
    institution: "Karachi University",
    summary:
      "Renowned scholar in educational socioeconomic disparities, digital divide analytics, and qualitative policy frameworks.",
    sortOrder: 4,
    isActive: true,
  },
];

export default async function TeamPage() {
  const session = await auth();
  const isOwner =
    !!(session?.user as any)?.isMaster || session?.user?.email === "shouket.tilwani@gmail.com";

  let members = await prisma.teamMember.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Seed default leadership if DB is empty
  if (members.length === 0) {
    try {
      await prisma.teamMember.createMany({
        data: DEFAULT_TEAM,
      });
      members = await prisma.teamMember.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    } catch {
      // Fallback
      members = DEFAULT_TEAM as any;
    }
  }

  return (
    <>
      <Header />
      <main className={styles.page}>
        {/* ── Hero Section ───────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.badge}>
              <Users size={13} />
              Editorial Leadership
            </div>
            <h1 className={styles.title}>Our Team &amp; Editorial Board</h1>
            <p className={styles.subtitle}>
              Committed scholars, professors, and field specialists ensuring the highest standards of peer review, scientific integrity, and open-access scholarship.
            </p>

            {isOwner && (
              <div style={{ marginTop: "16px" }}>
                <Link href="/admin/edit-team" className={styles.adminEditBadge}>
                  <FileEdit size={13} />
                  Edit Our Team (Owner)
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── Team Grid ───────────────────────────────────────── */}
        <div className={styles.container}>
          {members.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={36} style={{ margin: "0 auto 12px auto", color: "#94a3b8" }} />
              <p>Editorial board directory is being updated.</p>
            </div>
          ) : (
            <div className={styles.teamGrid}>
              {members.map((member) => (
                <div key={member.id ?? member.name} className={styles.memberCard}>
                  <div className={styles.cardTop}>
                    {member.image ? (
                      <img src={member.image} alt={member.name} className={styles.avatar} />
                    ) : (
                      <div className={styles.avatar}>
                        {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )}

                    <div className={styles.memberMeta}>
                      <div className={styles.memberName}>{member.name}</div>
                      <span className={styles.designationBadge}>{member.designation}</span>
                      <div className={styles.institution}>
                        <Building size={11} style={{ display: "inline", marginRight: 4 }} />
                        {member.institution}
                      </div>
                    </div>
                  </div>

                  <p className={styles.summary}>{member.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
