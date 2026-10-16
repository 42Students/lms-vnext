"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { browserTitleForPath } from "./page-titles";

/**
 * Keeps the browser tab title in the legacy `<title> · 42LMS` format.
 *
 * The root layout's metadata `<title>` is owned by React/Next and is written
 * back after hydration and streaming, which silently reverted a one-shot
 * `document.title = ...` to the bare "42LMS" (acceptance pass 6). So the title
 * is re-asserted whenever the head changes while this component is mounted.
 */
export function PageTitle({ superAdmin = false }: { superAdmin?: boolean }) {
  const pathname = usePathname();
  useEffect(() => {
    const wanted = browserTitleForPath(pathname ?? "/", { superAdmin });
    const apply = () => {
      if (document.title !== wanted) document.title = wanted;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [pathname, superAdmin]);
  return null;
}
