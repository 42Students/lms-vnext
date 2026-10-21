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
  return <section aria-label={group.title} className="min-w-0 w-full space-y-3 pb-4 print:hidden">
    <h2 className="m-0 text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">{group.title}</h2>
    <Tabs ariaLabel={group.title} renderPanel={false} value={current}
    items={group.tabs.map(tab=>({value:tab.href,label:tab.label,href:tab.href}))}/></section>;
}
