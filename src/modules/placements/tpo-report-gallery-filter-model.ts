import {z} from "zod";
export const tpoReportGalleryGroupSchema=z.enum(["ALL","Overview and performance","Student outcomes","Relationships and compliance"]).default("ALL");
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
