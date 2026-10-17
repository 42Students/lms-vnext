export type LearnerCollegeNoticePreview={id:string;title:string;createdAt:string;isPinned:boolean};
/** Preview only a subset of already audience-filtered, persisted college notices. */
export function learnerRecentCollegeNoticePreview<T extends LearnerCollegeNoticePreview>(rows:readonly T[],limit=3):T[]{
 if(!Number.isSafeInteger(limit)||limit<1||limit>5)throw new Error("INVALID_PREVIEW_LIMIT");
 return [...rows].sort((a,b)=>{
  if(a.isPinned!==b.isPinned)return a.isPinned?-1:1;
  const time=(value:string)=>{const parsed=Date.parse(value);return Number.isFinite(parsed)?parsed:0;};
  return time(b.createdAt)-time(a.createdAt)||a.id.localeCompare(b.id);
 }).slice(0,limit);
}

/** Only persisted timestamps support relative labels; never guess event times. */
export function learnerNoticeRelativeDay(value:string|Date,now:Date){
 const instant=new Date(value).getTime(),today=now.getTime();
 if(!Number.isFinite(instant)||!Number.isFinite(today))return "Date unavailable";
 const days=Math.max(0,Math.floor((today-instant)/86_400_000));
 return days===0?"Today":days===1?"Yesterday":days+" days ago";
}
