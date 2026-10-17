"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Announce same-tab route and pagination transitions after Next navigation. */
export function RouteAnnouncer() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const previous = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    const key = pathname + "?" + query;
    if (previous.current === null) { previous.current = key; return; }
    if (previous.current === key) return;
    previous.current = key;
    const raf = requestAnimationFrame(() => {
      if (document.querySelector('dialog[open]')) return;
      const main = document.getElementById("lms-main-content");
      const h1 = main?.querySelector("h1")?.textContent?.trim();
      main?.focus({ preventScroll: true });
      setAnnouncement(h1 ? `${h1} updated` : "Page updated");
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, query]);
  return <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</span>;
}
