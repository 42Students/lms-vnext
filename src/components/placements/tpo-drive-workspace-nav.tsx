import { Select } from "@/components/ui/select";
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
      className="min-w-0 border-b border-border pb-2">
      <label className="grid gap-1 text-sm font-semibold sm:hidden">Workspace section
        <Select aria-label="Drive workspace section" value={selected}
          onChange={event=>router.push(event.target.value)}
          className="min-h-11 md:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
          {tabs.map(tab=><option key={tab.href} value={tab.href}>{tab.label}</option>)}
        </Select>
      </label>
      <div className="hidden min-w-0 flex-wrap items-center gap-1 sm:flex">
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
            className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition-colors md:min-h-9 ${active
              ? "border-primary text-primary-text"
              : "border-transparent text-body hover:border-border hover:text-primary-text"}`}>
            {tab.label}
          </Link>
        );
      })}
      <details className="relative min-w-fit">
        <summary className="flex min-h-11 md:min-h-9 cursor-pointer list-none items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
          More sections ▾
        </summary>
        <div className="absolute right-0 z-30 mt-1 grid min-w-52 gap-1 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-2 shadow-[0_14px_16px_rgba(0,0,0,0.04)]">
          {tpoDriveMoreTabs(jobId).map(tab=>(
            <Link key={tab.href} href={tab.href}
              aria-current={pathname===tab.href.split("#")[0]?"page":undefined}
              className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] px-3 py-2 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
              {tab.label}
            </Link>
          ))}
        </div>
      </details>
      </div>
    </nav>
  );
}
