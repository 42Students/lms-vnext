"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const learnerPlacementsLegacyTabs = [
  { label: "Home", href: "/learn/my-placements" },
  { label: "Drives", href: "/learn/my-placements/jobs" },
  { label: "Applications", href: "/learn/my-placements/applications" },
  { label: "Schedule", href: "/learn/my-placements/schedule" },
  { label: "Offers", href: "/learn/my-placements/offers" },
  { label: "Notices", href: "/learn/my-placements/announcements" },
  { label: "Placement cell", href: "/learn/my-placements/placement" },
] as const;

export function LearnerPlacementsTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Placements workspace" className="min-w-0 border-b border-border">
      <div className="flex min-w-0 flex-wrap gap-1">
        {learnerPlacementsLegacyTabs.map((tab) => {
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
                  ? "border-b-2 border-primary px-3 py-3 text-sm font-semibold text-primary-text"
                  : "border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-body hover:text-primary-text"
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
