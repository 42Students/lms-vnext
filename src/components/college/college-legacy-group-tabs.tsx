"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { collegeLegacyGroupForPath, collegeLegacyTabActive } from
  "@/modules/people/college-legacy-tabs-model";

/** Route-aware nested College Admin tabs, scoped to existing College pages. */
export function CollegeLegacyGroupTabs() {
  const pathname = usePathname();
  const group = collegeLegacyGroupForPath(pathname);
  if (!group) return null;
  return <nav aria-label={group.title}
    className="mx-auto w-full max-w-[1600px] overflow-x-auto border-b border-border bg-surface px-4 sm:px-6">
    <div className="flex w-max min-w-full flex-wrap items-center gap-1 py-2 sm:gap-2">
      {group.tabs.map(tab=><Link key={tab.href} href={tab.href}
        aria-current={collegeLegacyTabActive(pathname,tab.href)?"page":undefined}
        className={collegeLegacyTabActive(pathname,tab.href)
          ?"rounded-md bg-primary-subtle px-3 py-2 text-sm font-semibold text-primary-text"
          :"rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-primary-subtle"}>
        {tab.label}
      </Link>)}
    </div>
  </nav>;
}
