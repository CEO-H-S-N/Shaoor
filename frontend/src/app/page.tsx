import Link from "next/link";
import {
  FileText,
  Shield,
  Zap,
  Users,
  BookOpen,
  Search,
  ArrowRight,
  Sparkles,
  Eye,
  Calendar,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import styles from "./page.module.css";

// Sample data for demo — will be replaced with real API data
const samplePapers = [
  {
    id: "1",
    title: "Machine Learning Approaches for Early Detection of Neurodegenerative Diseases",
    abstract: "This paper presents a novel approach using deep learning models to identify early biomarkers of Alzheimer's and Parkinson's disease from routine clinical data...",
    author: "Dr. Sarah Chen",
    authorInitials: "SC",
    category: "Health & Medicine",
    categoryColor: "#00695c",
    date: "Sep 15, 2026",
    views: 1240,
  },
  {
    id: "2",
    title: "The Digital Divide in Rural Education: A Comprehensive Policy Analysis",
    abstract: "Examining how socioeconomic disparities in access to digital technology impact educational outcomes in rural communities across South Asia...",
    author: "Prof. Ahmed Khan",
    authorInitials: "AK",
    category: "Education",
    categoryColor: "#0052cc",
    date: "Sep 12, 2026",
    views: 890,
  },
  {
    id: "3",
    title: "Quantum Computing Applications in Cryptographic Security Protocols",
    abstract: "An exploration of post-quantum cryptographic algorithms and their implications for current internet security infrastructure...",
    author: "Dr. Priya Sharma",
    authorInitials: "PS",
    category: "Technology & Innovation",
    categoryColor: "#4a148c",
    date: "Sep 10, 2026",
    views: 2150,
  },
  {
    id: "4",
    title: "Social Media's Role in Shaping Political Discourse: A Longitudinal Study",
    abstract: "A five-year study analyzing the evolution of political communication patterns across major social media platforms and their impact on voter behavior...",
    author: "Dr. James Wilson",
    authorInitials: "JW",
    category: "Social Sciences",
    categoryColor: "#1a237e",
    date: "Sep 8, 2026",
    views: 1670,
  },
];

export default function HomePage() {
  return (
    <>
      <Header />

      <main>
        {/* ─── Hero Section ──────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroGlow} />
          <div className={styles.heroGlow2} />

          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <div className={styles.heroBadge}>
                <span className={styles.heroBadgeDot} />
                Open Access Publishing
              </div>

              <h1 className={styles.heroTitle}>
                Publish Your Research.<br />
                <span className={styles.heroTitleAccent}>Shape the Future.</span>
              </h1>

              <p className={styles.heroDescription}>
                Shaoor is a modern peer-reviewed academic platform where
                researchers submit, review, and publish impactful papers
                across disciplines — powered by rigorous review and AI assistance.
              </p>

              <div className={styles.heroActions}>
                <Link href="/submit" className={styles.ctaBtnWhite}>
                  <FileText size={18} />
                  Submit a Paper
                </Link>
                <Link href="/papers" className={styles.ctaBtnOutline}>
                  <Search size={18} />
                  Browse Papers
                </Link>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.floatingCards}>
                <div className={`${styles.floatingCard} ${styles.card1}`}>
                  <div className={styles.cardLabel}>Published Paper</div>
                  <div className={styles.cardTitle}>
                    Advances in Natural Language Processing for Low-Resource Languages
                  </div>
                  <div className={styles.cardMeta}>Dr. A. Rashid · 2,340 views</div>
                </div>

                <div className={`${styles.floatingCard} ${styles.card2}`}>
                  <div className={styles.cardLabel}>Under Review</div>
                  <div className={styles.cardTitle}>
                    Sustainable Urban Development Strategies
                  </div>
                  <div className={styles.cardMeta}>2 reviewers assigned</div>
                </div>

                <div className={`${styles.floatingCard} ${styles.card3}`}>
                  <div className={styles.cardLabel}>Just Accepted ✓</div>
                  <div className={styles.cardTitle}>
                    Climate Change Impact on Agricultural Yield
                  </div>
                  <div className={styles.cardMeta}>Score: 9.2/10</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Stats Bar ─────────────────────────────────── */}
        <section className={styles.statsBar}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>2,500+</div>
              <div className={styles.statLabel}>Papers Published</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>150+</div>
              <div className={styles.statLabel}>Expert Reviewers</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>45</div>
              <div className={styles.statLabel}>Countries</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>98%</div>
              <div className={styles.statLabel}>Author Satisfaction</div>
            </div>
          </div>
        </section>

        {/* ─── Features Section ──────────────────────────── */}
        <section className={styles.features}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Why Shaoor</span>
            <h2 className={styles.sectionTitle}>A Better Way to Publish</h2>
            <p className={styles.sectionDescription}>
              Modern tools for modern researchers. From submission to publication,
              every step is streamlined.
            </p>
          </div>

          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div
                className={styles.featureIcon}
                style={{ background: "linear-gradient(135deg, #1a237e, #0052cc)" }}
              >
                <Shield size={24} />
              </div>
              <h3 className={styles.featureTitle}>Rigorous Peer Review</h3>
              <p className={styles.featureDescription}>
                Multi-reviewer system with transparent feedback. Every paper
                undergoes thorough evaluation by domain experts before publication.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div
                className={styles.featureIcon}
                style={{ background: "linear-gradient(135deg, #4a148c, #7c43bd)" }}
              >
                <Sparkles size={24} />
              </div>
              <h3 className={styles.featureTitle}>AI Research Assistant</h3>
              <p className={styles.featureDescription}>
                Built-in AI assistant helps you summarize papers, navigate the
                platform, and discover related research across disciplines.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div
                className={styles.featureIcon}
                style={{ background: "linear-gradient(135deg, #00695c, #26a69a)" }}
              >
                <Zap size={24} />
              </div>
              <h3 className={styles.featureTitle}>Fast Publication</h3>
              <p className={styles.featureDescription}>
                Average review turnaround of 2-3 weeks. Real-time status tracking
                from submission to publication with email notifications.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div
                className={styles.featureIcon}
                style={{ background: "linear-gradient(135deg, #bf360c, #ff6e40)" }}
              >
                <BookOpen size={24} />
              </div>
              <h3 className={styles.featureTitle}>Open Access</h3>
              <p className={styles.featureDescription}>
                All published papers are freely accessible. No paywalls,
                no subscription barriers. Knowledge should be shared openly.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div
                className={styles.featureIcon}
                style={{ background: "linear-gradient(135deg, #1b5e20, #66bb6a)" }}
              >
                <Users size={24} />
              </div>
              <h3 className={styles.featureTitle}>ORCID Integration</h3>
              <p className={styles.featureDescription}>
                Sign in with your ORCID iD to automatically link your
                publications to your researcher profile across the ecosystem.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div
                className={styles.featureIcon}
                style={{ background: "linear-gradient(135deg, #0d47a1, #42a5f5)" }}
              >
                <Eye size={24} />
              </div>
              <h3 className={styles.featureTitle}>Version Control</h3>
              <p className={styles.featureDescription}>
                Full revision history for every paper. Track changes between
                versions and see exactly how feedback shaped the final publication.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Recent Papers ─────────────────────────────── */}
        <section className={styles.recentPapers}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Latest Research</span>
            <h2 className={styles.sectionTitle}>Recently Published</h2>
            <p className={styles.sectionDescription}>
              Explore the latest peer-reviewed papers across all disciplines.
            </p>
          </div>

          <div className={styles.papersGrid}>
            {samplePapers.map((paper) => (
              <Link
                key={paper.id}
                href={`/papers/${paper.id}`}
                style={{ textDecoration: "none" }}
              >
                <article className={styles.paperCard}>
                  <div
                    className={styles.paperCategory}
                    style={{
                      background: `${paper.categoryColor}12`,
                      color: paper.categoryColor,
                    }}
                  >
                    <span
                      className={styles.paperCategoryDot}
                      style={{ background: paper.categoryColor }}
                    />
                    {paper.category}
                  </div>

                  <h3 className={styles.paperTitle}>{paper.title}</h3>
                  <p className={`${styles.paperAbstract} line-clamp-2`}>
                    {paper.abstract}
                  </p>

                  <div className={styles.paperMeta}>
                    <div className={styles.paperAuthor}>
                      <div className={styles.paperAuthorAvatar}>
                        {paper.authorInitials}
                      </div>
                      {paper.author}
                    </div>
                    <span>
                      <Calendar size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      {paper.date}
                    </span>
                    <span>
                      <Eye size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      {paper.views.toLocaleString()} views
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "var(--space-10)", padding: "0 var(--page-padding)" }}>
            <Link href="/papers" className={styles.ctaBtnOutline} style={{ borderColor: "var(--color-accent-500)", color: "var(--color-accent-500)" }}>
              View All Papers <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ─── CTA Section ───────────────────────────────── */}
        <section className={styles.cta}>
          <div className={styles.ctaPattern} />
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>
              Ready to Share Your Research?
            </h2>
            <p className={styles.ctaDescription}>
              Join thousands of researchers publishing with Shaoor.
              Submit your paper today and reach a global audience.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/submit" className={styles.ctaBtnWhite}>
                <FileText size={18} />
                Start Submission
              </Link>
              <Link href="/about" className={styles.ctaBtnOutline}>
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
