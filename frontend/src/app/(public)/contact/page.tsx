import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Mail, Shield, BookOpen, Send, User, Clock, ArrowRight } from "lucide-react";
import { DEFAULT_CONTACT_EMAIL } from "@/lib/pageContentDefaults";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "Contact Editorial Office — Shaoor",
  description:
    "Direct contact details for the Editor-in-Chief, editorial review board, and manuscript support office of Shaoor Journal.",
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <Header />

      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.badge}>
              <Mail size={13} />
              Editorial Inquiries &amp; Author Support
            </div>
            <h1 className={styles.title}>Contact Editorial Office</h1>
            <p className={styles.subtitle}>
              Connect directly with Editor-in-Chief Dr. Shoukat Tilwani and the editorial
              board for manuscript submissions, peer review inquiries, and journal correspondence.
            </p>
          </div>
        </section>

        {/* Directory Grid */}
        <div className={styles.container}>
          <div className={styles.grid}>
            {/* Editor-in-Chief */}
            <div className={styles.contactCard}>
              <div className={styles.cardIcon}>
                <User size={24} />
              </div>
              <h2 className={styles.cardTitle}>Editor-in-Chief &amp; Governance</h2>
              <p className={styles.cardDesc}>
                Direct executive inquiries regarding editorial policy, academic leadership,
                international indexing, and journal volume proposals.
              </p>
              <div className={styles.emailBlock}>
                <div className={styles.emailLabel}>Primary Executive Contact</div>
                <div className={styles.emailAddress}>{DEFAULT_CONTACT_EMAIL}</div>
              </div>
              <a
                href={`mailto:${DEFAULT_CONTACT_EMAIL}?subject=${encodeURIComponent("Editorial Inquiry for Dr. Shoukat Tilwani")}`}
                className={styles.mailActionBtn}
              >
                <Send size={15} />
                Email Dr. Shoukat Tilwani
              </a>
            </div>

            {/* Manuscript Submissions & Review */}
            <div className={styles.contactCard}>
              <div className={styles.cardIcon}>
                <BookOpen size={24} />
              </div>
              <h2 className={styles.cardTitle}>Submissions &amp; Peer Review</h2>
              <p className={styles.cardDesc}>
                Assistance with active manuscript pre-flight evaluations, author revisions,
                double-blind reviewer assignments, and publication timelines.
              </p>
              <div className={styles.emailBlock}>
                <div className={styles.emailLabel}>Editorial Desk</div>
                <div className={styles.emailAddress}>{DEFAULT_CONTACT_EMAIL}</div>
              </div>
              <a
                href={`mailto:${DEFAULT_CONTACT_EMAIL}?subject=${encodeURIComponent("Manuscript Review Support Inquiry")}`}
                className={styles.mailActionBtn}
              >
                <Send size={15} />
                Contact Review Desk
              </a>
            </div>

            {/* Publication Ethics & General */}
            <div className={styles.contactCard}>
              <div className={styles.cardIcon}>
                <Shield size={24} />
              </div>
              <h2 className={styles.cardTitle}>Ethics, Appeals &amp; Errata</h2>
              <p className={styles.cardDesc}>
                Official COPE ethical compliance reporting, conflict of interest declarations,
                retraction/correction requests, or author appeals.
              </p>
              <div className={styles.emailBlock}>
                <div className={styles.emailLabel}>Ethics &amp; Oversight</div>
                <div className={styles.emailAddress}>{DEFAULT_CONTACT_EMAIL}</div>
              </div>
              <a
                href={`mailto:${DEFAULT_CONTACT_EMAIL}?subject=${encodeURIComponent("COPE Ethics / Manuscript Appeal Notice")}`}
                className={styles.mailActionBtn}
              >
                <Send size={15} />
                Send Ethics Inquiry
              </a>
            </div>
          </div>

          {/* Response Commitment Notice */}
          <div className={styles.noticeCard}>
            <Clock size={24} className={styles.noticeIcon} />
            <div>
              <h3 className={styles.noticeTitle}>Rapid Editorial Response Commitment</h3>
              <p className={styles.noticeText}>
                The editorial board strives to acknowledge all correspondence within 24–48 hours.
                For inquiries relating to an active paper, please quote your reference code
                (e.g., <code>SHR-2026-XXXX</code>) in the email subject line.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
