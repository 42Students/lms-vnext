import {z} from "zod";
export const HR_TEAM_PAGE_SIZE=25;
export const hrTeamPageSchema=z.coerce.number().int().min(1).max(10000).default(1);
export function hrTeamPage<T>(rows:readonly T[],page:number){
 const total=rows.length;
 const pages=Math.ceil(total/HR_TEAM_PAGE_SIZE);
 // A saved Team page can become out of range after filtering or a colleague
 // leaves. Recover to the nearest real page; do not show false "no members".
 const current=Number.isSafeInteger(page)&&page>0
  ?Math.min(page,Math.max(1,pages)):1;
 const first=(current-1)*HR_TEAM_PAGE_SIZE;
 return {rows:rows.slice(first,first+HR_TEAM_PAGE_SIZE),page:current,pages,total,
  first:first>=total?0:first+1,last:Math.min(total,first+HR_TEAM_PAGE_SIZE)};
}
