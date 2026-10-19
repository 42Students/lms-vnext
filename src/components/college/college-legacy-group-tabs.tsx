"use client";

import Link from "next/link";
import { Tabs } from "@/components/ui/tabs";
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
  return <section aria-label={group.title} className="w-full min-w-0">
    <h2 className="pt-3 text-base font-semibold text-foreground">{group.title}</h2>
    {step ? <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm" aria-label="Academic setup step">
      <strong>Academic setup · Step {step.index} of {step.total}: {step.title}</strong>
      <div className="flex flex-wrap gap-3">
        {step.previous ? <Link href={step.previous.href} className="text-link underline">Previous: {step.previous.label}</Link> : null}
        {step.next ? <Link href={step.next.href} className="text-link underline">Next: {step.next.label}</Link> : null}
      </div>
    </div> : null}
    <Tabs ariaLabel={group.title} value={selected} renderPanel={false}
      items={group.tabs.map(tab => ({value: tab.href, label: tab.label, href: tab.href}))} />
  </section>;
}
