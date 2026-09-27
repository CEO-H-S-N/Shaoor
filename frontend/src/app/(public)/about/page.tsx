import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ABOUT_CONTENT, PageSection } from "@/lib/pageContentDefaults";
import {
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  FileEdit,
  Send,
  ScrollText,
} from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About — Shaoor",
  description:
    "Learn about Shaoor, an open-access international academic publishing platform committed to rigorous peer review and transparent scholarship.",
};

export default async function AboutPage() {
  const session = await auth();
  const isOwner =
    !!(session?.user as any)?.isMaster || session?.user?.email === "shouket.tilwani@gmail.com";

  const page = await prisma.pageContent.findUnique({
    where: { slug: "about" },
  });

  const title = page?.title ?? DEFAULT_ABOUT_CONTENT.title;
  const subtitle = page?.subtitle ?? DEFAULT_ABOUT_CONTENT.subtitle;

  let sections: PageSection[] = DEFAULT_ABOUT_CONTENT.sections;
  if (page) {
    try {
      sections = JSON.parse(page.content);
    } catch {
      // Fallback to default
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
              <BookOpen size={13} />
              Open-Access Scholarly Journal
            </div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>

            {isOwner && (
              <div style={{ marginTop: "16px" }}>
                <Link href="/admin/edit-about" className={styles.adminEditBadge}>
                  <FileEdit size={13} />
                  Edit About Page (Owner)
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── Dynamic Content Sections ──────────────────────── */}
        <div className={styles.container}>
          {sections.map((section, idx) => (
            <article key={section.id || idx} className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  {idx % 3 === 0 ? (
                    <BookOpen size={16} />
                  ) : idx % 3 === 1 ? (
                    <ShieldCheck size={16} />
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
            <h2 className={styles.ctaTitle}>Ready to Disseminate Your Research?</h2>
            <p className={styles.ctaDesc}>
              Submit your original paper for double-blind peer review. Authors retain copyright with permanent open-access preservation.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/submit" className={styles.ctaBtnPrimary}>
                <Send size={15} />
                Submit Manuscript
              </Link>
              <Link href="/guidelines" className={styles.ctaBtnSecondary}>
                <ScrollText size={15} />
                Read Author Guidelines
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
