// Default CMS content templates for Public Pages (About, Author Guidelines, Homepage, Journals)
// These serve as initial templates and fallbacks if database content has not been edited yet.
// Safe for both Client and Server components (zero node/db dependencies).

export interface PageSection {
  id: string;
  title: string;
  body: string;
}

export interface PageTemplateData {
  title: string;
  subtitle: string;
  sections: PageSection[];
}

export const DEFAULT_ABOUT_CONTENT: PageTemplateData = {
  title: "About Shaoor",
  subtitle:
    "An open-access international journal dedicated to rigorous peer review, transdisciplinary inquiry, and unrestricted scholarly exchange.",
  sections: [
    {
      id: "mission",
      title: "Our Mission & Vision",
      body:
        "Shaoor is founded on the conviction that scientific knowledge is a universal heritage that thrives through rigorous validation and transparent dissemination. We bridge disciplines across medicine, computer science, social sciences, engineering, and the natural sciences, prioritizing rigorous methodologies, methodological transparency, and reproducibility over commercial constraints.",
    },
    {
      id: "open-access",
      title: "Universal Open Access & Author Sovereignty",
      body:
        "All scholarly publications in Shaoor are permanently free to read, download, distribute, and cite worldwide under the Creative Commons Attribution 4.0 International (CC BY 4.0) license. Authors retain unconditional copyright of their work, with zero embargo periods and permanent archival preservation.",
    },
    {
      id: "peer-review",
      title: "Double-Blind Peer Review Standards",
      body:
        "Our editorial architecture operates under a strict double-blind peer review protocol. Manuscripts are anonymized prior to assignment to certified domain editors and independent peer reviewers. Each submission undergoes at least two independent expert evaluations assessing validity, experimental design, statistical robustness, and ethical compliance.",
    },
    {
      id: "editorial-board",
      title: "Editorial Leadership & Governance",
      body:
        "Shaoor's editorial direction is steered by Editor-in-Chief Dr. Shoukat Tilwani alongside an esteemed international advisory council. Section editors and handling professors oversee dedicated discipline portfolios to ensure rapid, constructive, and uncompromising peer assessment.",
    },
    {
      id: "ethics",
      title: "Publication Ethics & COPE Compliance",
      body:
        "Shaoor adheres strictly to the Core Practices established by the Committee on Publication Ethics (COPE). We maintain automated similarity screening, require institutional review board (IRB) ethical clearances for all human and animal investigations, and mandate explicit disclosures of AI assistance and financial interests.",
    },
  ],
};

export const DEFAULT_GUIDELINES_CONTENT: PageTemplateData = {
  title: "Author Guidelines & Submission Instructions",
  subtitle:
    "Comprehensive criteria, structural formatting requirements, and ethical guidelines for publishing peer-reviewed research with Shaoor.",
  sections: [
    {
      id: "scope",
      title: "1. Scope & Acceptable Manuscript Types",
      body:
        "Shaoor accepts original submissions that advance scientific knowledge across our indexed subject areas:\n\n• Original Research Articles: Full empirical or theoretical contributions (typically 4,000–8,000 words).\n• Comprehensive Review Articles: Systematic reviews, meta-analyses, and state-of-the-art syntheses (up to 12,000 words).\n• Short Communications & Letters: Rapid reporting of high-impact preliminary findings (up to 3,500 words).\n• Methodological & Dataset Papers: Rigorous descriptions of novel computational methods, datasets, or laboratory protocols.",
    },
    {
      id: "preparation",
      title: "2. Manuscript Preparation & Formatting",
      body:
        "Manuscripts must be submitted in PDF or DOCX format adhering to the following structural conventions:\n\n• Title Page: Informative, concise (<25 words), avoiding non-standard acronyms.\n• Abstract: Structured summary of 200–300 words comprising Background, Methods, Key Findings, and Scholarly Significance.\n• Keywords: 4 to 8 indexing terms separated by semicolons.\n• Section Structure: Introduction, Materials & Methods, Results, Discussion, and Conclusions.\n• Citations & References: Formatted in APA 7th Edition with active Digital Object Identifiers (DOIs) where available.",
    },
    {
      id: "figures",
      title: "3. Scientific Figures, Tables & Supplementary Data",
      body:
        "High-quality visual evidence is paramount for rigorous peer evaluation:\n\n• High-Resolution Graphics: Figures must be supplied at a minimum resolution of 300 DPI (PNG, JPG, TIFF, SVG).\n• Numbering & Legends: Number figures consecutively in Arabic numerals (Figure 1, Figure 2). Each figure requires a standalone, self-explanatory legend including statistical markers and error bar definitions.\n• Table Structure: Tables must be formatted with clear row and column headers with explicit units of measurement.",
    },
    {
      id: "ethics-declaration",
      title: "4. Research Ethics, Plagiarism & AI Disclosures",
      body:
        "Compliance with ethical publishing norms is mandatory for all submitted works:\n\n• Ethical Approval: All studies involving human participants or animal models must state the approving Institutional Review Board (IRB) / Ethics Committee name and approval reference number.\n• Plagiarism Screening: All manuscripts are cross-checked via automated similarity detection software. Submissions exceeding acceptable similarity thresholds will be returned immediately without peer review.\n• Artificial Intelligence Disclosure: Generative AI tools cannot be listed as authors. If AI tools were utilized for data preprocessing, code development, or drafting assistance, authors must explicitly describe their use in the Declarations section.",
    },
    {
      id: "submission-review",
      title: "5. Submission Pipeline & Peer Review Stages",
      body:
        "All manuscripts must be submitted electronically via the Shaoor Author Portal (/submit):\n\n1. Initial Pre-Flight Editorial Screening (2–3 business days)\n2. Double-Blind Peer Review by 2+ Independent Specialists (14–21 days)\n3. Editorial Decision: Accept, Minor Revision, Major Revision, or Decline\n4. Revision Window: Authors are given 21 days for revisions\n5. Typesetting, DOI Minting, and Rapid Open-Access Publication upon acceptance.",
    },
  ],
};

