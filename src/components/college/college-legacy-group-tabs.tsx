"use client";

import { Tabs } from "@/components/ui/tabs";
import { StepIndicator } from "@/components/ui/step-indicator";
import { usePathname } from "next/navigation";
import { collegeLegacyGroupForPath, collegeLegacyTabActive, collegeProjectWorkspaceOwnsTabs, collegeAcademicSetupStep } from
  "@/modules/people/college-legacy-tabs-model";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";

/** Route-aware nested College Admin tabs, scoped to existing College pages. */
export function CollegeLegacyGroupTabs() {
  const pathname = usePathname();
  const group = collegeLegacyGroupForPath(pathname);
  const step=collegeAcademicSetupStep(pathname);
  if (!group || collegeProjectWorkspaceOwnsTabs(pathname)) return null;
  const selected = group.tabs.find(tab => collegeLegacyTabActive(pathname, tab.href))?.href ?? "";
  return <section aria-label={group.title} className="w-full min-w-0 pb-4 print:hidden">
    <Heading level={2} className="sr-only">{group.title}</Heading>
    {step ? <div className="flex min-w-0 flex-col gap-3 border-b border-border py-3 text-sm md:flex-row md:items-center md:justify-between" aria-label="Academic setup step">
      <StepIndicator current={step.index} total={step.total} title={step.title} />
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
       {step.previous?<TextLink href={step.previous.href} className="inline-flex min-h-11 min-w-0 items-center break-words md:min-h-9">Previous: {step.previous.label}</TextLink>:null}
       {step.next?<TextLink href={step.next.href} className="inline-flex min-h-11 min-w-0 items-center break-words md:min-h-9">Next: {step.next.label}</TextLink>:null}
      </div>
    </div> : null}
    <Tabs ariaLabel={group.title} value={selected} renderPanel={false}
      items={group.tabs.map(tab => ({value: tab.href, label: tab.label, href: tab.href}))} />
  </section>;
}
