import Link from "next/link";
import {
  FileText,
  Search,
  ArrowRight,
  Eye,
  ShieldCheck,
  Zap,
  Globe2,
  TrendingUp,
  Clock,
  Send,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

// 6 blank placeholder slots when database has no published papers yet
const BLANK_SLOTS = [
  { id: "slot-1", label: "Volume I · Issue 1", tag: "Slot Open" },
  { id: "slot-2", label: "Volume I · Issue 2", tag: "Under Review" },
  { id: "slot-3", label: "Volume I · Issue 3", tag: "Awaiting Paper" },
  { id: "slot-4", label: "Volume I · Issue 4", tag: "Slot Open" },
  { id: "slot-5", label: "Volume I · Issue 5", tag: "Under Review" },
  { id: "slot-6", label: "Volume I · Issue 6", tag: "Awaiting Paper" },
];

export default async function HomePage() {
  // Fetch real data from the database safely
  let publishedPapers: any[] = [];
  let popularPapers: any[] = [];

  try {
    const [published, popular] = await Promise.all([
      prisma.paper.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 8,
        include: {
          category: { select: { name: true, color: true } },
          author: { select: { name: true, email: true } },
        },
      }),
      prisma.paper.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { viewCount: "desc" },
        take: 8,
        include: {
          category: { select: { name: true, color: true } },
          author: { select: { name: true, email: true } },
        },
      }),
    ]);

    publishedPapers = published;
    popularPapers = popular;
  } catch (error) {
    console.error("Database query fallback on homepage:", error);
  }

  // Double items for seamless infinite carousel loop
  const latestList = publishedPapers.length > 0 ? [...publishedPapers, ...publishedPapers] : [];
  const popularList = popularPapers.length > 0 ? [...popularPapers, ...popularPapers] : [];
  const blankLatestList = [...BLANK_SLOTS, ...BLANK_SLOTS];
  const blankPopularList = [...BLANK_SLOTS, ...BLANK_SLOTS];

  return (
    <div className={styles.pageWrapper}>
      {/* Top Bar — untouched as requested */}
      <Header />

      <main id="main-content">
        {/* ─── Hero Section with Nature Background at Top (No Card, No Overlay) ─── */}
        <section className={styles.hero}>
          <div className={styles.heroBackdrop} />
          <div className={styles.heroContainer}>
            <div className={styles.heroTextOnly}>
              <h1 className={styles.heroTitle}>
                Publish Impactful Research.
                <span className={styles.heroTitleAccent}>Peer-Reviewed & Open to the World.</span>
              </h1>

              <p className={styles.heroDescription}>
                Shaoor is a peer-reviewed scholarly publishing platform built for researchers,
                authors, and academics. Experience transparent double-blind review,
                open access indexing, and AI-powered academic guidance.
              </p>
            </div>
          </div>

          {/* Flat white line divider (no fade) */}
          <div className={styles.heroDivider} />
        </section>

        {/* ─── Solid Pure White Body Below Hero ────────────────────── */}
        <div className={styles.solidBody}>
          <div className={styles.stripeSpacer} />

          {/* ─── Section 1: Latest Publishes (Revolving Left - Blue Stripe) ─── */}
          <section className={styles.sectionWrapper}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <h2 className={styles.sectionHeading}>Latest Publishes</h2>
                <p className={styles.sectionSubheading}>
                  Recently published peer-reviewed research articles across all disciplines.
                </p>
              </div>

              <Link href="/papers" className={styles.viewAllBtn} id="view-all-latest-btn">
                View All Papers <ArrowRight size={13} />
              </Link>
            </div>

            <div className={styles.carouselContainer} aria-label="Revolving carousel of latest published papers">
              <div className={styles.trackScrollLeft}>
                {publishedPapers.length > 0 ? (
                  latestList.map((paper, idx) => (
                    <Link
                      key={`latest-${paper.id}-${idx}`}
                      href={`/papers/${paper.id}`}
                      className={styles.paperCard}
                    >
                      <div>
                        <div className={styles.cardHeader}>
                          <span className={styles.cardCategory}>
                            {paper.category?.name || "General"}
                          </span>
                          <span className={styles.cardViews}>
                            <Eye size={12} />
                            {paper.viewCount || 0}
                          </span>
                        </div>
                        <h3 className={styles.cardTitle}>{paper.title}</h3>
                        <p className={styles.cardAbstract}>{paper.abstract}</p>
                      </div>

                      <div className={styles.cardFooter}>
                        <span className={styles.cardAuthor}>
                          {paper.author?.name || "Anonymous Author"}
                        </span>
                        <span>{formatDate(paper.publishedAt || paper.createdAt)}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  // Blank placeholder cards dynamically filled as papers are published
                  blankLatestList.map((slot, idx) => (
                    <div key={`blank-latest-${slot.id}-${idx}`} className={styles.blankCard}>
                      <div>
                        <div className={styles.cardHeader}>
                          <span className={styles.blankBadge}>
                            <Clock size={10} />
                            {slot.tag}
                          </span>
                          <div className={styles.blankIconWrap}>
                            <FileText size={15} />
                          </div>
                        </div>

                        <div className={styles.blankSkeletonBox}>
                          <div className={styles.skeletonLine} />
                          <div className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
                        </div>

                        <p className={styles.blankNotice}>
                          {slot.label} — This slot automatically populates as soon as a paper completes peer review and publishes.
                        </p>
                      </div>

                      <Link href="/submit" className={styles.blankActionLink}>
                        Submit manuscript to fill slot <ArrowRight size={12} />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <div className={styles.stripeSpacer} />

          {/* ─── Section 2: Popular Research (Revolving Right) ──────── */}
          <section className={styles.sectionWrapperAlt}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <h2 className={styles.sectionHeading}>Popular Research</h2>
                <p className={styles.sectionSubheading}>
                  Most viewed and referenced publications ranked by community readership.
                </p>
              </div>

              <Link href="/papers" className={styles.viewAllBtn} id="view-all-popular-btn">
                View All Popular <ArrowRight size={13} />
              </Link>
            </div>

            <div className={styles.carouselContainer} aria-label="Revolving carousel of popular papers in opposite direction">
              <div className={styles.trackScrollRight}>
                {popularPapers.length > 0 ? (
                  popularList.map((paper, idx) => (
                    <Link
                      key={`popular-${paper.id}-${idx}`}
                      href={`/papers/${paper.id}`}
                      className={styles.paperCard}
                    >
                      <div>
                        <div className={styles.cardHeader}>
                          <span className={styles.cardCategory}>
                            {paper.category?.name || "General"}
                          </span>
                          <span className={styles.cardViews}>
                            <Eye size={12} />
                            {paper.viewCount || 0}
                          </span>
                        </div>
                        <h3 className={styles.cardTitle}>{paper.title}</h3>
                        <p className={styles.cardAbstract}>{paper.abstract}</p>
                      </div>

                      <div className={styles.cardFooter}>
                        <span className={styles.cardAuthor}>
                          {paper.author?.name || "Anonymous Author"}
                        </span>
                        <span>{formatDate(paper.publishedAt || paper.createdAt)}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  // Blank placeholder cards dynamically filled as views and papers accumulate
                  blankPopularList.map((slot, idx) => (
                    <div key={`blank-pop-${slot.id}-${idx}`} className={styles.blankCard}>
                      <div>
                        <div className={styles.cardHeader}>
                          <span className={styles.blankBadge}>
                            <TrendingUp size={10} />
                            {slot.tag}
                          </span>
                          <div className={styles.blankIconWrap}>
                            <Sparkles size={15} />
                          </div>
                        </div>

                        <div className={styles.blankSkeletonBox}>
                          <div className={styles.skeletonLine} />
                          <div className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
                        </div>

                        <p className={styles.blankNotice}>
                          Trending Slot #{idx % 6 + 1} — Dynamically pulled from database and sorted by view count once papers receive readership.
                        </p>
                      </div>

                      <Link href="/submit" className={styles.blankActionLink}>
                        Publish high-impact work <ArrowRight size={12} />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <div className={styles.stripeSpacer} />

          {/* ─── Platform Features (Solid Clean Cards) ──────────────── */}
          <section className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <ShieldCheck size={22} />
              </div>
              <h3 className={styles.featureTitle}>Rigorous Peer Review</h3>
              <p className={styles.featureDescription}>
                Standardized evaluation criteria and double-blind peer review maintain high editorial standards
                while providing constructive feedback to authors.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Zap size={22} />
              </div>
              <h3 className={styles.featureTitle}>AI Academic Guidance</h3>
              <p className={styles.featureDescription}>
                Integrated Gemini AI assistance helps scholars structure submissions, verify methodology,
                and navigate publication standards seamlessly.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Globe2 size={22} />
              </div>
              <h3 className={styles.featureTitle}>Global Open Access</h3>
              <p className={styles.featureDescription}>
                All accepted publications are immediately accessible worldwide with permanent archival,
                clean metadata, and open citation availability.
              </p>
            </div>
          </section>

          {/* ─── CTA Banner ─────────────────────────────────────────── */}
          <section className={styles.ctaBanner}>
            <div className={styles.ctaBox}>
              <div className={styles.ctaLeft}>
                <h2 className={styles.ctaTitle}>Ready to Share Your Research?</h2>
                <p className={styles.ctaDescription}>
                  Join the growing network of authors and reviewers publishing on Shaoor.
                  Submit your manuscript today or browse existing open access papers.
                </p>
              </div>

              <div className={styles.ctaButtonGroup}>
                <Link href="/submit" className={styles.ctaBtnWhite}>
                  <Send size={15} />
                  Start Submission
                </Link>
                <Link href="/papers" className={styles.ctaBtnOutline}>
                  <Search size={15} />
                  Browse Papers
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer — crisp solid dark slate with no muddy washing out */}
      <Footer />
    </div>
  );
}
