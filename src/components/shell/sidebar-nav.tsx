"use client";

import {Fragment,useEffect,useState} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/class-names";
import type { ShellNavItem } from "./shell-model";
import {legacySidebarItemActive} from "./legacy-sidebar-active-model";
import {superAdminLegacyGroupForPath} from "@/modules/people/super-admin-legacy-tabs-model";
import {collegeLegacyGroupForPath} from "@/modules/people/college-legacy-tabs-model";

import { TPO_SECTION_LABELS } from "./shell-model";
function tpoSectionLabel(item: ShellNavItem): string | null {
  if (!item.href.startsWith("/tpo/") || !item.group ||
    !(item.group in TPO_SECTION_LABELS)) return null;
  return TPO_SECTION_LABELS[item.group as keyof typeof TPO_SECTION_LABELS];
}

export function SidebarNav({
  items,
  compact = false,
  onNavigate,
}: {
  items: readonly ShellNavItem[];
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [tpoCounts,setTpoCounts]=useState<{requests:number;messages:number;notifications:number;team:number|null}|null>(null);
  useEffect(()=>{
   if(!pathname.startsWith("/tpo/"))return;
   let active=true;
   const refresh=async()=>{
    if(document.hidden)return;
    try{
     const response=await fetch("/api/tpo/shell-counts",{credentials:"same-origin",cache:"no-store"});
     if(!response.ok)return;
     const value=await response.json() as {requests:number;messages:number;notifications:number;team:number|null};
     if(active)setTpoCounts(value);
    }catch{/* Preserve previous count on transport failure. */}
   };
   void refresh();
   const timer=window.setInterval(()=>void refresh(),60000);
   document.addEventListener("visibilitychange",refresh);
   return ()=>{active=false;window.clearInterval(timer);document.removeEventListener("visibilitychange",refresh);};
  },[pathname]);

  return (
    <nav
      aria-label="Main navigation"
      className={cx(
        "flex gap-1",
        compact ? "flex-row" : "flex-col",
      )}
    >
      {items.map((item, index) => {
        const previousGroup =
          index > 0 ? items[index - 1]?.group : null;
        const startsNewGroup =
          index > 0 &&
          Boolean(item.group) &&
          item.group !== previousGroup;
        const tpoSection = tpoSectionLabel(item);
        const showTpoSection = tpoSection &&
          (index === 0 || item.group !== previousGroup);
        const superAdminGroup=pathname.startsWith("/admin/")
          ?superAdminLegacyGroupForPath(pathname):null;
        const collegeGroup=pathname.startsWith("/college/")
          ?collegeLegacyGroupForPath(pathname):null;
        const active=legacySidebarItemActive(pathname,item,
          superAdminGroup?.title??null,collegeGroup?.title??null);

        return (
          <Fragment key={item.href}>
            {showTpoSection && !compact ? (
              <p className="mt-3 mb-1 px-3 text-xs font-semibold text-muted-foreground">{tpoSection}</p>
            ) : null}
            {startsNewGroup && !compact && !showTpoSection ? (
              <div
                role="separator"
                aria-hidden="true"
                className="my-2 border-t border-[var(--lms-sidebar-border)]"
              />
            ) : null}
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cx(
              "group flex min-h-11 items-center rounded-r-lg border-l-2 px-3 text-sm font-semibold transition-colors",
              active
                ? "border-primary bg-[var(--lms-sidebar-active)] text-primary-text"
                : "border-transparent text-body hover:bg-primary-subtle hover:text-primary-text",
              compact ? "gap-2" : "gap-3",
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                "flex h-7 w-7 shrink-0 items-center justify-center text-xs font-bold",
                item.icon
                  ? ""
                  : active
                    ? "rounded-md bg-primary text-on-primary"
                    : "rounded-md bg-muted text-muted-foreground group-hover:bg-surface group-hover:text-primary-text",
              )}
            >
              {item.icon ? (
                <Image
                  src={active ? item.activeIcon ?? item.icon : item.icon}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
              ) : (
                item.shortLabel
              )}
            </span>
            <span>{item.label}</span>
            {tpoCounts&&item.href.startsWith("/tpo/")&&
             (item.href==="/tpo/requests"||item.href==="/tpo/messages"||item.href==="/tpo/team"||item.href==="/tpo/notifications")?(()=>{
              const count=item.href==="/tpo/requests"?tpoCounts.requests:
               item.href==="/tpo/messages"?tpoCounts.messages:
               item.href==="/tpo/team"?tpoCounts.team??0:tpoCounts.notifications;
              return count>0?<span aria-label={count+" pending"} className="ml-auto min-w-6 rounded-full bg-primary-subtle px-2 py-1 text-center text-xs font-semibold text-primary-text">
               {count>99?"99+":count}
              </span>:null;
             })():null}
          </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
