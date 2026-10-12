"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown, Mail, HelpCircle, Send } from "lucide-react";
import styles from "./faq.module.css";
import { FaqItem, FaqPageData } from "@/lib/pageContentDefaults";

interface Props {
  content: FaqPageData;
}

export function FAQAccordion({ content }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    [content.items[0]?.id || ""]: true, // first item open by default
  });

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    content.items.forEach((item) => {
      if (item.category?.trim()) {
        set.add(item.category.trim());
      }
    });
    return ["All", ...Array.from(set)];
  }, [content.items]);

  // Filter items based on category and search
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    return content.items.filter((item) => {
      const matchCat =
        selectedCategory === "All" ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchCat) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [content.items, selectedCategory, search]);

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const contactEmail = content.contactEmail || "shouket.tilwani@gmail.com";

  return (
    <div className={styles.container}>
      {/* Search & Category Filter Bar */}
      <div className={styles.searchFilterBar}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search questions or keywords (e.g. peer review, fees, format)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {categories.length > 2 && (
          <div className={styles.categoryPills}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`${styles.categoryBtn} ${
                  selectedCategory === cat ? styles.categoryBtnActive : ""
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Accordion Questions List */}
      <div className={styles.accordionList}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyNotice}>
            <HelpCircle size={36} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontWeight: 600, fontSize: "1.05rem", margin: "0 0 6px" }}>
              No questions found matching your search.
            </p>
            <p style={{ fontSize: "0.88rem", margin: 0 }}>
              Try searching different keywords, or reach out to our editorial desk directly below.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOpen = !!openIds[item.id];
            return (
              <div
                key={item.id}
                className={`${styles.accordionItem} ${
                  isOpen ? styles.accordionItemOpen : ""
                }`}
              >
                <button
                  type="button"
                  className={styles.accordionTrigger}
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                >
                  <div className={styles.triggerTextGroup}>
                    {item.category && (
                      <span className={styles.categoryTag}>{item.category}</span>
                    )}
                    <span className={styles.questionTitle}>{item.question}</span>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`${styles.toggleIcon} ${
                      isOpen ? styles.toggleIconRotated : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className={styles.accordionContent}>
                    <p className={styles.answerText}>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Editorial Contact Card */}
      <div className={styles.contactCard}>
        <div className={styles.contactInfo}>
          <div className={styles.contactBadge}>
            <Mail size={13} />
            Editorial Support
          </div>
          <h2 className={styles.contactHeading}>{content.contactHeading}</h2>
          <p className={styles.contactDescription}>
            {content.contactDescription}
          </p>
        </div>

        <div className={styles.contactActionBlock}>
          <a
            href={`mailto:${contactEmail}?subject=${encodeURIComponent("Shaoor Editorial / Author Inquiry")}`}
            className={styles.contactButton}
          >
            <Send size={15} />
            Email Editorial Desk
          </a>
          <span className={styles.emailDirectText}>{contactEmail}</span>
        </div>
      </div>
    </div>
  );
}
