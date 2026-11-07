"use client";
import { Dropdown } from "@/components/ui/dropdown";

import {usePathname,useSearchParams} from "next/navigation";
import {TpoNewFollowupModal} from "@/components/tpo/tpo-new-followup-modal";
import {TPO_TOPBAR_QUICK_LINKS} from "@/modules/placements/tpo-topbar-links";
import { TextLink } from "@/components/ui/text-link";
export function TpoTopbarNewMenu({collegeId}:{collegeId:string}){
 const pathname=usePathname(),query=useSearchParams();
 const companyName=pathname==="/tpo/companies"?(query.get("name")||"").replace(/\p{Cc}/gu," ").replace(/\s+/g," ").trim().slice(0,150):"";
 const companyPrefix=companyName?" for "+companyName:"";
 const navClass="flex min-h-11 w-full min-w-0 items-center rounded-[var(--lms-control-radius)] px-[var(--lms-space-3)] py-2 text-left text-[14px] leading-5 text-[var(--lms-body-text)] transition-colors duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-ring break-words [overflow-wrap:anywhere] md:min-h-9 motion-reduce:transition-none";
 const links=companyName?[{
  label:"New recruiter lead"+companyPrefix,
  href:"/tpo/recruiters?add=1&company="+encodeURIComponent(companyName),
 },{
  label:"New drive"+companyPrefix,
  href:"/tpo/placements/new?company="+encodeURIComponent(companyName),
 }]:TPO_TOPBAR_QUICK_LINKS.filter(item=>item.label!=="Follow-up");
 const actions=[...links,{label:"View all follow-ups",href:"/tpo/follow-ups"}];
 return <Dropdown align="end" label="New placement work" trigger="+ New" mobileSheet
  triggerClassName="min-h-11 w-full justify-center border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-[color:var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)] focus-ring sm:w-auto md:min-h-9">
  <div className="grid min-w-0 w-full gap-1 md:w-[min(19rem,calc(100vw_-_3rem))]">
   <nav aria-label={companyName?"Placement actions for "+companyName:"Placement actions"} className="grid gap-1">
    {actions.map(item=><TextLink variant="bare" key={item.href} href={item.href} className={navClass}>{item.label}</TextLink>)}
   </nav>
   <div className="min-w-0 border-t border-border pt-2"><TpoNewFollowupModal collegeId={collegeId}/></div>
  </div>
 </Dropdown>;
}
