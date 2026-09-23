import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import {
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  TrendingUp,
  Eye,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Browse Academic Papers & Journals — Shaoor",
  description:
    "Explore peer-reviewed open access research papers and journals published on Shaoor. Filter by discipline, search keywords, and discover top-cited publications.",
};

const PAPERS_PER_PAGE = 10;

// Cache categories for 1 hour — 0ms database latency
const getCachedCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    });
  },
  ["all-categories-list"],
  { revalidate: 3600, tags: ["categories"] }
);

// Cache most-viewed papers for 60 seconds — 0ms database latency
const getCachedMostViewed = unstable_cache(
  async () => {
    return prisma.paper.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 4,
      include: {
        author: { select: { name: true, affiliation: true } },
        category: { select: { name: true, slug: true } },
      },
    });
  },
  ["most-viewed-papers-sidebar"],
  { revalidate: 60, tags: ["papers-most-viewed"] }
);

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    letter?: string;
    page?: string;
  }>;
}

// Map categories to visual gradient patterns resembling Frontiers covers
const CATEGORY_GRADIENTS: Record<string, { bg: string; iconText: string }> = {
  "social-sciences": {
    bg: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    iconText: "SS",
  },
  education: {
    bg: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
    iconText: "ED",
  },
  "health-medicine": {
    bg: "linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)",
    iconText: "HM",
  },
  "technology-innovation": {
    bg: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
    iconText: "TI",
  },
  humanities: {
    bg: "linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)",
    iconText: "HU",
  },
  "business-economics": {
    bg: "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
    iconText: "BE",
  },
};

