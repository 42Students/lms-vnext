import {z} from "zod";
export const learnerNoticeSortSchema=z.enum(["pinned","latest","oldest"]);
export type LearnerNoticeSort=z.infer<typeof learnerNoticeSortSchema>;
/** Sorting is client-local over the membership-visible, capped announcement list. */
export function sortLearnerNotices<T extends {id:string;isPinned:boolean;createdAt:string}>(rows:readonly T[],sort:LearnerNoticeSort):T[]{
 const timestamp=(row:T)=>{const parsed=Date.parse(row.createdAt);return Number.isFinite(parsed)?parsed:0;};
 return [...rows].sort((a,b)=>{
  if(sort==="pinned"&&a.isPinned!==b.isPinned)return a.isPinned?-1:1;
  const order=sort==="oldest"?timestamp(a)-timestamp(b):timestamp(b)-timestamp(a);
  return order||a.id.localeCompare(b.id);
 });
}
