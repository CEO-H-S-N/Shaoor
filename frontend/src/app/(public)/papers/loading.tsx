import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import styles from "./loading.module.css";

export default function PapersLoading() {
  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.main}>
        {/* ─── Top Search Banner Skeleton ─────────────────────── */}
        <section className={styles.searchBanner} aria-label="Loading search">
          <div className={styles.searchBannerInner}>
            <div
              className={`${styles.searchInputSkeleton} ${styles.skeletonBlock}`}
            />
          </div>
        </section>

        {/* ─── Content Grid Skeleton ─────────────────────────── */}
        <div className={styles.container}>
          <div className={styles.contentGrid}>
            {/* Left Column Skeleton */}
            <div className={styles.directoryColumn}>
              <div
                className={`${styles.headingSkeleton} ${styles.skeletonBlock}`}
              />

              {/* Category tabs pills skeleton */}
              <div className={styles.tabsSkeletonRow}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`${styles.tabSkeleton} ${styles.skeletonBlock}`}
                    style={{ width: `${70 + (i % 3) * 20}px` }}
                  />
                ))}
              </div>

              {/* Filter controls skeleton */}
              <div className={styles.filterControlsSkeleton}>
                <div
                  className={`${styles.filterSkeleton} ${styles.skeletonBlock}`}
                />
                <div
                  className={`${styles.letterSkeleton} ${styles.skeletonBlock}`}
                />
              </div>

              {/* Papers Row Skeletons */}
              <div className={styles.papersList}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className={styles.paperRowSkeleton}>
                    <div
                      className={`${styles.thumbnailSkeleton} ${styles.skeletonBlock}`}
                    />
                    <div className={styles.detailsSkeleton}>
                      <div
                        className={`${styles.titleSkeleton} ${styles.skeletonBlock}`}
                      />
                      <div
                        className={`${styles.abstractLine1} ${styles.skeletonBlock}`}
                      />
                      <div
                        className={`${styles.abstractLine2} ${styles.skeletonBlock}`}
                      />
                      <div
                        className={`${styles.authorSkeleton} ${styles.skeletonBlock}`}
                      />
                      <div
                        className={`${styles.metaSkeleton} ${styles.skeletonBlock}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column (Sidebar Skeleton) */}
            <aside className={styles.sidebarColumn}>
              <div
                className={`${styles.sidebarHeadingSkeleton} ${styles.skeletonBlock}`}
              />

              <div className={styles.sidebarCardsStack}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className={styles.sidebarCardSkeleton}>
                    <div
                      className={`${styles.mvBadgeSkeleton} ${styles.skeletonBlock}`}
                    />
                    <div
                      className={`${styles.mvTitleSkeleton} ${styles.skeletonBlock}`}
                    />
                    <div
                      className={`${styles.mvAuthorSkeleton} ${styles.skeletonBlock}`}
                    />
                    <div
                      className={`${styles.mvJournalSkeleton} ${styles.skeletonBlock}`}
                    />
                    <div
                      className={`${styles.mvViewsSkeleton} ${styles.skeletonBlock}`}
                    />
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
