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
  const primaryTabs = tpoDriveTabs(jobId);
  const moreTabs = tpoDriveMoreTabs(jobId);
  const tabs = [...primaryTabs, ...moreTabs];
  // Fragment-only links share the About route; pathname cannot identify an
  // in-page anchor. Keep About highlighted instead of mislabeling it Activity.
  const selected = tabs.filter(tab => !tab.href.includes("#") &&
    (pathname === tab.href || pathname.startsWith(tab.href + "/")))
    .sort((a,b) => b.href.length - a.href.length)[0]?.href ?? root;
  const moreActive = moreTabs.some(tab => tab.href === selected);
  return (
    <nav aria-label="Drive workspace sections"
      className="min-w-0 border-b border-border pb-0">
      <label className="grid gap-[6px] text-[13px] font-semibold md:hidden">Workspace section
        <Select aria-label="Drive workspace section" value={selected}
          onChange={event=>router.push(event.target.value)}
          className="min-h-11 md:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
          {tabs.map(tab=><option key={tab.href} value={tab.href}>{tab.label}</option>)}
        </Select>
      </label>
      <div className="hidden min-w-0 items-center gap-3 md:flex">
      <Tabs ariaLabel="Drive workspace primary sections" value={selected}
        className="min-w-0 flex-1"
        renderPanel={false}
        items={primaryTabs.map(tab=>({
         value:tab.href,label:tab.label,href:tab.href,
        }))}/>
      <Dropdown className="shrink-0" align="end" label="More drive sections"
        trigger="More sections ▾"
        {...(moreActive ? {triggerClassName:"!border-[var(--lms-primary)] !bg-[var(--lms-primary-subtle)] !text-[var(--lms-primary-text)]"} : {})}>
        <div className="grid min-w-52 gap-1">
          {moreTabs.map(tab=>(
            <Link key={tab.href} href={tab.href}
              aria-current={selected===tab.href?"page":undefined}
              className={`flex min-h-11 min-w-0 items-center rounded-[var(--lms-control-radius)] px-3 py-2 text-sm font-semibold leading-5 text-primary-text break-words [overflow-wrap:anywhere] transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] motion-reduce:transition-none ${selected===tab.href?"bg-[var(--lms-primary-subtle)]":""}`}>
              {tab.label}
            </Link>
          ))}
        </div>
      </Dropdown>
      </div>
    </nav>
  );
}
