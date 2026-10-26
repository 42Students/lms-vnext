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

/** Original Messages screenshot uses Enter to send and Shift+Enter for a new
 * line. Never treat IME composition, Alt+Enter, or Shift+Enter as a send.
 * The actual post still enforces the persisted access/empty/busy guard. */
export function shouldSendTpoRecruiterReplyKey(input:{
 key:string;shiftKey:boolean;altKey:boolean;isComposing:boolean;
}){
 return input.key==="Enter"&&!input.shiftKey&&!input.altKey&&!input.isComposing;
}
