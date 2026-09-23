import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { LoginButtons } from "./LoginButtons";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sign In — Shaoor",
  description: "Sign in to Shaoor to submit and review academic papers.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className={styles.page}>
      {/* ─── Left Decorative Panel ──────────────────────── */}
      <div className={styles.leftPanel}>
        <div className={styles.leftPattern} />
        <div className={styles.leftContent}>
          <div className={styles.leftLogo}>
            <div className={styles.leftLogoIcon}>
              <BookOpen size={28} />
            </div>
            <span className={styles.leftLogoText}>Shaoor</span>
          </div>

          <h1 className={styles.leftTitle}>
            Academic Publishing,<br />Simplified
          </h1>
          <p className={styles.leftDescription}>
            Join thousands of researchers publishing peer-reviewed work
            through a rigorous, transparent review process.
          </p>

          <div className={styles.leftStats}>
            <div className={styles.leftStat}>
              <div className={styles.leftStatNumber}>2,500+</div>
              <div className={styles.leftStatLabel}>Published Papers</div>
            </div>
            <div className={styles.leftStat}>
              <div className={styles.leftStatNumber}>150+</div>
              <div className={styles.leftStatLabel}>Expert Reviewers</div>
            </div>
            <div className={styles.leftStat}>
              <div className={styles.leftStatNumber}>45</div>
              <div className={styles.leftStatLabel}>Countries</div>
            </div>
            <div className={styles.leftStat}>
              <div className={styles.leftStatNumber}>~2 wks</div>
              <div className={styles.leftStatLabel}>Avg. Review Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right Auth Panel ───────────────────────────── */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Shaoor
          </Link>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Welcome to Shaoor</h2>
            <p className={styles.formSubtitle}>
              Sign in to submit papers, track reviews, and access your dashboard.
            </p>
          </div>

          {/* OAuth buttons are client-side because they call signIn() */}
          <LoginButtons />

          <p className={styles.terms}>
            By signing in, you agree to our{" "}
            <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
            Your data is handled in accordance with GDPR.
          </p>
        </div>
      </div>
    </div>
  );
}
