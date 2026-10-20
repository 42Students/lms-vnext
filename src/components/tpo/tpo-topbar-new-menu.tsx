"use client";
import { MenuSeparator } from "@/components/ui/menu";
import { Dropdown } from "@/components/ui/dropdown";

import Link from "next/link";
import {usePathname,useSearchParams} from "next/navigation";
import {TpoNewFollowupModal} from "@/components/tpo/tpo-new-followup-modal";
import {TPO_TOPBAR_QUICK_LINKS} from "@/modules/placements/tpo-topbar-links";
export function TpoTopbarNewMenu({collegeId}:{collegeId:string}){
 const pathname=usePathname(),query=useSearchParams();
 const companyName=pathname==="/tpo/companies"?(query.get("name")||"").trim().slice(0,150):"";
 const companyPrefix=companyName?" for "+companyName:"";
 const navClass="flex min-h-11 w-full min-w-0 items-center rounded-[var(--lms-control-radius)] px-[var(--lms-space-3)] py-2 text-left text-[14px] leading-5 text-[var(--lms-body-text)] transition-colors duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] break-words [overflow-wrap:anywhere] md:min-h-9 motion-reduce:transition-none";
 const links=companyName?[{
  label:"New recruiter lead"+companyPrefix,
  href:"/tpo/recruiters?add=1&company="+encodeURIComponent(companyName),
 },{
  label:"New drive"+companyPrefix,
  href:"/tpo/placements/new?company="+encodeURIComponent(companyName),
 }]:TPO_TOPBAR_QUICK_LINKS.filter(item=>item.label!=="Follow-up");
 return <Dropdown align="end" label="New placement work" trigger="+ New" mobileSheet>
  <nav role="menu" aria-label={companyName?"Create work for "+companyName:"Create placement work"}
   className="grid min-w-0 w-full gap-1 md:w-[min(19rem,calc(100vw_-_3rem))]">
   {links.map(item=><Link role="menuitem" key={item.href} href={item.href} className={navClass}>{item.label}</Link>)}
   {companyName?<MenuSeparator />:null}
   <div className="min-w-0"><TpoNewFollowupModal collegeId={collegeId}/></div>
  </nav>
 </Dropdown>;
}
