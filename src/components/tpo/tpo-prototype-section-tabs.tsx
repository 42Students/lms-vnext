"use client";
import {usePathname,useSearchParams} from "next/navigation";
import {TPO_PROTOTYPE_SECTIONS,tpoPrototypeSectionForPath,tpoPrototypeTabActive} from "@/components/shell/tpo-prototype-navigation";
import { TextLink } from "@/components/ui/text-link";

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
 const isActive=(href:string)=>tpoPrototypeTabActive(pathname,search,href);
 return <nav aria-label={section+" sections"} className="min-w-0 overflow-x-auto border-b border-[color:var(--lms-border)]">
  <div className="flex w-max min-w-full items-center gap-7 px-1">
   {links.map(link=><TextLink variant="bare" href={link.href} key={link.href}
     aria-current={isActive(link.href)?"page":undefined}
     className="inline-flex min-h-11 items-center border-b-2 border-transparent px-0.5 pb-2 pt-2 text-[16px] text-[color:var(--lms-text-muted)] hover:text-[color:var(--lms-button-primary)] aria-[current=page]:border-[color:var(--lms-button-primary)] aria-[current=page]:font-bold aria-[current=page]:text-[color:var(--lms-button-primary)]">
      {link.label}
    </TextLink>)}
  </div>
 </nav>;
}
