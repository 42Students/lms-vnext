"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { browserTitleForPath } from "./page-titles";

/** Keeps the browser tab title in the legacy `<title> · 42LMS` format. */
export function PageTitle({ superAdmin = false }: { superAdmin?: boolean }) {
  const pathname = usePathname();
  useEffect(() => {
    document.title = browserTitleForPath(pathname ?? "/", { superAdmin });
  }, [pathname, superAdmin]);
  return null;
}
