"use client";

import { Tabs } from "@/components/ui/tabs";
import { usePathname } from "next/navigation";
import { TrackerThemeToggle } from "./tracker-theme-toggle";

const pages = [
  {value: "issues", label: "Issues", href: "/tracker/issues"},
  {value: "report", label: "Report Issue", href: "/tracker"},
  {value: "mine", label: "My reports", href: "/tracker/mine"},
  {value: "logs", label: "Logs", href: "/tracker/logs"},
  {value: "audit", label: "Audit findings", href: "/tracker/audit-findings"},
] as const;

export function TrackerAdminNav() {
  const pathname = usePathname();
  return (
    <>
    <a href="#tracker-content"
      className="sr-only focus:not-sr-only focus:mb-2 focus:inline-flex focus:min-h-11 md:focus:min-h-9 focus:items-center focus:rounded-[var(--lms-control-radius)] focus:bg-surface focus:px-3 focus:font-semibold focus:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
      Skip to content
    </a>
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
      <Tabs renderPanel={false} ariaLabel="42 Tracker" className="min-w-0 flex-1"
        value={pathname.startsWith("/tracker/issues")?"issues":pathname==="/tracker"?"report":
          pathname.startsWith("/tracker/mine")?"mine":
          pathname.startsWith("/tracker/logs")?"logs":pathname.startsWith("/tracker/audit-findings")?"audit":""}
        items={pages}/>
      <TrackerThemeToggle />
    </div>
    <span id="tracker-content" tabIndex={-1} className="sr-only">Tracker page content</span>
    </>
  );
}
