import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_GUIDELINES_CONTENT, PageSection } from "@/lib/pageContentDefaults";
import {
  BookOpen,
  FileText,
  FileEdit,
  Send,
  ScrollText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Author Guidelines — Shaoor",
  description:
    "Comprehensive criteria, formatting instructions, and ethical standards for submitting scholarly manuscripts to Shaoor Academic Journal.",
};

export default async function GuidelinesPage() {
  const session = await auth();
  const isAdmin =
    session?.user &&
    ["ADMIN", "DESIGNER"].includes((session.user as any)?.role);

  const page = await prisma.pageContent.findUnique({
    where: { slug: "author-guidelines" },
  });

  const title = page?.title ?? DEFAULT_GUIDELINES_CONTENT.title;
  const subtitle = page?.subtitle ?? DEFAULT_GUIDELINES_CONTENT.subtitle;

  let sections: PageSection[] = DEFAULT_GUIDELINES_CONTENT.sections;
  if (page) {
    try {
      sections = JSON.parse(page.content);
    } catch {
      // Fallback
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
              <ScrollText size={13} />
              Editorial Submission Standards
            </div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>

            {isAdmin && (
              <div style={{ marginTop: "16px" }}>
                <Link href="/admin/edit-guidelines" className={styles.adminEditBadge}>
                  <FileEdit size={13} />
                  Edit Author Guidelines (Admin)
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── Content Sections ───────────────────────────────── */}
        <div className={styles.container}>
          {sections.map((section, idx) => (
            <article key={section.id || idx} className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  {idx === 0 ? (
                    <FileText size={16} />
                  ) : idx === 1 ? (
                    <BookOpen size={16} />
                  ) : idx === 3 ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                </div>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
              </div>

              <div className={styles.sectionBody}>
                {section.body.split("\n\n").map((para, pIdx) => (
                  <p key={pIdx}>
                    {para.split("\n").map((line, lIdx) => (
                      <span key={lIdx}>
                        {line}
                        {lIdx < para.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            </article>
          ))}

          {/* ── Call to Action Card ───────────────────────────── */}
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>Ready to Submit Your Manuscript?</h2>
            <p className={styles.ctaDesc}>
              Follow the preparation instructions above and submit your paper via our streamlined 5-stage editorial wizard.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/submit" className={styles.ctaBtnPrimary}>
                <Send size={15} />
                Proceed to Manuscript Submission
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
