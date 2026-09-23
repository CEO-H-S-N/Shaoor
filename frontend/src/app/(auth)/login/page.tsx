import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
      <div className={styles.card}>
        {/* Logo */}
        <Link href="/" className={styles.logoLink} aria-label="Shaoor Home">
          <Image
            src="/shaoor-logo.png"
            alt="Shaoor"
            width={120}
            height={92}
            className={styles.logoImage}
            priority
          />
        </Link>

        {/* Heading */}
        <div className={styles.headingBlock}>
          <h1 className={styles.title}>Sign in to your account</h1>
          <p className={styles.subtitle}>
            Access your submissions, reviews, and dashboard.
          </p>
        </div>

        {/* Auth form + OAuth */}
        <LoginButtons />

        {/* Footer */}
        <p className={styles.terms}>
          By signing in you agree to our{" "}
          <Link href="/terms">Terms of Service</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <p className={styles.signupRow}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className={styles.signupLink}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
