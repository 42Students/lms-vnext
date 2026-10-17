"use client";

import Link from "next/link";
import { usePathname,useRouter } from "next/navigation";
import {useRef} from "react";
import {learnerPlacementSwipeDestination} from "@/modules/placements/learner-placements-swipe-model";

export const learnerPlacementsLegacyTabs = [
  { label: "Home", href: "/learn/my-placements" },
  { label: "Drives", href: "/learn/my-placements/jobs" },
  { label: "Applications", href: "/learn/my-placements/applications" },
  { label: "Schedule", href: "/learn/my-placements/schedule" },
  { label: "Offers", href: "/learn/my-placements/offers" },
  { label: "Notices", href: "/learn/my-placements/announcements" },
  { label: "Placement cell", href: "/learn/my-placements/placement" },
] as const;

export function LearnerPlacementsTabs({unreadPersonalAlerts=null}:{unreadPersonalAlerts?:number|null}) {
  const pathname = usePathname();
  const router=useRouter();
  const touchStart=useRef<{x:number;y:number}|null>(null);

  return (
    <nav aria-label="Placements workspace" className="min-w-0 border-b border-border"
      onTouchStart={event=>{
        const touch=event.touches[0];
        touchStart.current=touch?{x:touch.clientX,y:touch.clientY}:null;
      }}
      onTouchCancel={()=>{touchStart.current=null;}}
      onTouchEnd={event=>{
        const start=touchStart.current;
        touchStart.current=null;
        const end=event.changedTouches[0];
        if(!start||!end)return;
        const destination=learnerPlacementSwipeDestination(pathname,end.clientX-start.x,
          end.clientY-start.y,learnerPlacementsLegacyTabs.map(tab=>tab.href));
        if(destination)router.push(destination);
      }}>
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
              {tab.label==="Notices" && unreadPersonalAlerts!==null && unreadPersonalAlerts>0 ? (
                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary-subtle px-1 text-xs tabular-nums text-primary-text"
                  title="Unread personal placement alerts" aria-label={unreadPersonalAlerts+" unread personal placement alerts"}>
                  {unreadPersonalAlerts}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
