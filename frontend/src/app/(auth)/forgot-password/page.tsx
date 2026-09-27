"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import styles from "./page.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send reset code.");
        setLoading(false);
        return;
      }

      if (data.previewUrl) setPreviewUrl(data.previewUrl);
      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <Link href="/" className={styles.logoLink} aria-label="Shaoor Home">
            <Image src="/shaoor-logo.png" alt="Shaoor" width={120} height={92} className={styles.logoImage} priority />
          </Link>

          <div className={styles.successIcon}>
            <CheckCircle2 size={48} />
          </div>
          <h1 className={styles.title}>Check your inbox</h1>
          <p className={styles.subtitle}>
            We sent a 6-digit reset code to
          </p>
          <p className={styles.emailBadge}>{email}</p>

          {previewUrl && (
            <div className={styles.devBanner}>
              <span className={styles.devBannerLabel}>🧪 Test Mode</span>
              <p className={styles.devBannerText}>
                Email is running via Ethereal (test inbox). Click the button below to view the OTP email in your browser.
              </p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.previewBtn}
                id="btn-preview-email"
              >
                Open Email Preview →
              </a>
            </div>
          )}

          <button
            className={styles.continueBtn}
            onClick={() =>
              router.push(`/forgot-password/reset?email=${encodeURIComponent(email)}`)
            }
            id="btn-continue-to-reset"
          >
            Continue to Reset Password
          </button>

          <Link href="/login" className={styles.backLink}>
            <ArrowLeft size={14} />
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.logoLink} aria-label="Shaoor Home">
          <Image src="/shaoor-logo.png" alt="Shaoor" width={120} height={92} className={styles.logoImage} priority />
        </Link>

        <div className={styles.iconWrap}>
          <Mail size={32} />
        </div>
        <h1 className={styles.title}>Forgot your password?</h1>
        <p className={styles.subtitle}>
          Enter the email address associated with your account and we'll send you a code to reset your password.
        </p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <label htmlFor="fp-email" className={styles.label}>Email Address</label>
          <div className={styles.inputWrapper}>
            <Mail size={16} className={styles.inputIcon} />
            <input
              id="fp-email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className={styles.input}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className={styles.errorBox} role="alert">{error}</div>
          )}

          <button
            id="fp-submit"
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? <span className={styles.spinner} /> : <Send size={16} />}
            {loading ? "Sending code…" : "Send Reset Code"}
          </button>
        </form>

        <Link href="/login" className={styles.backLink}>
          <ArrowLeft size={14} />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
