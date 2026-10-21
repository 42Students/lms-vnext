"use client";
import {usePathname} from "next/navigation";
import {Tabs} from "@/components/ui/tabs";
import {superAdminLegacyGroupForPath,superAdminLegacyTabActive} from
  "@/modules/people/super-admin-legacy-tabs-model";

/** Shared old-LMS underline navigation: one route-aware strip per group. */
export function SuperAdminLegacyGroupTabs(){
  const pathname=usePathname();
  const group=superAdminLegacyGroupForPath(pathname);
  if(!group)return null;
  const current=group.tabs.find(tab=>superAdminLegacyTabActive(pathname,tab.href))?.href
    ??group.tabs[0]?.href??"";
  return <section aria-label={group.title} className="min-w-0 w-full pb-4 print:hidden">
    {group.title==="People"?<h2 className="mb-3 text-lg font-semibold text-[var(--lms-heading)]">People</h2>:null}
    <Tabs ariaLabel={group.title} renderPanel={false} value={current}
      items={group.tabs.map(tab=>({value:tab.href,label:tab.label,href:tab.href}))}/>
  </section>;
}
