"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, RefreshCw } from "lucide-react";
import styles from "./page.module.css";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Start cooldown on mount (user just received a code)
  useEffect(() => {
    setCooldown(60);
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return; // only digits
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError("");

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login?verified=1"), 2000);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
      } else {
        setCooldown(60);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  }

  if (success) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <CheckCircle2 size={56} className={styles.successIcon} />
          <h1 className={styles.successTitle}>Email Verified!</h1>
          <p className={styles.successText}>
            Your account is now active. Redirecting you to sign in…
          </p>
        </div>
      </div>
    );
  }

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

        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.subtitle}>
          We sent a 6-digit verification code to
        </p>
        <p className={styles.email}>{email}</p>

        <form onSubmit={handleVerify} className={styles.form} noValidate>
          <div className={styles.otpRow} onPaste={handlePaste} aria-label="OTP input">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                id={`otp-digit-${i + 1}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`${styles.otpInput} ${digit ? styles.otpInputFilled : ""}`}
                aria-label={`Digit ${i + 1}`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && (
            <div className={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          <button
            id="verify-submit"
            type="submit"
            className={styles.verifyBtn}
            disabled={loading || otp.join("").length < 6}
          >
            {loading ? <span className={styles.spinner} /> : null}
            {loading ? "Verifying…" : "Verify Email"}
          </button>
        </form>

        <div className={styles.resendRow}>
          <span className={styles.resendText}>Didn&apos;t receive the code?</span>
          <button
            id="resend-otp"
            className={styles.resendBtn}
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            type="button"
          >
            {resending ? (
              <RefreshCw size={14} className={styles.spinIcon} />
            ) : null}
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>

        <Link href="/signup" className={styles.backLink}>
          ← Try a different email
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.card} style={{ textAlign: "center", padding: "40px" }}>
            <div className={styles.spinner} style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--color-neutral-600)", fontSize: "var(--text-sm)" }}>
              Loading verification...
            </p>
          </div>
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
