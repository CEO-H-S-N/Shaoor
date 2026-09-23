import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Eye,
  Download,
  Share2,
  Copy,
  ChevronRight,
  FileText,
  Tag,
  Users,
  Mail,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

// ── Demo paper store — will be Prisma queries ────────────────
const PAPERS: Record<string, {
  id: string;
  title: string;
  abstract: string;
  body: string;
  authors: { name: string; institution: string; email?: string }[];
  category: string;
  keywords: string[];
  publishedAt: string;
  views: number;
  downloads: number;
  doi?: string;
  version: number;
}> = {
  p1: {
    id: "p1",
    title: "Machine Learning Approaches for Early Detection of Neurodegenerative Diseases",
    abstract:
      "This paper presents a novel approach using deep learning models to identify early biomarkers associated with Alzheimer's and Parkinson's disease through analysis of multi-modal biomedical imaging data. We achieved 94.2% classification accuracy on the ADNI benchmark dataset.",
    body: `Neurodegenerative diseases such as Alzheimer's disease (AD) and Parkinson's disease (PD) represent a rapidly growing global health burden. Early detection is critical for improving patient outcomes, yet clinical diagnosis typically occurs only after significant neuronal loss has already occurred.

Recent advances in deep learning and multi-modal imaging provide new opportunities for identifying presymptomatic biomarkers. In this study, we propose a multi-task convolutional transformer architecture that fuses structural MRI, FDG-PET, and cerebrospinal fluid (CSF) biomarker data to produce unified disease risk scores.

Our model was trained on 4,200 patients from the Alzheimer's Disease Neuroimaging Initiative (ADNI) dataset and validated on an independent cohort of 840 subjects. The proposed architecture achieves an AUROC of 0.97 for early AD detection and 0.95 for PD classification, outperforming current state-of-the-art single-modality approaches by 6.3% and 4.8% respectively.

These results suggest that integrating multi-modal imaging with structured biomarker data significantly improves early detection capability, potentially allowing clinical intervention 3–5 years before symptom onset.`,
    authors: [
      { name: "Dr. Aisha Siddiqui", institution: "Lahore University of Management Sciences", email: "a.siddiqui@lums.edu.pk" },
      { name: "Prof. Omar Hameed", institution: "Aga Khan University", email: "o.hameed@aku.edu.pk" },
    ],
    category: "Medicine & Health Sciences",
    keywords: ["deep learning", "neuroimaging", "biomarkers", "Alzheimer's disease", "Parkinson's disease", "multi-modal"],
    publishedAt: "2026-08-14",
    views: 1243,
    downloads: 318,
    doi: "10.xxxx/shaoor.2026.0001",
    version: 2,
  },
  p2: {
    id: "p2",
    title: "Quantum Cryptography in Cloud Infrastructure: A Security Analysis",
    abstract:
      "Preliminary analysis of post-quantum encryption algorithms and their applicability to distributed cloud computing environments. We evaluate CRYSTALS-Kyber, NTRU, and SPHINCS+ against NIST PQC standards.",
    body: `The impending arrival of fault-tolerant quantum computers poses an existential threat to current public-key cryptographic infrastructure. RSA, ECDSA, and ECDH — the cornerstones of modern TLS, SSH, and cloud key management — will be broken by Shor's algorithm running on a sufficiently powerful quantum machine.

This paper evaluates the performance and security characteristics of three NIST Post-Quantum Cryptography (PQC) finalists — CRYSTALS-Kyber (key encapsulation), NTRU (key encapsulation), and SPHINCS+ (digital signatures) — within the context of cloud-native microservice architectures.

Our benchmarks were conducted on AWS Lambda (ARM Graviton3) and Google Cloud Run instances to reflect realistic serverless deployment conditions. We find that CRYSTALS-Kyber offers the best balance of performance and security for ephemeral session key exchange, with encapsulation latency of under 0.2ms and key sizes 7× smaller than NTRU at equivalent security levels.

We propose a hybrid migration roadmap for cloud providers, combining classical ECDH with Kyber-1024 in a TLS 1.3 extension pattern, allowing cryptographic agility during the transition period.`,
    authors: [
      { name: "Dr. Bilal Chaudhry", institution: "FAST-NUCES", email: "b.chaudhry@nu.edu.pk" },
    ],
    category: "Computer Science",
    keywords: ["post-quantum cryptography", "cloud security", "NIST PQC", "CRYSTALS-Kyber", "serverless"],
    publishedAt: "2026-09-01",
    views: 845,
    downloads: 201,
    doi: "10.xxxx/shaoor.2026.0002",
    version: 1,
  },
};

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const paper = PAPERS[params.id];
  if (!paper) return { title: "Paper Not Found — Shaoor" };
  return {
    title: `${paper.title} — Shaoor`,
    description: paper.abstract.slice(0, 160),
    openGraph: {
      title: paper.title,
      description: paper.abstract.slice(0, 160),
      type: "article",
      publishedTime: paper.publishedAt,
      authors: paper.authors.map((a) => a.name),
    },
  };
}

