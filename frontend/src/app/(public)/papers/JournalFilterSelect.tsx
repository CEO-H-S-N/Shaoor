"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, X, ChevronDown } from "lucide-react";
import styles from "./JournalFilterSelect.module.css";

interface JournalOption {
  id: string;
  title: string;
  slug: string | null;
  volume: number;
  issue: number;
}

interface JournalFilterSelectProps {
  journals: JournalOption[];
  selectedJournal: string;
}

export function JournalFilterSelect({
  journals,
  selectedJournal,
}: JournalFilterSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleJournalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (val && val !== "all") {
      params.set("journal", val);
    } else {
      params.delete("journal");
    }
    params.delete("page"); // Reset pagination

    const qs = params.toString();
    router.push(`/papers${qs ? `?${qs}` : ""}`);
  };

  const handleClearJournal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("journal");
    params.delete("page");
    const qs = params.toString();
    router.push(`/papers${qs ? `?${qs}` : ""}`);
  };

  const activeJournalObj =
    selectedJournal !== "all"
      ? journals.find(
          (j) => j.slug === selectedJournal || j.id === selectedJournal
        )
      : null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.selectGroup}>
        <label htmlFor="journal-filter-select" className={styles.label}>
          <BookOpen size={13} className={styles.labelIcon} />
          <span>Journal:</span>
        </label>
        <div className={styles.selectContainer}>
          <select
            id="journal-filter-select"
            value={selectedJournal}
            onChange={handleJournalChange}
            className={styles.selectInput}
            aria-label="Filter papers by specific journal"
          >
            <option value="all">All Journals ({journals.length})</option>
            {journals.map((journal) => (
              <option
                key={journal.id}
                value={journal.slug || journal.id}
              >
                {journal.title} (Vol. {journal.volume}, Iss. {journal.issue})
              </option>
            ))}
          </select>
          <ChevronDown size={14} className={styles.dropdownIcon} />
        </div>
      </div>

      {activeJournalObj && (
        <div className={styles.activePill}>
          <span className={styles.activePillText}>
            Journal: <strong>{activeJournalObj.title}</strong>
          </span>
          <button
            type="button"
            onClick={handleClearJournal}
            className={styles.clearBtn}
            title="Clear journal filter"
            aria-label="Clear journal filter"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
