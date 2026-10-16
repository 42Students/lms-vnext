/** Legacy reply shortcuts are text-only; never append tokens or recipient addresses. */
export const TPO_QUICK_REPLIES=[
 "Thanks, noted.",
 "Will confirm by end of day.",
 "Please share the updated list.",
 "Can we talk today?",
] as const;
/** Owner isolation prevents a second signed-in user from reading another's draft. */
export function recruiterMessageDraftKey(actorUserId:string,threadId:string){
 if(!/^[0-9a-f-]{36}$/i.test(actorUserId)||!/^[0-9a-f-]{36}$/i.test(threadId))
   throw new Error("INVALID_DRAFT_ID");
 return "tpo:recruiter-message:draft:"+actorUserId+":"+threadId;
}
