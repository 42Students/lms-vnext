"use client";

import { Tabs } from "@/components/ui/tabs";
import { usePathname,useRouter } from "next/navigation";
import {useEffect,useRef,useState} from "react";
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

/** The Notices tab mirrors the old college-wide announcements count.
 * Personal placement alerts belong in the Notices page, not its tab badge.
 * The caller must supply a tenant-scoped unread announcement count. */
export function LearnerPlacementsTabs({
 unreadCollegeAnnouncements=null,
 unreadPersonalAlerts: _unreadPersonalAlerts=null,
}:{unreadCollegeAnnouncements?:number|null;unreadPersonalAlerts?:number|null}) {
  const pathname = usePathname();
  const router=useRouter();
  const touchStart=useRef<{x:number;y:number;scrollLeft:number;scroller:HTMLElement|null}|null>(null);
  const [swiping,setSwiping]=useState(false);
  useEffect(()=>setSwiping(false),[pathname]);

  const selected = learnerPlacementsLegacyTabs.find(tab =>
    pathname === tab.href || (tab.href !== "/learn/my-placements" && pathname.startsWith(tab.href + "/"))
  )?.href ?? "/learn/my-placements";

  return (
    <div aria-busy={swiping} className={"min-w-0 motion-safe:transition-opacity motion-safe:duration-150 "+(swiping?"opacity-70":"opacity-100")} onTouchStart={event=>{
        const touch=event.touches[0];
        const scroller=event.currentTarget.querySelector<HTMLElement>('[data-slot="scroll-cue"][data-axis="x"] > div');
        touchStart.current=touch?{x:touch.clientX,y:touch.clientY,scrollLeft:scroller?.scrollLeft??0,scroller}:null;
      }}
      onTouchCancel={()=>{touchStart.current=null;}}
      onTouchEnd={event=>{
        const start=touchStart.current;
        touchStart.current=null;
        const end=event.changedTouches[0];
        if(!start||!end)return;
        const deltaX=end.clientX-start.x;
        // A horizontally scrolling seven-tab strip must scroll before it can
        // act as page-swipe navigation. Navigation remains available at edges.
        const scroller=start.scroller;
        if(scroller&&scroller.scrollWidth>scroller.clientWidth+2){
          const maxScroll=scroller.scrollWidth-scroller.clientWidth;
          if(Math.abs(scroller.scrollLeft-start.scrollLeft)>2)return;
          if(deltaX<0&&start.scrollLeft<maxScroll-2)return;
          if(deltaX>0&&start.scrollLeft>2)return;
        }
        const destination=learnerPlacementSwipeDestination(pathname,deltaX,
          end.clientY-start.y,learnerPlacementsLegacyTabs.map(tab=>tab.href));
        if(destination){setSwiping(true);router.push(destination);}
      }}>
      <Tabs ariaLabel="Placements workspace" renderPanel={false} value={selected}
        items={learnerPlacementsLegacyTabs.map(tab => ({
          value: tab.href,
          href: tab.href,
          label: tab.label,
          count: tab.label==="Notices" && unreadCollegeAnnouncements!==null && unreadCollegeAnnouncements>0
            ? unreadCollegeAnnouncements : undefined,
        }))} />
    </div>
  );
}
