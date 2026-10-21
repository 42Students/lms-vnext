export type LearnerPlacementNoticeSource = {
  id: string;
  title: string;
  message: string;
  createdAt: Date | null;
  updatedAt?: Date | null;
  updated?: boolean;
  version?: number;
  isPinned: boolean;
  senderType?: string;
  receiverType?: string;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
  jobId?: string | null;
  unread?: boolean | null;
  authorName?: string | null;
  showUntil?: Date | null;
  linkUrl?: string | null;
  forYou?: boolean | null;
};

/** Only recognize persisted producer/audience enums, never infer a TPO-only notice. */
export function learnerNoticeSourceLabel(value:string):string|null{
 switch(value){
  case "TPO":return "Placement cell";
  case "COLLEGE_ADMIN":return "College administration";
  case "SUPER_ADMIN":return "Platform administration";
  case "FACULTY":return "Faculty";
  default:return null;
 }
}
export function learnerNoticeAudienceLabel(value:string):string|null{
 switch(value){
  // A broadcast to ALL/PLACEMENTS is not a personalised "For you" notice.
  case "COLLEGE":return null;
  case "DEPARTMENT":return "Department";
  case "PROGRAM":return "Program";
  case "CLASS":return "Class";
  case "LEARNER":return "You";
  default:return null;
 }
}
/** Never infer notice actions from HTML or text. Only allow explicit HTTPS destinations. */
export function safeLearnerNoticeAction(label: string | null | undefined, url: string | null | undefined) {
  const clean = label?.trim() ?? "";
  if (!clean || clean.length > 60 || !url || !url.startsWith("https://")) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && Boolean(parsed.hostname) &&
      !parsed.username && !parsed.password && !parsed.hash
      ? { buttonLabel: clean, buttonUrl: parsed.toString() } : null;
  } catch {
    return null;
  }
}
/** Safe external URLs discovered in plain body text, not interpreted as HTML. */
export function learnerNoticeBodyLinks(message:string) {
 const results:string[]=[];
 for(const match of message.matchAll(/https:\/\/[^\s<>"']+/g)){
  const raw=match[0].replace(/[.,;:!?)}\]]+$/g,"");
  try{
   const url=new URL(raw);
   if(url.protocol==="https:"&&url.hostname&&!url.username&&!url.password)
    results.push(url.toString());
  }catch{/* Untrusted text is always rendered as text. */}
 }
 return [...new Set(results)];
}

export function learnerPlacementNoticeFeed(rows: readonly LearnerPlacementNoticeSource[]) {
 return rows.map(row=>{
  const dateValid=row.createdAt instanceof Date&&Number.isFinite(row.createdAt.getTime());
  const updatedValid=row.updatedAt instanceof Date&&Number.isFinite(row.updatedAt.getTime());
  const updated=updatedValid&&(row.updated===true||
   (typeof row.version==="number"&&row.version>1)||
   (dateValid&&row.updatedAt!.getTime()!==row.createdAt!.getTime()));
  const message=row.message??"";
  const explicitAction=safeLearnerNoticeAction(row.buttonLabel,row.buttonUrl??row.linkUrl);
  return {
   id:row.id,
   title:row.title,
   message,
   createdAt:dateValid?row.createdAt!.toISOString():"",
   publicationDateUnavailable:!dateValid,
   updatedAt:updated?row.updatedAt!.toISOString():null,
   isPinned:row.isPinned,
   unread:row.unread??null,
   authorName:row.authorName?.trim()||null,
   showUntil:row.showUntil instanceof Date&&Number.isFinite(row.showUntil.getTime())
    ?row.showUntil.toISOString():null,
   bodyLinks:learnerNoticeBodyLinks(message),
   ...(row.jobId&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(row.jobId)
    ?{jobId:row.jobId,driveHref:"/learn/my-placements/jobs/"+encodeURIComponent(row.jobId)}:{}),
   ...(explicitAction??{}),
   ...(row.senderType?{senderLabel:learnerNoticeSourceLabel(row.senderType)}:{}),
   ...(row.forYou===true?{audienceLabel:"You"}:
     row.receiverType?{audienceLabel:learnerNoticeAudienceLabel(row.receiverType)}:{}),
  };
 });
}
