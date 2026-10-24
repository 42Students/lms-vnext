"use client";
import Link from "next/link";
import {usePathname,useSearchParams} from "next/navigation";
import {TPO_PROTOTYPE_SECTIONS,tpoPrototypeSectionForPath} from "@/components/shell/tpo-prototype-navigation";

/** Prototype section tabs retain old LMS operations while presenting the
 * five Companies, five Students, Team and Settings destinations in context. */
export function TpoPrototypeSectionTabs(){
 const pathname=usePathname();
 const search=useSearchParams();
 const section=tpoPrototypeSectionForPath(pathname,search.get("tab"));
 const links=section==="Students"?TPO_PROTOTYPE_SECTIONS.Students:
  section==="Drives"?TPO_PROTOTYPE_SECTIONS.Drives:
  section==="Companies"?TPO_PROTOTYPE_SECTIONS.Companies:
  section==="Team"?TPO_PROTOTYPE_SECTIONS.Team:
  section==="Reports"?TPO_PROTOTYPE_SECTIONS.Reports:
  section==="Settings"?TPO_PROTOTYPE_SECTIONS.Settings:null;
 if(!links||links.length<2)return null;
 const isActive=(href:string)=>{
  const [path,query]=href.split("?");
  if(path!==pathname&&!(href==="/tpo/placements"&&pathname.startsWith("/tpo/placements/"))&&
     !(href==="/tpo/students"&&pathname.startsWith("/tpo/students/")))return false;
  const p=new URLSearchParams(query||"");
  if(p.has("view"))return search.get("view")===p.get("view");
  if(p.has("tab"))return search.get("tab")===p.get("tab");
  if(href==="/tpo/recruiters")return search.get("view")!=="campaigns";
  if(href==="/tpo/messages?tab=recruiters")return search.get("tab")==="recruiters";
  return true;
 };
 return <nav aria-label={section+" sections"} className="min-w-0 overflow-x-auto border-b border-[#e7ecf2]">
  <div className="flex w-max min-w-full items-center gap-7 px-1">
   {links.map(link=><Link href={link.href} key={link.href}
     aria-current={isActive(link.href)?"page":undefined}
     className="inline-flex min-h-11 items-center border-b-2 border-transparent px-0.5 pb-2 pt-2 text-[15px] text-[#5b6b82] hover:text-[#0a7c88] aria-[current=page]:border-[#0a7c88] aria-[current=page]:font-bold aria-[current=page]:text-[#0a7c88]">
      {link.label}
    </Link>)}
  </div>
 </nav>;
}
