"use client";

import {Fragment,useEffect,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {safeTpoShellCounters,shellUnreadBadge,type TpoShellCounters} from "./shell-counts-model";
import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {cx} from "@/lib/class-names";
import {scopedShellNavigation,shellNavIconKey,
 TPO_SECTION_LABELS,type ShellNavItem} from "./shell-model";
import {ShellNavGlyph} from "./shell-nav-icons";
import {legacySidebarItemActive} from "./legacy-sidebar-active-model";
import {superAdminLegacyGroupForPath} from "@/modules/people/super-admin-legacy-tabs-model";
import {collegeLegacyGroupForPath} from "@/modules/people/college-legacy-tabs-model";
import "./sidebar-legacy.css";

/** Only TPO displays uppercase group words in the legacy shell.
 * Recruiter, learner, faculty and admin lists separate groups with hairlines. */
function sectionLabel(item:ShellNavItem):string|null{
 if(!item.group||!item.href.startsWith("/tpo/"))return null;
 return item.group in TPO_SECTION_LABELS
  ?TPO_SECTION_LABELS[item.group as keyof typeof TPO_SECTION_LABELS]
  :null;
}
function tpoItemCount(href:string,counts:TpoShellCounters):number|null{
 if(href==="/tpo/requests")return counts.requests;
 if(href==="/tpo/messages")return counts.messages;
 if(href==="/tpo/team")return counts.team??0;
 if(href==="/tpo/notifications")return counts.notifications;
 return null;
}

/** One semantic navigation for the desktop hover rail and the mobile drawer.
 * The desktop-only label and badge transformations are CSS-driven, so touch
 * drawers remain fully readable and keyboard focus expands the 96px rail. */
export function SidebarNav({
 items,compact=false,onNavigate,
}:{
 items:readonly ShellNavItem[];
 compact?:boolean;
 onNavigate?:()=>void;
}){
 const pathname=usePathname();
 const [tpoCounts,setTpoCounts]=useState<TpoShellCounters|null>(null);
 const visibleItems=scopedShellNavigation(items,pathname);
 const sidebarPortal=pathname==="/tpo"||pathname.startsWith("/tpo/")
  ?"tpo":pathname==="/hr"||pathname.startsWith("/hr/")||
   pathname==="/recruiter"||pathname.startsWith("/recruiter/")?"recruiter":"other";
 useEffect(()=>{
  if(!pathname.startsWith("/tpo/"))return;
  let active=true;
  const refresh=async()=>{
   if(document.hidden)return;
   try{
    const response=await apiFetch<unknown>("/api/tpo/shell-counts",{
     credentials:"same-origin",cache:"no-store",
    });
    const value=safeTpoShellCounters(response);
    if(active&&value)setTpoCounts(value);
   }catch{/* Retain existing badges on a transient network failure. */}
  };
  void refresh();
  const timer=window.setInterval(()=>void refresh(),60000);
  document.addEventListener("visibilitychange",refresh);
  return ()=>{
   active=false;
   window.clearInterval(timer);
   document.removeEventListener("visibilitychange",refresh);
  };
 },[pathname]);

 const superAdminGroup=pathname.startsWith("/admin/")
  ?superAdminLegacyGroupForPath(pathname):null;
 const collegeGroup=pathname.startsWith("/college/")
  ?collegeLegacyGroupForPath(pathname):null;

 return <nav aria-label="Main navigation" data-sidebar-portal={sidebarPortal}
  className={cx("lms-sidebar-nav flex min-w-0",compact?"flex-row flex-wrap":"flex-col")}
 >{visibleItems.map((item,index)=>{
   const previousGroup=index>0?visibleItems[index-1]?.group:null;
   const startsNewGroup=Boolean(item.group)&&(index===0||item.group!==previousGroup);
   const active=legacySidebarItemActive(pathname,item,
    superAdminGroup?.title??null,collegeGroup?.title??null);
   const label=sectionLabel(item);
   const count=tpoCounts?tpoItemCount(item.href,tpoCounts):null;
   const badge=count===null?null:shellUnreadBadge(count);
   return <Fragment key={item.href}>
    {startsNewGroup&&!compact
     ?label
      ?<div className="lms-nav-heading" role="separator" aria-label={label}>
        <span className="lms-nav-heading-text">{label}</span>
       </div>
      :index>0?<div className="lms-nav-group-rule" role="separator" />:null
     :null}
    <Link href={item.href}
     aria-label={badge&&count!==null?`${item.label}, ${count} pending`:item.label}
     title={item.label}
     aria-current={active?"page":undefined}
     data-active={active?"true":undefined}
     onClick={onNavigate}
     className="lms-sidebar-item group"
    >
     <span className="lms-sidebar-item-icon" aria-hidden="true">
      {item.icon?
       <Image src={active?item.activeIcon??item.icon:item.icon}
        alt="" width={20} height={20} loading="eager" draggable={false}
        className="h-5 w-5 object-contain"/>:
       <ShellNavGlyph name={shellNavIconKey(item)}/>}
     </span>
     <span className="lms-nav-label">{item.label}</span>
     {badge?<span className="lms-sidebar-badge" aria-label={count+" pending"}>{badge}</span>:null}
    </Link>
   </Fragment>;
  })}</nav>;
}
