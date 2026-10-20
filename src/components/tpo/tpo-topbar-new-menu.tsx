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
 const navClass="block min-h-11 rounded-[var(--lms-control-radius)] px-2 py-2 text-sm text-primary-text hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] transition-[background-color] duration-[200ms] ease-[ease] motion-reduce:transition-none break-words [overflow-wrap:anywhere]";
 const links=companyName?[{
  label:"New recruiter lead"+companyPrefix,
  href:"/tpo/recruiters?add=1&company="+encodeURIComponent(companyName),
 },{
  label:"New drive"+companyPrefix,
  href:"/tpo/placements/new?company="+encodeURIComponent(companyName),
 }]:TPO_TOPBAR_QUICK_LINKS.filter(item=>item.label!=="Follow-up");
 return <Dropdown align="end" label="New placement work" trigger="+ New">
  <nav aria-label={companyName?"Create work for "+companyName:"Create placement work"}
   className="min-w-[min(15rem,calc(100vw_-_5rem))] max-w-full space-y-1">
   {links.map(item=><Link key={item.href} href={item.href} className={navClass}>{item.label}</Link>)}
   {companyName?<MenuSeparator />:null}
   <div className="min-w-0"><TpoNewFollowupModal collegeId={collegeId}/></div>
  </nav>
 </Dropdown>;
}
