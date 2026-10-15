import { z } from "zod";
export const learnerOffersSearchSchema = z.string().trim().max(80);
export function searchOwnOffers<T extends {offer:{roleTitle:string};company:{name:string};job:{title:string}}>(
 rows:readonly T[], query:string
):T[]{
 const normalize=(value:string)=>value.trim().replace(/\s+/gu," ").toLocaleLowerCase("en");
 const normalized=normalize(query);
 if(!normalized)return [...rows];
 return rows.filter(row=>[row.offer.roleTitle,row.company.name,row.job.title]
   .some(value=>normalize(value).includes(normalized)));
}
