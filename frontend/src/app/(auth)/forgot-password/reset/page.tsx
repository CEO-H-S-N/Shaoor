"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowLeft, Eye, EyeOff, RefreshCw, CheckCircle2 } from "lucide-react";
import styles from "../page.module.css";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits."); return; }
    if (!password) { setError("Please enter a new password."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed. Please try again.");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login?reset=1"), 2500);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.successIcon}><CheckCircle2 size={56} /></div>
          <h1 className={styles.title}>Password Reset!</h1>
          <p className={styles.subtitle}>
            Your password has been updated. Redirecting you to sign in…
          </p>
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

        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.subtitle}>
          Enter the 6-digit code sent to
        </p>
        <p className={styles.emailBadge}>{email}</p>

        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }} noValidate>
          {/* OTP */}
          <div>
            <label className={styles.label}>Verification Code</label>
            <div className={styles.otpRow} onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  id={`reset-otp-${i + 1}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className={`${styles.otpInput} ${digit ? styles.otpInputFilled : ""}`}
                  aria-label={`Digit ${i + 1}`}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <div style={{ textAlign: "right", marginTop: 8 }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                style={{
                  background: "none", border: "none", cursor: cooldown > 0 ? "default" : "pointer",
                  fontSize: 13, color: cooldown > 0 ? "#9ca3af" : "#1e3a8a", display: "inline-flex",
                  alignItems: "center", gap: 4, padding: 0, fontWeight: 600,
                }}
              >
                {resending && <RefreshCw size={12} style={{ animation: "spin 0.6s linear infinite" }} />}
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="reset-password" className={styles.label}>New Password</label>
            <div className={styles.passwordInputWrapper}>
              <Lock size={16} className={styles.inputIcon} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
              <input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className={styles.input}
                style={{ paddingLeft: 42, paddingRight: 44 }}
                autoComplete="new-password"
                required
              />
              <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reset-confirm" className={styles.label}>Confirm New Password</label>
            <div className={styles.passwordInputWrapper}>
              <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
              <input
                id="reset-confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                className={styles.input}
                style={{ paddingLeft: 42, paddingRight: 44 }}
                autoComplete="new-password"
                required
              />
              <button type="button" className={styles.passwordToggle} onClick={() => setShowConfirm(!showConfirm)} aria-label="Toggle confirm password visibility">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className={styles.errorBox} role="alert">{error}</div>}

          <button id="reset-submit" type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : null}
            {loading ? "Resetting…" : "Reset Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading…</p>
      </div>
    }>
      <ResetForm />
    </Suspense>
  );
}
