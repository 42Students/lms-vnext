"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tpoDriveTabs } from "@/modules/placements/tpo-drive-tab-model";

/** Keep the same drive navigation and active state on every nested workflow. */
export function TpoDriveWorkspaceNav({ jobId }: { jobId: string }) {
  const pathname = usePathname();
  const root = "/tpo/placements/jobs/" + encodeURIComponent(jobId);
  return (
    <nav aria-label="Drive workspace sections"
      className="flex flex-wrap gap-2 rounded-lg border border-border bg-surface p-3">
      {tpoDriveTabs(jobId).map((tab) => {
        const active = tab.href === root
          ? pathname === root || pathname === root + "/rounds"
          : pathname === tab.href || (
            tab.href !== root + "/applicants" &&
            pathname.startsWith(tab.href + "/")
          );
        return (
          <Link key={tab.href} href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-semibold transition-colors ${active
              ? "border-primary bg-primary-subtle text-primary-text"
              : "border-border text-primary-text hover:bg-primary-subtle"}`}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
