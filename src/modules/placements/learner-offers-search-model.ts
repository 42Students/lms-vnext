import { z } from "zod";
export const learnerOffersSearchSchema = z.string().trim().max(80);
export function searchOwnOffers<T extends {offer:{roleTitle:string};company:{name:string};job:{title:string}}>(
 rows:readonly T[], query:string
):T[]{
 const normalized=query.trim().toLocaleLowerCase("en");
 if(!normalized)return [...rows];
 return rows.filter(row=>[row.offer.roleTitle,row.company.name,row.job.title]
   .some(value=>value.toLocaleLowerCase("en").includes(normalized)));
}
