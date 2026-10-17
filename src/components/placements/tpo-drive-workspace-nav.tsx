"use client";

import Link from "next/link";
import { usePathname,useRouter } from "next/navigation";
import { tpoDriveTabs,tpoDriveMoreTabs } from "@/modules/placements/tpo-drive-tab-model";

/** Keep the same drive navigation and active state on every nested workflow. */
export function TpoDriveWorkspaceNav({ jobId }: { jobId: string }) {
  const pathname = usePathname();
  const router=useRouter();
  const root = "/tpo/placements/jobs/" + encodeURIComponent(jobId);
  const tabs=[...tpoDriveTabs(jobId),...tpoDriveMoreTabs(jobId)];
  const selected=tabs.filter(tab=>pathname===tab.href.split("#")[0]||pathname.startsWith(tab.href.split("#")[0]+"/"))
   .sort((a,b)=>b.href.length-a.href.length)[0]?.href??root;
  return (
    <nav aria-label="Drive workspace sections"
      className="min-w-0 rounded-lg border border-border bg-surface p-3">
      <label className="grid gap-1 text-sm font-semibold sm:hidden">Workspace section
        <select aria-label="Drive workspace section" value={selected}
          onChange={event=>router.push(event.target.value)}
          className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          {tabs.map(tab=><option key={tab.href} value={tab.href}>{tab.label}</option>)}
        </select>
      </label>
      <div className="hidden min-w-0 flex-wrap gap-2 sm:flex">
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
      </div>
    </nav>
  );
}
