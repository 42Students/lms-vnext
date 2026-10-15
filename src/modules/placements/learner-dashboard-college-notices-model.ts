export type LearnerCollegeNoticePreview={id:string;title:string;createdAt:string;isPinned:boolean};
/** Preview only a subset of already audience-filtered, persisted college notices. */
export function learnerRecentCollegeNoticePreview<T extends LearnerCollegeNoticePreview>(rows:readonly T[],limit=3):T[]{
 if(!Number.isSafeInteger(limit)||limit<1||limit>5)throw new Error("INVALID_PREVIEW_LIMIT");
 return [...rows].sort((a,b)=>{
  if(a.isPinned!==b.isPinned)return a.isPinned?-1:1;
  return Date.parse(b.createdAt)-Date.parse(a.createdAt)||a.id.localeCompare(b.id);
 }).slice(0,limit);
}
