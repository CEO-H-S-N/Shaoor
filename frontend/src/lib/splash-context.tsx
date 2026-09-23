"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import Image from "next/image";

interface SplashOptions {
  immediate?: boolean;
  onCovered?: () => void;
}

interface SplashContextValue {
  /** Trigger the splash animation */
  trigger: (opts?: SplashOptions | (() => void)) => void;
  isActive: boolean;
}

const SplashContext = createContext<SplashContextValue>({
  trigger: () => {},
  isActive: false,
});

export function useSplash() {
  return useContext(SplashContext);
}

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<"idle" | "in" | "hold" | "out">("idle");
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const trigger = useCallback((opts?: SplashOptions | (() => void)) => {
    clearAllTimers();

    const options: SplashOptions =
      typeof opts === "function" ? { onCovered: opts } : opts || {};

    if (options.immediate) {
      // For initial page load: start fully visible, hold, then fade out
      setStage("hold");

      // Hold for 700ms then start fade-out
      const t1 = setTimeout(() => {
        setStage("out");
      }, 700);

      // Finish fade-out after 400ms (total 1100ms)
      const t2 = setTimeout(() => {
        setStage("idle");
        options.onCovered?.();
      }, 1100);

      timersRef.current = [t1, t2];
    } else {
      // User clicked logo: fade in over 260ms → navigate while covered → hold → fade out
      setStage("in");

      // Fade-in duration 260ms
      const t1 = setTimeout(() => {
        setStage("hold");
        // Screen is fully covered now: perform navigation
        options.onCovered?.();
      }, 260);

      // Hold for 450ms then start fade-out
      const t2 = setTimeout(() => {
        setStage("out");
      }, 750);

      // Fade-out takes 400ms
      const t3 = setTimeout(() => {
        setStage("idle");
      }, 1150);

      timersRef.current = [t1, t2, t3];
    }
  }, []);

  const isVisible = stage !== "idle";
  const isOpaque = stage === "hold" || stage === "in";

  return (
    <SplashContext.Provider value={{ trigger, isActive: isVisible }}>
      {children}

      {isVisible && (
        <div
          aria-hidden="true"
          onClick={() => {
            clearAllTimers();
            setStage("idle");
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            backgroundColor: "#faf9f6",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: stage === "out" ? "none" : "auto",
            opacity: stage === "out" ? 0 : 1,
            transition:
              stage === "in"
                ? "opacity 260ms cubic-bezier(0.16, 1, 0.3, 1)"
                : stage === "out"
                ? "opacity 400ms ease-out"
                : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              transform:
                stage === "in"
                  ? "scale(0.96)"
                  : stage === "hold"
                  ? "scale(1)"
                  : "scale(1.02)",
              transition:
                stage === "in"
                  ? "transform 260ms cubic-bezier(0.16, 1, 0.3, 1)"
                  : stage === "out"
                  ? "transform 400ms ease-out"
                  : "transform 150ms ease",
            }}
          >
            <Image
              src="/shaoor-logo.png"
              alt="Shaoor"
              width={180}
              height={139}
              priority
              style={{
                width: "clamp(140px, 20vw, 200px)",
                height: "auto",
                objectFit: "contain",
                userSelect: "none",
              }}
              draggable={false}
            />
          </div>
        </div>
      )}
    </SplashContext.Provider>
  );
}
