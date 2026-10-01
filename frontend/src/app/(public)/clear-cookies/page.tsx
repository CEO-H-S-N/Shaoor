"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, RotateCcw, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function ClearCookiesPage() {
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Clear client-side cookies
    try {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
      sessionStorage.clear();
      localStorage.clear();
    } catch (e) {
      console.warn("Client storage clear error:", e);
    }

    // Call server endpoint to clear HTTP-only session cookies and chunks
    window.location.href = "/api/auth/clear-cookies";
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      <Header />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#ffffff",
            borderRadius: 16,
            padding: 36,
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#eff6ff",
              color: "#1e3a8a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <RotateCcw size={28} className="animate-spin" />
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
            Resetting Browser Session
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
            Clearing outdated session cookies and header buffers to ensure optimal mobile performance.
            Redirecting you now...
          </p>

          <a
            href="/api/auth/clear-cookies"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              background: "#1e3a8a",
              color: "#ffffff",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Click here if not redirected <ArrowRight size={16} />
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
