import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./JournalFooter.module.css";

export function JournalFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Image
            src="/shaoor-logo.png"
            alt="Shaoor"
            width={80}
            height={62}
            className={styles.logoImg}
          />
          <span className={styles.tagline}>Open-Access Academic Publishing</span>
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          <Link href="/content">All Journals</Link>
          <Link href="/papers">Browse Papers</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <p className={styles.copy}>
          © {new Date().getFullYear()} Shaoor.org · CC-BY 4.0 Open Access ·{" "}
          <span className={styles.credit}>Designed by HSN</span>
        </p>
      </div>
    </footer>
  );
}
