"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "team", label: "People & Meetings" },
  { key: "sprints", label: "Releases and Sprints" },
  { key: "board", label: "Board" },
  { key: "performance", label: "Task Allocation" },
  { key: "resources", label: "Resources" },
  { key: "activity", label: "Activity" },
] as const;

export function MentorProjectTabs({
  projectId,
}: {
  projectId: string;
}) {
  const searchParams = useSearchParams();
  const active =
    searchParams.get("tab") === "tasks" ? "board" : searchParams.get("tab") === "meetings" ? "team" : searchParams.get("tab") ?? "overview";

  return (
    <nav
      aria-label="Project sections"
      className="overflow-x-auto border-b border-border"
    >
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={
              "/mentor/projects/" +
              encodeURIComponent(projectId) +
              "?tab=" +
              tab.key
            }
            aria-current={
              active === tab.key
                ? "page"
                : undefined
            }
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