export const DEFAULT_HOMEPAGE_CONTENT = {
  title: "Publish Impactful Research.",
  subtitle: "Peer-Reviewed & Open to the World.",
  description:
    "Shaoor is a peer-reviewed scholarly publishing platform built for researchers, authors, and academics. Experience transparent double-blind review, open access indexing, and AI-powered academic guidance.",
};

export const DEFAULT_JOURNALS_PAGE_CONTENT = {
  title: "Shaoor Academic Journals",
  subtitle:
    "Explore peer-reviewed open access scholarly journals published on Shaoor. Dedicated international platforms advancing multidisciplinary research, scientific discovery, medicine, technology, humanities, and social inquiry.",
  badge: "Scholarly Journals & Archives",
  metric1Label: "Peer Review Standard",
  metric1Value: "Double-Blind",
  metric2Label: "CC-BY 4.0 International",
  metric2Value: "Open Access",
  metric3Label: "Issue Frequency",
  metric3Value: "Quarterly",
  archiveHeading: "Academic Journals on Shaoor",
  archiveSubheading: "Browse complete catalogued journals, published volumes, and individual papers.",
  emptyStateTitle: "No Published Issues Currently Available",
  emptyStateMessage:
    "The editorial board is currently reviewing inaugural manuscripts for Volume 1, Issue 1. Check back shortly or submit your manuscript today.",
};

// ─── Default Contact Email ──────────────────────────────────────────
export const DEFAULT_CONTACT_EMAIL = "shouket.tilwani@gmail.com";

// ─── FAQ Page CMS Interfaces & Defaults ─────────────────────────────
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface FaqPageData {
  title: string;
  subtitle: string;
  badge: string;
  contactHeading: string;
  contactDescription: string;
  contactEmail: string;
  items: FaqItem[];
}

export const DEFAULT_FAQ_CONTENT: FaqPageData = {
  title: "Frequently Asked Questions",
  subtitle:
    "Comprehensive guidance for authors, peer reviewers, editors, and researchers participating in Shaoor scholarly publishing.",
  badge: "Author & Researcher Support",
  contactHeading: "Need Further Editorial Assistance?",
  contactDescription:
    "Our editorial office is committed to prompt, transparent communication. For inquiries regarding manuscript status, special volume proposals, or technical assistance, contact the Editor-in-Chief directly.",
  contactEmail: DEFAULT_CONTACT_EMAIL,
  items: [
    {
      id: "faq-1",
      category: "Peer Review",
      question: "How does Shaoor's double-blind peer review process operate?",
      answer:
        "Every submitted manuscript undergoes rigorous double-blind peer review. Author identities and affiliations are masked from reviewers, and reviewer identities remain confidential to authors. Each paper is assessed by at least two independent subject-matter specialists evaluating methodology, originality, scientific validity, and ethical rigor before an editorial decision is reached.",
    },
    {
      id: "faq-2",
      category: "Open Access",
      question: "Are articles published on Shaoor open access?",
      answer:
        "Yes, 100% of publications in Shaoor are published under the Creative Commons Attribution 4.0 International (CC BY 4.0) license. Articles are immediately and permanently free to read, download, distribute, and cite without subscription barriers or embargo periods.",
    },
    {
      id: "faq-3",
      category: "Fees & Charges",
      question: "Are there any Article Processing Charges (APCs) or submission fees?",
      answer:
        "No. Shaoor operates under a non-commercial open scholarship initiative. There are zero submission fees and zero Article Processing Charges (APCs) required from authors or their institutions.",
    },
    {
      id: "faq-4",
      category: "Submissions",
      question: "What file formats and structures are accepted for manuscript submission?",
      answer:
        "Manuscripts should be submitted in PDF or Microsoft Word (DOCX) format adhering to standard scholarly conventions: Title, Abstract (200-300 words), Keywords (4-8), Introduction, Materials & Methods, Results, Discussion, and References formatted in APA 7th Edition. High-resolution figures (PNG, JPG, TIFF, SVG) can be uploaded independently in the submission figures studio.",
    },
    {
      id: "faq-5",
      category: "Timeline",
      question: "What is the typical turnaround timeline from submission to decision?",
      answer:
        "Initial editorial pre-flight screening takes 2 to 3 business days. The comprehensive double-blind peer review phase generally spans 14 to 21 calendar days. Upon receiving reviewer reports, the editorial board issues an official decision (Accept, Revisions, or Decline). Accepted papers are typeset, minted with identifiers, and published rapidly.",
    },
    {
      id: "faq-6",
      category: "Ethics & AI",
      question: "What are the policies regarding Artificial Intelligence (AI) and plagiarism?",
      answer:
        "Shaoor adheres strictly to COPE (Committee on Publication Ethics) core practices. All submissions undergo automated similarity screening. Generative AI tools cannot be listed as authors; if AI tools were used for data preprocessing or code development, their use must be explicitly declared in the manuscript methodology.",
    },
    {
      id: "faq-7",
      category: "Editorial Contact",
      question: "How can authors or institutions contact the Editor-in-Chief directly?",
      answer:
        "All official editorial queries, appeal submissions, and journal volume proposals may be directed directly to Editor-in-Chief Dr. Shoukat Tilwani via email at shouket.tilwani@gmail.com.",
    },
  ],
};

