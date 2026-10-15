import {z} from "zod";
export const tpoReportGallerySearchSchema=z.string().trim().max(80);
export function filterTpoReportGallery<T extends {heading:string;cards:readonly {title:string;description:string}[]}>(
 groups:readonly T[],query:string,
){
 const term=query.trim().toLocaleLowerCase("en-IN");
 return groups.map(group=>({
  ...group,cards:group.cards.filter(card=>
   !term||card.title.toLocaleLowerCase("en-IN").includes(term)||
   card.description.toLocaleLowerCase("en-IN").includes(term)||
   group.heading.toLocaleLowerCase("en-IN").includes(term)),
 })).filter(group=>group.cards.length>0);
}
