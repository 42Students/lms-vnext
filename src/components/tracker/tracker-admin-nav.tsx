"use client";

import { Tabs } from "@/components/ui/tabs";
import { usePathname } from "next/navigation";
import { TrackerThemeToggle } from "./tracker-theme-toggle";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";

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
    <ButtonLink variant="secondary" href="#tracker-content"
      className="sr-only focus:mb-2">
      Skip to content
    </ButtonLink>
    <nav aria-label="Tracker sections" className="min-w-0 space-y-3 border-b border-border pb-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <TextLink variant="bare" href="/tracker" aria-label="42 Tracker home"
        className="inline-flex min-h-11 items-center gap-2 text-lg font-bold text-[var(--lms-heading)] focus-ring">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="M4 4h16v16H4zM9 4v16M4 10h16"/>
        </svg>42 Tracker
      </TextLink>
      <TrackerThemeToggle />
    </div>
    <div className="min-w-0">
      <Tabs renderPanel={false} ariaLabel="42 Tracker" className="min-w-0 flex-1"
        value={pathname.startsWith("/tracker/issues")?"issues":pathname==="/tracker"?"report":
          pathname.startsWith("/tracker/mine")?"mine":
          pathname.startsWith("/tracker/logs")?"logs":pathname.startsWith("/tracker/audit-findings")?"audit":""}
        items={pages}/>
    </div>
    </nav>
    <span id="tracker-content" tabIndex={-1} className="sr-only">Tracker page content</span>
    </>
  );
}
