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
export function safeRecruiterDigestMessages(messages:readonly {body:string}[]){
 return messages.slice(-3).map(row=>row.body.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,4000));
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
