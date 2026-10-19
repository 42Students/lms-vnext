"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { collegeLegacyGroupForPath, collegeLegacyTabActive, collegeProjectWorkspaceOwnsTabs, collegeAcademicSetupStep } from
  "@/modules/people/college-legacy-tabs-model";

/** Route-aware nested College Admin tabs, scoped to existing College pages. */
export function CollegeLegacyGroupTabs() {
  const pathname = usePathname();
  const group = collegeLegacyGroupForPath(pathname);
  const step=collegeAcademicSetupStep(pathname);
  if (!group || collegeProjectWorkspaceOwnsTabs(pathname)) return null;
  return <nav aria-label={group.title}
    className="w-full min-w-0 overflow-x-auto border-b border-border bg-transparent px-0">
    <h2 className="pt-3 text-base font-semibold text-foreground">{group.title}</h2>
    {step?<div className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm" aria-label="Academic setup step">
      <strong>Academic setup · Step {step.index} of {step.total}: {step.title}</strong>
      <div className="flex flex-wrap gap-3">
       {step.previous?<Link href={step.previous.href} className="text-link underline lms-inline-link">Previous: {step.previous.label}</Link>:null}
       {step.next?<Link href={step.next.href} className="text-link underline lms-inline-link">Next: {step.next.label}</Link>:null}
      </div>
    </div>:null}
    <div className="flex w-max min-w-full flex-wrap items-center gap-5 pt-2">
      {group.tabs.map(tab=><Link key={tab.href} href={tab.href}
        aria-current={collegeLegacyTabActive(pathname,tab.href)?"page":undefined}
        className={collegeLegacyTabActive(pathname,tab.href)
          ?"border-b-2 border-primary px-1 py-3 text-sm font-semibold text-link"
          :"border-b-2 border-transparent px-1 py-3 text-sm font-medium text-body hover:border-border hover:text-foreground"}>
        {tab.label}
      </Link>)}
    </div>
  </nav>;
}
