import {z} from "zod";
export const tpoRegistrationSortSchema=z.enum(["NAME_ASC","NAME_DESC","UPDATED_NEWEST","UPDATED_OLDEST"]).default("NAME_ASC");
export function sortTpoBatchRegistrationRows<T extends {membershipId:string;name:string;updatedAt:string|null}>(rows:readonly T[],order:z.infer<typeof tpoRegistrationSortSchema>):T[]{
 return [...rows].sort((a,b)=>{
  if(order==="UPDATED_NEWEST"||order==="UPDATED_OLDEST"){
   const ta=a.updatedAt?Date.parse(a.updatedAt):NaN,tb=b.updatedAt?Date.parse(b.updatedAt):NaN;
   const va=Number.isFinite(ta),vb=Number.isFinite(tb);
   if(va!==vb)return va?-1:1;
   if(va&&vb&&ta!==tb)return order==="UPDATED_NEWEST"?tb-ta:ta-tb;
  }
  const byName=order==="NAME_DESC"?b.name.localeCompare(a.name,"en-IN"):a.name.localeCompare(b.name,"en-IN");
  return byName||a.membershipId.localeCompare(b.membershipId);
 });
}
