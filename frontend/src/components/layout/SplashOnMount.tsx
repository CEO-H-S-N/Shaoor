"use client";

import { useEffect } from "react";
import { useSplash } from "@/lib/splash-context";

/**
 * Mounts in the root layout. On every page load or browser reload,
 * it displays the splash screen with the Shaoor logo with a smooth fade-out.
 */
export function SplashOnMount() {
  const { trigger } = useSplash();

  useEffect(() => {
    // Show splash screen on every page load / reload
    trigger({ immediate: true });
  }, [trigger]);

  return null;
}
