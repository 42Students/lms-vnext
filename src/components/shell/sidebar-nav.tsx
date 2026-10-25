"use client";

import {Fragment,useEffect,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {safeTpoShellCounters,shellUnreadBadge,type TpoShellCounters} from "./shell-counts-model";
import Image from "next/image";
import Link from "next/link";
import {usePathname,useSearchParams} from "next/navigation";
import {cx} from "@/lib/class-names";
import {canonicalShellPath,scopedShellNavigation,shellNavIconKey,
 TPO_SECTION_LABELS,type ShellNavItem} from "./shell-model";
import {ShellNavGlyph} from "./shell-nav-icons";
import {legacySidebarItemActive} from "./legacy-sidebar-active-model";
import {tpoPrototypeSidebarActive} from "./tpo-prototype-navigation";
import {facultyPrototypeSidebarActive} from "./faculty-prototype-navigation";
import {superAdminLegacyGroupForPath} from "@/modules/people/super-admin-legacy-tabs-model";
import {collegeLegacyGroupForPath} from "@/modules/people/college-legacy-tabs-model";
import "./sidebar-legacy.css";

/** Only TPO displays uppercase group words in the legacy shell.
 * Recruiter, learner, faculty and admin lists separate groups with hairlines. */
function sectionLabel(item:ShellNavItem,portal:string):string|null{
 // A College Admin's one "Placement cell" shortcut points at /tpo/home;
 // its college sidebar must not suddenly acquire a TPO section heading.
 if(portal!=="tpo"||!item.group||!item.href.startsWith("/tpo/")||
    (item.href==="/tpo/home"&&item.label==="Placement cell"))return null;
 return item.group in TPO_SECTION_LABELS
  ?TPO_SECTION_LABELS[item.group as keyof typeof TPO_SECTION_LABELS]
  :null;
}
function tpoItemCount(href:string,counts:TpoShellCounters):number|null{
 if(href==="/tpo/requests")return counts.requests;
 if(href==="/tpo/messages")return counts.messages;
 if(href==="/tpo/team")return counts.team;
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
 const route=canonicalShellPath(pathname);
 const urlSearch=useSearchParams();
 const [tpoCounts,setTpoCounts]=useState<TpoShellCounters|null>(null);
 const [facultyCounts,setFacultyCounts]=useState<{today:number;assessments:number}|null>(null);
 const visibleItems=scopedShellNavigation(items,route);
 // A college-only Placement cell shortcut still renders the college menu
 // while the URL is /tpo/home. Derive rail styling from the visible role,
 // not only the URL, so it does not acquire TPO headings/scrollbar chrome.
 const collegeSelected=visibleItems.some(item=>
  item.href==="/college"||item.href.startsWith("/college/"));
 // Style against the visible account, not the pathname alone:
 // Super Admin Overview is /dashboard, while College Admin can visit
 // its one Placement cell shortcut on /tpo/home.
 const sidebarSkin=collegeSelected?"college":
  visibleItems.some(item=>item.href.startsWith("/admin/"))?"admin":
  visibleItems.some(item=>item.href.startsWith("/learn/"))?"learner":"other";
 const sidebarPortal=collegeSelected?"other":
  pathname==="/tpo"||pathname.startsWith("/tpo/")
   ?"tpo":pathname==="/hr"||pathname.startsWith("/hr/")||
    pathname==="/recruiter"||pathname.startsWith("/recruiter/")?"recruiter":"other";
 useEffect(()=>{
  // Only a genuine TPO rail may poll TPO counts; a college-only
  // Placement cell crossover can have the same /tpo/home URL.
  if(sidebarPortal!=="tpo")return;
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
 },[pathname,sidebarPortal]);
 const facultySelected=visibleItems.length===4&&visibleItems[0]?.href==="/teacher";
 useEffect(()=>{
  if(!facultySelected)return;
  let active=true;
  const refresh=async()=>{
   if(document.hidden)return;
   try{
    const result=await apiFetch<unknown>("/api/courses/faculty/shell-counts",{
     credentials:"same-origin",cache:"no-store",
    });
    if(!active||!result||typeof result!=="object")return;
    const counts=result as Record<string,unknown>;
    if(Number.isSafeInteger(counts["today"])&&Number.isSafeInteger(counts["assessments"])&&
       (counts["today"] as number)>=0&&(counts["assessments"] as number)>=0)
     setFacultyCounts({today:counts["today"] as number,assessments:counts["assessments"] as number});
   }catch{if(active)setFacultyCounts(null);}
  };
  void refresh();
  const timer=window.setInterval(()=>void refresh(),60000);
  document.addEventListener("visibilitychange",refresh);
  return ()=>{active=false;window.clearInterval(timer);document.removeEventListener("visibilitychange",refresh);};
 },[facultySelected]);

 const superAdminGroup=route.startsWith("/admin/")
  ?superAdminLegacyGroupForPath(route):null;
 const collegeGroup=route.startsWith("/college/")
  ?collegeLegacyGroupForPath(route):null;

 return <nav aria-label="Main navigation" data-sidebar-portal={sidebarPortal}
  data-sidebar-skin={sidebarSkin}
  className={cx("lms-sidebar-nav flex w-full min-w-0",compact?"flex-row flex-wrap gap-[var(--lms-space-2)]":"flex-col")}
 >{visibleItems.map((item,index)=>{
   const previousGroup=index>0?visibleItems[index-1]?.group:null;
   const startsNewGroup=Boolean(item.group)&&(index===0||item.group!==previousGroup);
   const prototypeTpo=sidebarPortal==="tpo"&&visibleItems.length===8&&
     visibleItems.some(entry=>entry.href==="/tpo/companies/today");
   const prototypeFaculty=visibleItems.length===4&&visibleItems[0]?.href==="/teacher";
   const active=prototypeFaculty?facultyPrototypeSidebarActive(pathname,item.href):
     prototypeTpo?tpoPrototypeSidebarActive(pathname,item,urlSearch.get("tab")):
     legacySidebarItemActive(route,item,superAdminGroup?.title??null,collegeGroup?.title??null);
   const label=sectionLabel(item,sidebarPortal);
   const count=prototypeFaculty&&facultyCounts?
     item.href==="/teacher"?facultyCounts.today:
     item.href==="/teacher/assessments"?facultyCounts.assessments:null:
     tpoCounts?tpoItemCount(item.href,tpoCounts):null;
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
     {...(onNavigate ? {onClick:onNavigate} : {})}
     className="lms-sidebar-item group min-w-0"
    >
     <span className="lms-sidebar-item-icon" aria-hidden="true">
      {item.icon?
       <Image src={active?item.activeIcon??item.icon:item.icon}
        alt="" width={20} height={20} loading="eager" draggable={false}
        className="h-5 w-5 object-contain"/>:
       <ShellNavGlyph name={shellNavIconKey(item)}/>}
     </span>
     <span className="lms-nav-label min-w-0">{item.label}</span>
     {badge?<span className="lms-sidebar-badge" aria-label={count+" pending"}>{badge}</span>:null}
    </Link>
   </Fragment>;
  })}</nav>;
}
