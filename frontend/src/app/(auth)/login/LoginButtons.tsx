"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import styles from "./page.module.css";

export function LoginButtons() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/my-papers" });
    } catch {
      setLoading(false);
    }
  }

  async function handleCredentialsSignIn(
    e?: React.FormEvent,
    directEmail?: string,
    directPassword?: string
  ) {
    if (e) e.preventDefault();
    const activeEmail = (directEmail || email).trim().toLowerCase();
    const activePassword = directPassword || password;

    if (!activeEmail || !activePassword) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setError("");

    const targetUrl =
      activeEmail === "devadmin@shaoor.org" ? "/review" : "/my-papers";

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: activeEmail,
        password: activePassword,
        callbackUrl: targetUrl,
      });

      if (res?.error) {
        setError("Invalid email or password, or email not verified.");
        setLoading(false);
      } else {
        window.location.href = targetUrl;
      }
    } catch {
      setError("An error occurred during sign in.");
      setLoading(false);
    }
  }

  function fillAndSubmit(userEmail: string, userPass: string) {
    setEmail(userEmail);
    setPassword(userPass);
    handleCredentialsSignIn(undefined, userEmail, userPass);
  }

  return (
    <div className={styles.oauthSection}>
      {/* ─── Email / Password Form ───────────────────── */}
      <form onSubmit={handleCredentialsSignIn} className={styles.credentialsForm} noValidate>
        <input
          id="login-email"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.loginInput}
          autoComplete="email"
          required
        />
        <input
          id="login-password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.loginInput}
          autoComplete="current-password"
          required
        />

        {error && (
          <div className={styles.loginError} role="alert">
            {error}
          </div>
        )}

        <button
          id="login-submit"
          type="submit"
          className={styles.loginSubmitBtn}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {/* Dev quick-fill */}
        <div className={styles.quickFillRow}>
          <span style={{ fontWeight: 600 }}>Dev test:</span>
          <button
            type="button"
            className={styles.quickFillBtn}
            onClick={() => fillAndSubmit("devuser@shaoor.org", "dev123")}
            disabled={loading}
          >
            👤 User
          </button>
          <button
            type="button"
            className={styles.quickFillBtn}
            onClick={() => fillAndSubmit("devadmin@shaoor.org", "dev123")}
            disabled={loading}
          >
            🛡️ Admin
          </button>
        </div>
      </form>

      {/* ─── Divider ─────────────────────────────────── */}
      <div className={styles.divider}>or</div>

      {/* ─── Create account ──────────────────────────── */}
      <Link href="/signup" className={styles.signUpBtn} id="login-signup-email">
        <UserPlus size={16} />
        Create an account
      </Link>

      {/* ─── Divider ─────────────────────────────────── */}
      <div className={styles.divider}>or continue with</div>

      {/* ─── Google OAuth ─────────────────────────────── */}
      <button
        id="login-google"
        className={`${styles.oauthBtn} ${styles.oauthBtnGoogle}`}
        onClick={handleGoogleSignIn}
        disabled={loading}
        aria-label="Sign in with Google"
        type="button"
      >
        {loading ? (
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 16,
              border: "2px solid #cbd5e1",
              borderTop: "2px solid #2563eb",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }}
          />
        ) : (
          <svg className={styles.oauthIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Continue with Google
      </button>
    </div>
  );
}
