import {createHmac,timingSafeEqual} from "node:crypto";

export const RECRUITER_MAIL_FIRST_UNREAD_MS=15*60_000;
export const RECRUITER_MAIL_QUIET_MS=2*60_000;
export const RECRUITER_MAIL_MAX_WAIT_MS=45*60_000;
export const RECRUITER_MAIL_COOLDOWN_MS=6*60*60_000;

export type RecruiterReminderWindow={
 firstUnreadAt:Date;lastMessageAt:Date;lastSentAt:Date|null;now:Date;
};
export function isRecruiterUnreadReminderDue(value:RecruiterReminderWindow){
 const first=value.firstUnreadAt.getTime(),last=value.lastMessageAt.getTime(),
  now=value.now.getTime(),sent=value.lastSentAt?.getTime()??null;
 if(![first,last,now].every(Number.isFinite)||last<first||now<last)return false;
 if(sent!==null&&(!Number.isFinite(sent)||now-sent<RECRUITER_MAIL_COOLDOWN_MS))return false;
 return now-first>=RECRUITER_MAIL_FIRST_UNREAD_MS &&
  (now-last>=RECRUITER_MAIL_QUIET_MS||now-first>=RECRUITER_MAIL_MAX_WAIT_MS);
}
/** Never pass uncontrolled HTML/control characters into ZeptoMail template variables. */
export function safeRecruiterEmailMergeText(value:string,limit=4000){
 return value.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,limit)
   .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
   .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
export function safeRecruiterDigestMessages(messages:readonly {body:string}[]){
 return messages.slice(-3).map(row=>safeRecruiterEmailMergeText(row.body));
}
/** Stable, opaque per-thread address: older unread digest emails remain replyable.
 * The secret lives only in worker config; we persist only the derived token hash.
 */
export function recruiterReplyTokenForThread(secret:string,threadId:string):string|null{
 if(Buffer.byteLength(secret,"utf8")<32||!/^([0-9a-f]{8}-){1}[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(threadId))
  return null;
 return createHmac("sha256",secret).update("recruiter-reply:v1:"+threadId.toLowerCase()).digest("hex").slice(0,32);
}
export function makeRecruiterReplyAddress(token:string,domain:string):string|null{
 if(!/^[a-f0-9]{32}$/.test(token)||!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(domain))return null;
 return "r-"+token+"@"+domain.toLowerCase();
}
export function recruiterMailBridgeSignature(secret:string,rawBody:string):string{
 return createHmac("sha256",secret).update(rawBody,"utf8").digest("hex");
}
export function verifyRecruiterMailBridgeSignature(secret:string,body:string,supplied:string){
 if(Buffer.byteLength(secret,"utf8")<32||!/^[a-f0-9]{64}$/i.test(supplied))return false;
 const expected=Buffer.from(recruiterMailBridgeSignature(secret,body),"hex");
 return timingSafeEqual(expected,Buffer.from(supplied,"hex"));
}

/** Plain-text email replies can contain full quoted recruiter/TPO history.
 * Admit only the human's new message, not mail headers or earlier participants'
 * private conversation text. An all-quoted reply is not a message.
 */
export function extractRecruiterEmailReply(raw:string):string|null{
 if(typeof raw!=="string"||raw.length>20_000)return null;
 const lines=raw.replace(/\r\n?/g,"\n").split("\n");
 const reply:string[]=[];
 for(const line of lines){
  const trimmed=line.trim();
  if(/^On .{8,240} wrote:$/i.test(trimmed)||trimmed==="-----Original Message-----"||
     trimmed==="-- Forwarded message --"||/^From:\s+.{3,}$/i.test(trimmed)||
     /^>/.test(trimmed)||/^_{8,}$/.test(trimmed)||trimmed==="--" )break;
  reply.push(line.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,""));
 }
 const body=reply.join("\n").trim();
 return body.length>=1&&body.length<=4000?body:null;
}
