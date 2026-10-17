"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tpoDriveTabs,tpoDriveMoreTabs } from "@/modules/placements/tpo-drive-tab-model";

/** Keep the same drive navigation and active state on every nested workflow. */
export function TpoDriveWorkspaceNav({ jobId }: { jobId: string }) {
  const pathname = usePathname();
  const root = "/tpo/placements/jobs/" + encodeURIComponent(jobId);
  return (
    <nav aria-label="Drive workspace sections"
      className="flex flex-wrap gap-2 rounded-lg border border-border bg-surface p-3">
      {tpoDriveTabs(jobId).map((tab) => {
        const active = tab.href === root
          ? pathname === root
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
      <details className="relative min-w-fit">
        <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
          More sections ▾
        </summary>
        <div className="absolute right-0 z-30 mt-1 grid min-w-52 gap-1 rounded-lg border border-border bg-surface p-2 shadow-lg">
          {tpoDriveMoreTabs(jobId).map(tab=>(
            <Link key={tab.href} href={tab.href}
              aria-current={pathname===tab.href.split("#")[0]?"page":undefined}
              className="min-h-10 rounded-md px-3 py-2 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
              {tab.label}
            </Link>
          ))}
        </div>
      </details>
    </nav>
  );
}
