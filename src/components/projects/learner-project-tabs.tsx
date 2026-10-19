"use client";

import { useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { canonicalLearnerProjectTab, LEARNER_PROJECT_DETAIL_TABS } from "@/modules/projects/learner-project-tab-alias-model";
import { learnerProjectTabHref } from "@/modules/projects/learner-project-tab-href-model";

/** The same underline tabs across all project detail routes. */
export function LearnerProjectTabs({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const active = canonicalLearnerProjectTab(searchParams.get("tab"));
  return <Tabs ariaLabel="Project sections" renderPanel={false} value={active}
    items={LEARNER_PROJECT_DETAIL_TABS.map(tab => ({
      value: tab.key,
      label: tab.label,
      href: learnerProjectTabHref(projectId, tab.key, searchParams),
    }))} />;
}
