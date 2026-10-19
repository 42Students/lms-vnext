"use client";

import { Tabs } from "@/components/ui/tabs";
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

  const selected = learnerPlacementsLegacyTabs.find(tab =>
    pathname === tab.href || (tab.href !== "/learn/my-placements" && pathname.startsWith(tab.href + "/"))
  )?.href ?? "/learn/my-placements";

  return (
    <div className="min-w-0" onTouchStart={event=>{
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
      <Tabs ariaLabel="Placements workspace" renderPanel={false} value={selected}
        items={learnerPlacementsLegacyTabs.map(tab => ({
          value: tab.href,
          href: tab.href,
          label: tab.label,
          count: tab.label==="Notices" && unreadPersonalAlerts!==null && unreadPersonalAlerts>0
            ? unreadPersonalAlerts : undefined,
        }))} />
    </div>
  );
}
