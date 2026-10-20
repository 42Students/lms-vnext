"use client";
import { Dropdown } from "@/components/ui/dropdown";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";

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
      <label className="grid gap-1 text-sm font-semibold md:hidden">Workspace section
        <Select aria-label="Drive workspace section" value={selected}
          onChange={event=>router.push(event.target.value)}
          className="min-h-11 md:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
          {tabs.map(tab=><option key={tab.href} value={tab.href}>{tab.label}</option>)}
        </Select>
      </label>
      <div className="hidden min-w-0 flex-wrap items-center gap-1 md:flex">
      <Tabs ariaLabel="Drive workspace primary sections" value={selected}
        renderPanel={false}
        items={tpoDriveTabs(jobId).map(tab=>({
         value:tab.href,label:tab.label,href:tab.href,
        }))}/>
      <Dropdown align="end" label="More drive sections" trigger="More sections ▾">
        <div className="grid min-w-52 gap-1">
          {tpoDriveMoreTabs(jobId).map(tab=>(
            <Link key={tab.href} href={tab.href}
              aria-current={pathname===tab.href.split("#")[0]?"page":undefined}
              className="min-h-11 rounded-[var(--lms-radius-control)] px-3 py-2 text-sm font-semibold text-primary-text hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] transition-[background-color] duration-[200ms] ease-[ease] motion-reduce:transition-none">
              {tab.label}
            </Link>
          ))}
        </div>
      </Dropdown>
      </div>
    </nav>
  );
}
