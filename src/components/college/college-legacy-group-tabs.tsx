"use client";

import Link from "next/link";
import { Tabs } from "@/components/ui/tabs";
import { StepIndicator } from "@/components/ui/step-indicator";
import { usePathname } from "next/navigation";
import { collegeLegacyGroupForPath, collegeLegacyTabActive, collegeProjectWorkspaceOwnsTabs, collegeAcademicSetupStep } from
  "@/modules/people/college-legacy-tabs-model";

/** Route-aware nested College Admin tabs, scoped to existing College pages. */
export function CollegeLegacyGroupTabs() {
  const pathname = usePathname();
  const group = collegeLegacyGroupForPath(pathname);
  const step=collegeAcademicSetupStep(pathname);
  if (!group || collegeProjectWorkspaceOwnsTabs(pathname)) return null;
  const selected = group.tabs.find(tab => collegeLegacyTabActive(pathname, tab.href))?.href ?? "";
  return <section aria-label={group.title} className="w-full min-w-0 pb-4 print:hidden">
    <h2 className="sr-only">{group.title}</h2>
    {step ? <div className="flex min-w-0 flex-col gap-3 border-b border-border py-3 text-sm md:flex-row md:items-center md:justify-between" aria-label="Academic setup step">
      <StepIndicator current={step.index} total={step.total} title={step.title} />
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
       {step.previous?<Link href={step.previous.href} className="inline-flex min-h-11 min-w-0 items-center break-words text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Previous: {step.previous.label}</Link>:null}
       {step.next?<Link href={step.next.href} className="inline-flex min-h-11 min-w-0 items-center break-words text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Next: {step.next.label}</Link>:null}
      </div>
    </div> : null}
    <Tabs ariaLabel={group.title} value={selected} renderPanel={false}
      items={group.tabs.map(tab => ({value: tab.href, label: tab.label, href: tab.href}))} />
  </section>;
}
