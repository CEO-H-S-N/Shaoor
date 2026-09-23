"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowLeft, Eye, EyeOff, User, Mail, Lock, Building2, AtSign } from "lucide-react";
import styles from "./page.module.css";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    institution: "",
    password: "",
    confirmPassword: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          username: form.username,
          institution: form.institution,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      router.push(`/signup/verify?email=${encodeURIComponent(form.email)}`);
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* ─── Left Decorative Panel ──────────────────────────── */}
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
            Join the Academic<br />Community
          </h1>
          <p className={styles.leftDescription}>
            Create your free account to submit papers, participate in peer review, and connect with researchers worldwide.
          </p>

          <div className={styles.leftFeatures}>
            <div className={styles.leftFeature}>
              <span className={styles.leftFeatureIcon}>📝</span>
              <span>Submit your research papers</span>
            </div>
            <div className={styles.leftFeature}>
              <span className={styles.leftFeatureIcon}>🔍</span>
              <span>Access peer review process</span>
            </div>
            <div className={styles.leftFeature}>
              <span className={styles.leftFeatureIcon}>🌐</span>
              <span>Open access publishing</span>
            </div>
            <div className={styles.leftFeature}>
              <span className={styles.leftFeatureIcon}>🤝</span>
              <span>Connect with researchers</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right Form Panel ───────────────────────────────── */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <Link href="/login" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Create your account</h2>
            <p className={styles.formSubtitle}>
              Already have an account?{" "}
              <Link href="/login" className={styles.formLink}>Sign in</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Full Name */}
            <div className={styles.fieldGroup}>
              <label htmlFor="signup-name" className={styles.label}>Full Name</label>
              <div className={styles.inputWrapper}>
                <User size={16} className={styles.inputIcon} />
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Dr. Jane Smith"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className={styles.fieldGroup}>
              <label htmlFor="signup-email" className={styles.label}>Email Address</label>
              <div className={styles.inputWrapper}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="jane@university.edu"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Username */}
            <div className={styles.fieldGroup}>
              <label htmlFor="signup-username" className={styles.label}>Username</label>
              <div className={styles.inputWrapper}>
                <AtSign size={16} className={styles.inputIcon} />
                <input
                  id="signup-username"
                  name="username"
                  type="text"
                  required
                  value={form.username}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="janesmith"
                  autoComplete="username"
                />
              </div>
              <span className={styles.fieldHint}>Letters, numbers, and underscores only.</span>
            </div>

            {/* Institution */}
            <div className={styles.fieldGroup}>
              <label htmlFor="signup-institution" className={styles.label}>
                Institution <span className={styles.optional}>(optional)</span>
              </label>
              <div className={styles.inputWrapper}>
                <Building2 size={16} className={styles.inputIcon} />
                <input
                  id="signup-institution"
                  name="institution"
                  type="text"
                  value={form.institution}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="University of Oxford"
                  autoComplete="organization"
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.fieldGroup}>
              <label htmlFor="signup-password" className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className={styles.fieldGroup}>
              <label htmlFor="signup-confirm" className={styles.label}>Confirm Password</label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="signup-confirm"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className={styles.errorBox} role="alert">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="signup-submit"
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : null}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className={styles.terms}>
            By creating an account, you agree to our{" "}
            <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
