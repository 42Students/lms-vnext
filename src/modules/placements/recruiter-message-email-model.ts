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
 const max=Math.min(4000,Math.max(0,Number.isFinite(limit)?Math.trunc(limit):4000));
 const escaped=value.replace(/[\u0000-\u001f\u007f]/g," ").trim()
   .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
   .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
 if(escaped.length<=max)return escaped;
 // Never leave a cut-off HTML character entity at the excerpt boundary.
 return escaped.slice(0,max).replace(/&(?:#[0-9]*|#x[0-9a-f]*|[a-z]*)?$/i,"");
}
/** Plain-text provider address name, not an HTML merge variable.
 * Prevent CR/LF headers, bidirectional overrides and oversized recipient names.
 */
export function safeRecruiterEmailAddressName(value:string):string{
 return value.replace(/[\\p{Cc}\\p{Cf}\\p{Zl}\\p{Zp}]+/gu," ")
  .replace(/\\s+/gu," ").trim().slice(0,160);
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
 const host=domain.toLowerCase();
 const labels=host.split(".");
 if(!/^[a-f0-9]{32}$/.test(token)||host.length>253||labels.length<2||
    !/^[a-z]{2,63}$/.test(labels[labels.length-1]!)||
    labels.some(label=>label.length===0||label.length>63||
      label.startsWith("-")||label.endsWith("-")||
      !/^[a-z0-9-]+$/.test(label)))return null;
 return "r-"+token+"@"+host;
}
/** Verify Reply-To before it leaves the outbound mail provider boundary. */
export function isRecruiterReplyAddress(value:string,domain:string):boolean{
 const parts=/^r-([a-f0-9]{32})@([a-z0-9.-]+)$/i.exec(value);
 if(!parts)return false;
 const expected=makeRecruiterReplyAddress(parts[1].toLowerCase(),domain.trim().toLowerCase());
 return expected!==null&&expected===value.toLowerCase();
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
     /^-{2,}\s*Forwarded message\s*-{2,}$/i.test(trimmed)||
     /^Begin forwarded message:\s*$/i.test(trimmed)||
     /^From:\s+.{3,}$/i.test(trimmed)||/^Sent:\s+.{3,}$/i.test(trimmed)||
     /^>/.test(trimmed)||/^_{8,}$/.test(trimmed)||trimmed==="--" )break;
  reply.push(line.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,""));
 }
 const body=reply.join("\n").trim();
 return body.length>=1&&body.length<=4000?body:null;
}
