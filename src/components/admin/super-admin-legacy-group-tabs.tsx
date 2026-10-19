"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {superAdminLegacyGroupForPath,superAdminLegacyTabActive} from
  "@/modules/people/super-admin-legacy-tabs-model";

/** One route-aware strip for the active Super Admin group; never a second strip. */
export function SuperAdminLegacyGroupTabs(){
  const pathname=usePathname();
  const group=superAdminLegacyGroupForPath(pathname);
  if(!group)return null;
  return <nav aria-label={group.title}
    className="w-full min-w-0 overflow-x-auto border-b border-border">
    <div className="flex min-w-max items-center gap-1 sm:gap-2">
      {group.tabs.map(tab=><Link key={tab.href} href={tab.href}
        aria-current={superAdminLegacyTabActive(pathname,tab.href)?"page":undefined}
        className={superAdminLegacyTabActive(pathname,tab.href)
          ?"border-b-[3px] border-primary px-3 py-2 text-[14px] font-[650] text-primary-text"
          :"border-b-[3px] border-transparent px-3 py-2 text-[14px] font-medium text-body hover:bg-primary-subtle"}>
        {tab.label}
      </Link>)}
    </div>
  </nav>;
}
