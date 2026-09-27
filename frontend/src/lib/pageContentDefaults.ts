// Default CMS content templates for Public Pages (About & Author Guidelines)
// These serve as initial templates and fallbacks if database content has not been edited yet.

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
