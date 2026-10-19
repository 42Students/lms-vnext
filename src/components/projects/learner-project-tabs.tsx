"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { canonicalLearnerProjectTab, LEARNER_PROJECT_DETAIL_TABS } from "@/modules/projects/learner-project-tab-alias-model";
import { learnerProjectTabHref } from "@/modules/projects/learner-project-tab-href-model";



export function LearnerProjectTabs({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const active = canonicalLearnerProjectTab(searchParams.get("tab"));

  return (
    <nav aria-label="Project sections" className="overflow-x-auto border-b border-border">
      <div className="flex min-w-max gap-1">
        {LEARNER_PROJECT_DETAIL_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={learnerProjectTabHref(projectId,tab.key,searchParams)}
            aria-current={active === tab.key ? "page" : undefined}
            className={
              active === tab.key
                ? "border-b-[3px] border-primary px-4 py-2.5 text-[13px] font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-primary"
                : "border-b-[3px] border-transparent px-4 py-2.5 text-[13px] font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-primary"
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
