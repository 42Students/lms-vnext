"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { TrackerThemeToggle } from "./tracker-theme-toggle";

const pages = [
  {value: "issues", label: "Issues", href: "/tracker/issues"},
  {value: "report", label: "Report Issue", href: "/tracker"},
  {value: "logs", label: "Logs", href: "/tracker/logs"},
  {value: "audit", label: "Audit findings", href: "/tracker/audit-findings"},
] as const;

export function TrackerAdminNav() {
  const pathname = usePathname();
  const active = pathname === "/tracker" ? "report"
    : pathname === "/tracker/issues" || pathname.startsWith("/tracker/issues/") ? "issues"
    : pathname === "/tracker/audit-findings" || pathname.startsWith("/tracker/audit-findings/") ? "audit"
    : "logs";
  return (
    <>
      <a href="#tracker-content"
        className="sr-only focus:not-sr-only focus:mb-2 focus:inline-flex focus:min-h-9 focus:items-center focus:rounded focus:bg-surface focus:px-3 focus:font-semibold focus:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        Skip to content
      </a>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs ariaLabel="42 Tracker" renderPanel={false} value={active}
          items={pages.map(page => ({ ...page }))} />
        <TrackerThemeToggle />
      </div>
      <span id="tracker-content" tabIndex={-1} className="sr-only">Tracker page content</span>
    </>
  );
}
