import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About — Shaoor",
  description:
    "Learn about Shaoor, an open-access academic publishing platform committed to rigorous peer review and transparent scholarship.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>About Shaoor</h1>
          <p className={styles.placeholder}>Content coming soon.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
