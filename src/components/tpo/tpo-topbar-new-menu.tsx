"use client";
import { Dropdown } from "@/components/ui/dropdown";

import Link from "next/link";
import {usePathname,useSearchParams} from "next/navigation";
import {TpoNewFollowupModal} from "@/components/tpo/tpo-new-followup-modal";
import {TPO_TOPBAR_QUICK_LINKS} from "@/modules/placements/tpo-topbar-links";
export function TpoTopbarNewMenu({collegeId}:{collegeId:string}){
 const pathname=usePathname(),query=useSearchParams();
 const companyName=pathname==="/tpo/companies"?(query.get("name")||"").trim().slice(0,150):"";
 const companyPrefix=companyName?" for "+companyName:"";
 const navClass="block min-h-10 rounded px-2 py-2 text-sm text-primary-text hover:bg-primary-subtle";
 const links=companyName?[{
  label:"New recruiter lead"+companyPrefix,
  href:"/tpo/recruiters?add=1&company="+encodeURIComponent(companyName),
 },{
  label:"New drive"+companyPrefix,
  href:"/tpo/placements/new?company="+encodeURIComponent(companyName),
 }]:TPO_TOPBAR_QUICK_LINKS.filter(item=>item.label!=="Follow-up");
 return <Dropdown align="end" label="New placement work" trigger="+ New">
  <nav aria-label={companyName?"Create work for "+companyName:"Create placement work"}
   className="absolute right-0 z-30 min-w-60 space-y-1 rounded-md border border-border bg-surface p-2 shadow-lg">
   {links.map(item=><Link key={item.href} href={item.href} className={navClass}>{item.label}</Link>)}
   {companyName?<div role="separator" className="my-1 border-t border-border"/>:null}
   <div className={navClass}><TpoNewFollowupModal collegeId={collegeId}/></div>
  </nav>
 </Dropdown>;
}
