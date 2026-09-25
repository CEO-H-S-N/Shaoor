"use client";

import React, { useEffect, useRef } from "react";

interface RevolvingCarouselTrackProps {
  direction: "left" | "right";
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

export function RevolvingCarouselTrack({
  className,
  containerClassName,
  children,
  ariaLabel,
}: RevolvingCarouselTrackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;

    function updateCardOpacities() {
      if (!containerRef.current || !trackRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerLeft = containerRect.left;
      const containerRight = containerRect.right;
      const fadeZone = 240; // distance from edge where cards progressively fade

      const cards = trackRef.current.children;
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement;
        const rect = card.getBoundingClientRect();

        // Card center relative to edges
        const cardCenter = (rect.left + rect.right) / 2;

        let opacity = 1;

        if (cardCenter < containerLeft + fadeZone) {
          // Fading out towards left edge
          opacity = Math.max(0, Math.min(1, (cardCenter - containerLeft) / fadeZone));
        } else if (cardCenter > containerRight - fadeZone) {
          // Fading in from right edge
          opacity = Math.max(0, Math.min(1, (containerRight - cardCenter) / fadeZone));
        }

        const target = opacity.toFixed(2);
        if (card.style.opacity !== target) {
          card.style.opacity = target;
        }
      }

      animId = requestAnimationFrame(updateCardOpacities);
    }

    animId = requestAnimationFrame(updateCardOpacities);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div ref={containerRef} className={containerClassName} aria-label={ariaLabel}>
      <div ref={trackRef} className={className}>
        {children}
      </div>
    </div>
  );
}