function formatDate(date: Date | string | null): string {
  if (!date) return "Recently";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isNew(date: Date | string | null): boolean {
  if (!date) return false;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(date).getTime() < thirtyDays;
}

export default async function PapersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const selectedCategory = params.category || "all";
  const sort = params.sort || "newest";
  const letter = params.letter?.toUpperCase() || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const skip = (page - 1) * PAPERS_PER_PAGE;

  // Build query where filter for PostgreSQL
  const where: any = { status: "PUBLISHED" };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { abstract: { contains: query, mode: "insensitive" } },
      { keywords: { has: query } },
      { author: { name: { contains: query, mode: "insensitive" } } },
    ];
  }

  if (selectedCategory !== "all") {
    where.category = { slug: selectedCategory };
  }

  if (letter && /^[A-Z]$/.test(letter)) {
    where.title = { startsWith: letter, mode: "insensitive" };
  }

  // Determine sort order
  let orderBy: any = { publishedAt: "desc" };
  if (sort === "oldest") orderBy = { publishedAt: "asc" };
  else if (sort === "mostViewed") orderBy = { viewCount: "desc" };
  else if (sort === "az") orderBy = { title: "asc" };
  else if (sort === "za") orderBy = { title: "desc" };

  // Fetch all in a single parallel roundtrip over persistent pool
  const [categories, papers, total, mostViewedPapers] = await Promise.all([
    getCachedCategories(),
    prisma.paper.findMany({
      where,
      orderBy,
      skip,
      take: PAPERS_PER_PAGE,
      include: {
        author: {
          select: { name: true, affiliation: true },
        },
        category: {
          select: { name: true, slug: true, color: true },
        },
      },
    }),
    prisma.paper.count({ where }),
    getCachedMostViewed(),
  ]);

  const totalPages = Math.ceil(total / PAPERS_PER_PAGE);

  // URL helper keeping active parameters
  function buildUrl(overrides: Record<string, string | number | undefined>) {
    const merged = {
      ...(query ? { q: query } : {}),
      ...(selectedCategory !== "all" ? { category: selectedCategory } : {}),
      ...(sort !== "newest" ? { sort } : {}),
      ...(letter ? { letter } : {}),
      ...overrides,
    };
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(merged)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return `/papers${qs ? `?${qs}` : ""}`;
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.main}>
        {/* ─── Top Search Banner (Frontiers Style) ──────────── */}
        <section className={styles.searchBanner} aria-label="Search papers">
          <div className={styles.searchBannerInner}>
            <form className={styles.searchForm} role="search" action="/papers" method="get">
              {selectedCategory !== "all" && (
                <input type="hidden" name="category" value={selectedCategory} />
              )}
              {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
              <div className={styles.searchInputWrapper}>
                <BookOpen size={20} className={styles.searchIcon} />
                <input
                  id="paper-search-input"
                  name="q"
                  type="search"
                  placeholder="Enter a keyword or subject to search"
                  className={styles.searchInput}
                  defaultValue={query}
                  autoComplete="off"
                />
              </div>
            </form>
          </div>
        </section>

        {/* ─── Two-Column Directory Layout ──────────────────── */}
        <div className={styles.container}>
          <div className={styles.contentGrid}>
            {/* ── Left Column: Directory & Papers List ───────── */}
            <div className={styles.directoryColumn}>
              {/* Heading with live paper count from DB */}
              <h1 className={styles.directoryHeading}>
                {total} {total === 1 ? "paper" : "papers"}
              </h1>

              {/* Category Tabs with active underline */}
              <nav className={styles.categoryTabsNav} aria-label="Filter by subject">
                <div className={styles.categoryTabs}>
                  <Link
                    href={buildUrl({ category: undefined, page: undefined })}
                    className={`${styles.categoryTab} ${
                      selectedCategory === "all" ? styles.categoryTabActive : ""
                    }`}
                  >
                    All
                  </Link>

                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={buildUrl({ category: cat.slug, page: undefined })}
                      className={`${styles.categoryTab} ${
                        selectedCategory === cat.slug ? styles.categoryTabActive : ""
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Filters Bar: Alphabet / Sort Options */}
              <div className={styles.filterControlsBar}>
                <div className={styles.sortDropdownWrapper}>
                  <span className={styles.sortLabel}>Sort:</span>
                  <div className={styles.sortOptions}>
                    <Link
                      href={buildUrl({ sort: "newest", page: undefined })}
                      className={`${styles.sortBtn} ${
                        sort === "newest" && !letter ? styles.sortBtnActive : ""
                      }`}
                    >
                      Newest
                    </Link>
                    <Link
                      href={buildUrl({ sort: "mostViewed", page: undefined })}
                      className={`${styles.sortBtn} ${
                        sort === "mostViewed" ? styles.sortBtnActive : ""
                      }`}
                    >
                      Most viewed
                    </Link>
                    <Link
                      href={buildUrl({ sort: "az", page: undefined })}
                      className={`${styles.sortBtn} ${
                        sort === "az" ? styles.sortBtnActive : ""
                      }`}
                    >
                      A–Z
                    </Link>
                  </div>
                </div>

                {/* Letter filter selector */}
                <div className={styles.letterFilterWrapper}>
                  <span className={styles.letterFilterLabel}>By letter:</span>
                  <div className={styles.letterList}>
                    {letter && (
                      <Link
                        href={buildUrl({ letter: undefined, page: undefined })}
                        className={styles.clearLetterBtn}
                        title="Clear letter filter"
                      >
                        ✕ All
                      </Link>
                    )}
                    {alphabet.slice(0, 13).map((l) => (
                      <Link
                        key={l}
                        href={buildUrl({ letter: l, page: undefined })}
                        className={`${styles.letterLink} ${
                          letter === l ? styles.letterLinkActive : ""
                        }`}
                      >
                        {l}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Papers Listing (Frontiers Row Style) ──────── */}
              {papers.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <BookOpen size={48} />
                  </div>
                  <h3 className={styles.emptyTitle}>
                    {query || selectedCategory !== "all" || letter
                      ? "No published papers match your criteria"
                      : "No published papers in the library yet"}
                  </h3>
                  <p className={styles.emptyText}>
                    {query || selectedCategory !== "all" || letter
                      ? "Try adjusting your search keywords, switching categories, or clearing active filters."
                      : "When researchers submit and pass peer review on Shaoor, their open access papers will appear here."}
                  </p>
                  <div className={styles.emptyActions}>
                    {(query || selectedCategory !== "all" || letter) && (
                      <Link href="/papers" className={styles.resetBtn}>
                        <RotateCcw size={16} />
                        Reset all filters
                      </Link>
                    )}
                    <Link href="/submit" className={styles.submitPaperBtn}>
                      <FileText size={16} />
                      Submit a Paper
                    </Link>
                  </div>
                </div>
              ) : (
                <div className={styles.papersList}>
                  {papers.map((paper) => {
                    const grad =
                      CATEGORY_GRADIENTS[paper.category?.slug || ""] || {
                        bg: "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)",
                        iconText: "JR",
                      };

                    return (
                      <article key={paper.id} className={styles.paperRow}>
                        {/* Left visual thumbnail */}
                        <div
                          className={styles.paperThumbnail}
                          style={{ background: grad.bg }}
                        >
                          <div className={styles.thumbnailPattern} />
                          <span className={styles.thumbnailIconText}>
                            {grad.iconText}
                          </span>
                        </div>

                        {/* Right details */}
                        <div className={styles.paperDetails}>
                          <div className={styles.paperTitleRow}>
                            <Link
                              href={`/papers/${paper.id}`}
                              className={styles.paperTitleLink}
                            >
                              {paper.title}
                            </Link>
                            {isNew(paper.publishedAt) && (
                              <span className={styles.newBadge}>New</span>
                            )}
                          </div>

                          <p className={styles.paperAbstract}>
                            {paper.abstract}
                          </p>

                          <div className={styles.paperAuthorInfo}>
                            <span className={styles.authorLabel}>Author: </span>
                            <span className={styles.authorName}>
                              {paper.author?.name || "Anonymous Researcher"}
                            </span>
                            {paper.author?.affiliation && (
                              <span className={styles.authorAffiliation}>
                                , {paper.author.affiliation}
                              </span>
                            )}
                          </div>

                          <div className={styles.paperMetaRow}>
                            {paper.category?.name && (
                              <span className={styles.paperCategoryTag}>
                                {paper.category.name}
                              </span>
                            )}
                            <span className={styles.metaDot}>•</span>
                            <span>v{paper.version}</span>
                            <span className={styles.metaDot}>•</span>
                            <span>
                              {paper.viewCount.toLocaleString()} article views
                            </span>
                            <span className={styles.metaDot}>•</span>
                            <span>
                              Published {formatDate(paper.publishedAt)}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* ── Pagination ───────────────────────────────── */}
              {totalPages > 1 && (
                <nav className={styles.pagination} aria-label="Page navigation">
                  {page > 1 ? (
                    <Link
                      href={buildUrl({ page: page - 1 })}
                      className={styles.pageBtn}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </Link>
                  ) : (
                    <span
                      className={`${styles.pageBtn} ${styles.pageBtnDisabled}`}
                      aria-disabled="true"
                    >
                      <ChevronLeft size={16} />
                    </span>
                  )}

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const n = i + 1;
                    return (
                      <Link
                        key={n}
                        href={buildUrl({ page: n })}
                        className={`${styles.pageBtn} ${
                          n === page ? styles.pageBtnActive : ""
                        }`}
                        aria-current={n === page ? "page" : undefined}
                      >
                        {n}
                      </Link>
                    );
                  })}

                  {page < totalPages ? (
                    <Link
                      href={buildUrl({ page: page + 1 })}
                      className={styles.pageBtn}
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  ) : (
                    <span
                      className={`${styles.pageBtn} ${styles.pageBtnDisabled}`}
                      aria-disabled="true"
                    >
                      <ChevronRight size={16} />
                    </span>
                  )}
                </nav>
              )}
            </div>

            {/* ── Right Column: Most Viewed (Frontiers Sidebar) ── */}
            <aside className={styles.sidebarColumn}>
              <h2 className={styles.sidebarHeading}>Most viewed</h2>

              {mostViewedPapers.length === 0 ? (
                <div className={styles.sidebarEmptyCard}>
                  <TrendingUp size={24} className={styles.sidebarEmptyIcon} />
                  <p className={styles.sidebarEmptyText}>
                    No viewed articles yet. Papers will appear here as researchers explore and cite publications.
                  </p>
                </div>
              ) : (
                <div className={styles.mostViewedStack}>
                  {mostViewedPapers.map((mv) => (
                    <div key={mv.id} className={styles.mostViewedCard}>
                      <div className={styles.mvCategoryRow}>
                        <span className={styles.mvCategoryBadge}>
                          {mv.category?.name || "RESEARCH ARTICLE"}
                        </span>
                        <span className={styles.mvDate}>
                          Accepted on {formatDate(mv.publishedAt)}
                        </span>
                      </div>

                      <h3 className={styles.mvTitle}>
                        <Link
                          href={`/papers/${mv.id}`}
                          className={styles.mvTitleLink}
                        >
                          {mv.title}
                        </Link>
                      </h3>

                      <p className={styles.mvAuthor}>
                        {mv.author?.name || "Research Scholar"}
                      </p>

                      {mv.category?.name && (
                        <p className={styles.mvJournalName}>
                          Shaoor in {mv.category.name}
                        </p>
                      )}

                      <div className={styles.mvViewsRow}>
                        <Eye size={13} />
                        <span>{mv.viewCount.toLocaleString()} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
