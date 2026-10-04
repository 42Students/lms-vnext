"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Dashboard", href: "/learn/my-placements" },
  { label: "Drives", href: "/learn/my-placements/jobs" },
  { label: "Applications", href: "/learn/my-placements/applications" },
  { label: "Assessments", href: "/learn/my-placements/assessments" },
  { label: "Interviews", href: "/learn/my-placements/interviews" },
  { label: "Career Calendar", href: "/learn/my-placements/calendar" },
  { label: "Placement cell", href: "/learn/my-placements/placement" },
] as const;

export function LearnerPlacementsTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Placements workspace" className="overflow-x-auto border-b border-border">
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/learn/my-placements" && pathname.startsWith(`${tab.href}/`));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "border-b-2 border-primary px-4 py-3 text-sm font-semibold text-primary-text"
                  : "border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-body hover:text-primary-text"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