export default function PaperDetailPage({ params }: Props) {
  const paper = PAPERS[params.id];
  if (!paper) notFound();

  const citation = `${paper.authors.map((a) => a.name).join(", ")}. (${paper.publishedAt.slice(0, 4)}). ${paper.title}. Shaoor Journal of Academic Research. https://shaoor.org/papers/${paper.id}${paper.doi ? ` DOI: ${paper.doi}` : ""}`;

  return (
    <div className={styles.page}>
      {/* ── Breadcrumb ──────────────────────────────────────── */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className={styles.breadcrumbSep}>
          <ChevronRight size={12} />
        </span>
        <Link href="/papers">Papers</Link>
        <span className={styles.breadcrumbSep}>
          <ChevronRight size={12} />
        </span>
        <span style={{ color: "var(--color-neutral-600)" }}>{paper.category}</span>
      </nav>

      {/* ── Back Button ─────────────────────────────────────── */}
      <Link href="/papers" className={styles.backBtn} aria-label="Back to Papers">
        <ArrowLeft size={16} />
        Back to Papers
      </Link>

      {/* ── Paper Header ───────────────────────────────────── */}
      <header className={styles.paperHeader}>
        <div className={styles.meta}>
          <span className={`${styles.badge} ${styles.badgePublished}`}>
            <BookOpen size={10} />
            Published
          </span>
          <span className={`${styles.badge} ${styles.badgeCategory}`}>{paper.category}</span>
          {paper.doi && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-400)" }}>
              DOI: {paper.doi}
            </span>
          )}
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-400)" }}>
            Version {paper.version}
          </span>
        </div>

        <h1 className={styles.title}>{paper.title}</h1>

        {/* Authors */}
        <div className={styles.authors} aria-label="Authors">
          {paper.authors.map((author) => (
            <div key={author.email ?? author.name} className={styles.authorChip}>
              <div className={styles.authorAvatar}>
                {author.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className={styles.authorName}>{author.name}</div>
                <div className={styles.authorInst}>{author.institution}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Metrics */}
        <div className={styles.metrics}>
          <span className={styles.metric}>
            <Calendar size={14} />
            Published <strong className={styles.metricValue}>{paper.publishedAt}</strong>
          </span>
          <span className={styles.metric}>
            <Eye size={14} />
            <strong className={styles.metricValue}>{paper.views.toLocaleString()}</strong> views
          </span>
          <span className={styles.metric}>
            <Download size={14} />
            <strong className={styles.metricValue}>{paper.downloads.toLocaleString()}</strong> downloads
          </span>
        </div>

        {/* Actions */}
        <div className={styles.actionRow}>
          <Button variant="primary" size="md" id={`download-paper-${paper.id}`}>
            <Download size={16} />
            Download PDF
          </Button>
          <Button variant="secondary" size="md" id={`share-paper-${paper.id}`}>
            <Share2 size={16} />
            Share
          </Button>
        </div>
      </header>

      {/* ── Paper Body + Sidebar ────────────────────────────── */}
      <div className={styles.body}>
        {/* Main content */}
        <main className={styles.content}>
          {/* Abstract */}
          <section className={styles.section} aria-labelledby="abstract-heading">
            <h2 className={styles.sectionTitle} id="abstract-heading">
              <FileText size={16} />
              Abstract
            </h2>
            <div className={styles.sectionBody}>
              <p>{paper.abstract}</p>
            </div>
          </section>

          {/* Keywords */}
          <section className={styles.section} aria-labelledby="keywords-heading">
            <h2 className={styles.sectionTitle} id="keywords-heading">
              <Tag size={16} />
              Keywords
            </h2>
            <div className={styles.keywords}>
              {paper.keywords.map((kw) => (
                <Link
                  key={kw}
                  href={`/papers?q=${encodeURIComponent(kw)}`}
                  className={styles.keyword}
                >
                  {kw}
                </Link>
              ))}
            </div>
          </section>

          {/* Full Body */}
          <section className={styles.section} aria-labelledby="fulltext-heading">
            <h2 className={styles.sectionTitle} id="fulltext-heading">
              <BookOpen size={16} />
              Full Text
            </h2>
            <div className={styles.sectionBody}>
              {paper.body.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className={styles.sidebar} aria-label="Paper sidebar">
          {/* Citation */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardTitle}>Cite this paper</div>
            <div className={styles.citationBox}>{citation}</div>
            <Button
              variant="ghost"
              size="sm"
              id={`copy-citation-${paper.id}`}
              style={{ marginTop: "var(--space-3)", width: "100%" }}
            >
              <Copy size={14} />
              Copy Citation
            </Button>
          </div>

          {/* Authors */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardTitle}>
              <Users size={14} style={{ display: "inline", marginRight: 4 }} />
              Authors
            </div>
            <div className={styles.shareLinks}>
              {paper.authors.map((author) =>
                author.email ? (
                  <a
                    key={author.email}
                    href={`mailto:${author.email}`}
                    className={styles.shareLink}
                  >
                    <Mail size={14} />
                    <div>
                      <div style={{ fontWeight: "var(--weight-medium)", fontSize: "var(--text-xs)" }}>
                        {author.name}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--color-neutral-400)" }}>
                        {author.email}
                      </div>
                    </div>
                  </a>
                ) : null
              )}
            </div>
          </div>

          {/* Share */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardTitle}>Share</div>
            <div className={styles.shareLinks}>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(paper.title)}&url=${encodeURIComponent(`https://shaoor.org/papers/${paper.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shareLink}
                id={`share-twitter-${paper.id}`}
              >
                <ExternalLink size={14} />
                Share on X (Twitter)
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://shaoor.org/papers/${paper.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shareLink}
                id={`share-linkedin-${paper.id}`}
              >
                <ExternalLink size={14} />
                Share on LinkedIn
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
