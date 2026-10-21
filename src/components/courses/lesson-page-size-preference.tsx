"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const choices = new Set(["10", "25", "50", "100"]);

/** Restore the old lessons-page-size preference only when the URL has no
 * explicit choice. URL navigation always wins over an older local preference. */
export function LessonPageSizePreference({storageKey}:{
  storageKey:"admin-lessons-page-size"|"college-lessons-page-size";
}) {
  const router = useRouter();
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const explicit = url.searchParams.get("pageSize");
      if (explicit !== null) {
        if (choices.has(explicit)) window.localStorage.setItem(storageKey, explicit);
        return;
      }
      const saved = window.localStorage.getItem(storageKey);
      if (!saved || !choices.has(saved) || saved === "25") return;
      url.searchParams.set("pageSize", saved);
      url.searchParams.delete("page");
      router.replace(url.pathname + "?" + url.searchParams.toString(), {scroll:false});
    } catch {
      // Browsers may restrict storage; keep the safe server default (25).
    }
  }, [router, storageKey]);
  return null;
}
