import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HelpCircle, Settings } from "lucide-react";
import { DEFAULT_FAQ_CONTENT, FaqPageData } from "@/lib/pageContentDefaults";
import { FAQAccordion } from "./FAQAccordion";
import styles from "./faq.module.css";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) — Shaoor",
  description:
    "Common inquiries regarding peer review methodology, manuscript submission criteria, open access indexing, and editorial policies on Shaoor.",
};

export default async function PublicFaqPage() {
  const session = await auth();
  const isOwner =
    !!(session?.user as any)?.isMaster ||
    session?.user?.email === "shouket.tilwani@gmail.com";

  let content: FaqPageData = DEFAULT_FAQ_CONTENT;
  try {
    const pageRow = await prisma.pageContent.findUnique({
      where: { slug: "faq" },
    });
    if (pageRow) {
      let parsed: any = {};
      try {
        parsed = JSON.parse(pageRow.content);
      } catch {
        // fallback
      }
      content = {
        title: pageRow.title || DEFAULT_FAQ_CONTENT.title,
        subtitle: pageRow.subtitle || DEFAULT_FAQ_CONTENT.subtitle,
        badge: parsed.badge || DEFAULT_FAQ_CONTENT.badge,
        contactHeading: parsed.contactHeading || DEFAULT_FAQ_CONTENT.contactHeading,
        contactDescription: parsed.contactDescription || DEFAULT_FAQ_CONTENT.contactDescription,
        contactEmail: parsed.contactEmail || DEFAULT_FAQ_CONTENT.contactEmail,
        items: Array.isArray(parsed.items) && parsed.items.length > 0
          ? parsed.items
          : DEFAULT_FAQ_CONTENT.items,
      };
    }
  } catch (err) {
    console.error("Failed to load FAQ content from database:", err);
  }

  return (
    <div className={styles.page}>
      <Header />

      <main>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.badge}>
              <HelpCircle size={13} />
              {content.badge}
            </div>
            <h1 className={styles.title}>{content.title}</h1>
            <p className={styles.subtitle}>{content.subtitle}</p>

            {isOwner && (
              <div className={styles.ownerBar}>
                <Link href="/admin/edit-faq" className={styles.adminEditBadge}>
                  <Settings size={13} />
                  Edit FAQ Content (Platform Owner)
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Accordion Component with Search & Category Filtering */}
        <FAQAccordion content={content} />
      </main>

      <Footer />
    </div>
  );
}
