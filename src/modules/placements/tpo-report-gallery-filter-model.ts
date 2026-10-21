import {z} from "zod";
export const TPO_REPORT_GALLERY_GROUPS=["ALL","Overview and performance","Offers, joining and readiness gaps","Recruiter funnel and accreditation"] as const;
export const tpoReportGalleryGroupSchema=z.enum(TPO_REPORT_GALLERY_GROUPS).default("ALL");
export const tpoReportGallerySearchSchema=z.string().trim().max(80);
export function filterTpoReportGallery<T extends {heading:string;cards:readonly {title:string;description:string}[]}>(
 groups:readonly T[],query:string,selectedGroup:string="ALL",
){
 const term=query.trim().toLocaleLowerCase("en-IN");
 return groups.filter(group=>selectedGroup==="ALL"||group.heading===selectedGroup).map(group=>({
  ...group,cards:group.cards.filter(card=>
   !term||card.title.toLocaleLowerCase("en-IN").includes(term)||
   card.description.toLocaleLowerCase("en-IN").includes(term)||
   group.heading.toLocaleLowerCase("en-IN").includes(term)),
 })).filter(group=>group.cards.length>0);
}

/** Counts only displayed, matching cards; never implies a complete legacy report catalog. */
export function countVisibleTpoReportCards(groups:readonly {cards:readonly unknown[]}[]){
 return groups.reduce((total,group)=>total+group.cards.length,0);
}

/** The old LMS report directory has a deliberate order within each group.
 * The array order is authored by the directory owner, not alphabetized. The
 * legacy public export remains for old callers but must not shuffle cards. */
export function alphabetizeTpoReportGallery<T extends {heading:string;cards:readonly {title:string;path:string}[]}>(
 groups:readonly T[],
){
 return groups.map(group=>({...group,cards:[...group.cards]}));
}
