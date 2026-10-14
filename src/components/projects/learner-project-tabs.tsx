"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { canonicalLearnerProjectTab, LEARNER_PROJECT_DETAIL_TABS } from "@/modules/projects/learner-project-tab-alias-model";



export function LearnerProjectTabs({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const active = canonicalLearnerProjectTab(searchParams.get("tab"));

  return (
    <nav aria-label="Project sections" className="overflow-x-auto border-b border-border">
      <div className="flex min-w-max gap-1">
        {LEARNER_PROJECT_DETAIL_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/learn/projects/${encodeURIComponent(projectId)}?tab=${tab.key}`}
            aria-current={active === tab.key ? "page" : undefined}
            className={
              active === tab.key
                ? "border-b-2 border-primary px-4 py-3 text-sm font-semibold text-primary-text"
                : "border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-body hover:text-primary-text"
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
