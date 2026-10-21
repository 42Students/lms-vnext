import "server-only";
import {outboundFetch} from "@/lib/outbound";
import {canContactRecipientAtRuntime} from "@/modules/messaging/runtime-safety";
import {normalizeRecipient} from "@/modules/messaging/model";
import {readZeptoMailConfig} from "@/modules/notifications/zeptomail-email";
import {isCampaignTemplateKey} from "@/modules/messaging/template-boundary-model";
import {safeRecruiterDigestMessages,safeRecruiterEmailMergeText,isRecruiterReplyAddress,safeRecruiterEmailAddressName} from "./recruiter-message-email-model";

export type RecruiterMailDigest={
 recipient:string;recipientName:string;companyName:string;collegeName:string;
 replyTo:string;messages:readonly {body:string;createdAt?:Date|string;
  senderName?:string|null}[];
 /** Optional trusted context; the digest worker normally has no job. */
 jobTitle?:string;
 /** Count of unread older messages omitted from the last three excerpts. */
 earlierMessageCount?:number;
 /** Display label is separate from the opaque reply mailbox. */
 replyToName?:string;
 /** Supplied by a tenant-scoped authorization query, never a browser payload. */
 collegeId?:string;
 /** Optional college-branded header name. */
 senderName?:string;
 /** Must be provisioned in the provider-verified From allowlist. */
 fromAddress?:string;
};
/** Preserve the old 80-character mail-header limit and delimiter stripping.
 * This is a plain text display name: never allow CRLF, quotes, URL markup
 * separators or bidi overrides to enter provider header fields.
 */
export function safeRecruiterHeaderName(raw:string):string{
 const cleaned=raw.replace(/[\\p{Cc}\\p{Cf}\\p{Zl}\\p{Zp}<>",;:\\\\]+/gu," ")
  .replace(/\\s+/gu," ").trim().slice(0,80);
 return /[\\uD800-\\uDBFF]$/.test(cleaned)?cleaned.slice(0,-1):cleaned;
}
const recruiterMessageDate=new Intl.DateTimeFormat("en-GB",{
 timeZone:"Asia/Kolkata",day:"numeric",month:"short",
 hour:"numeric",minute:"2-digit",hour12:true,
});
function safeRecruiterMessageDate(date:Date|string|undefined):string{
 if(date===undefined)return "";
 const parsed=date instanceof Date?date:new Date(date);
 return Number.isFinite(parsed.getTime())?
  recruiterMessageDate.format(parsed)+" IST":"";
}
/** Operational readiness is distinct from an upstream delivery failure.
 * No secrets, template IDs or recipient data are emitted in this report.
 */
export type RecruiterDigestReadiness={
 configured:boolean;
 reason:"READY"|"BRIDGE_DISABLED"|"PROVIDER_NOT_CONFIGURED"|
  "TEMPLATE_NOT_CONFIGURED"|"REPLY_DOMAIN_INVALID";
};
export function recruiterDigestReadiness(
 env:Record<string,string|undefined>=process.env,
):RecruiterDigestReadiness{
 if(env.RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED!=="true")
  return {configured:false,reason:"BRIDGE_DISABLED"};
 const config=readZeptoMailConfig(env);
 let endpoint:URL;
 try{endpoint=new URL(config.apiUrl);}
 catch{return {configured:false,reason:"PROVIDER_NOT_CONFIGURED"};}
 if(endpoint.protocol!=="https:"||endpoint.username||endpoint.password||!config.token.trim())
  return {configured:false,reason:"PROVIDER_NOT_CONFIGURED"};
 const key=(env.RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY??"").trim();
 if(!isCampaignTemplateKey(key)||key===config.otpTemplateKey)
  return {configured:false,reason:"TEMPLATE_NOT_CONFIGURED"};
 if(!isRecruiterReplyAddress("r-"+"a".repeat(32)+"@"+(env.RECRUITER_MESSAGE_REPLY_DOMAIN??""),
  env.RECRUITER_MESSAGE_REPLY_DOMAIN??""))
  return {configured:false,reason:"REPLY_DOMAIN_INVALID"};
 return {configured:true,reason:"READY"};
}
/** A public recruiter link exists only when the origin is explicitly
 * provisioned in the HTTPS verified-host allowlist. The caller's college is
 * still checked again by the authenticated recruiter messages page.
 */
export function recruiterDigestWorkspaceUrl(
 env:Record<string,string|undefined>,collegeId?:string,
):string|null{
 const raw=(env.RECRUITER_MESSAGE_PUBLIC_BASE_URL??"").trim();
 if(!raw)return null;
 try{
  const site=new URL(raw);
  if(site.protocol!=="https:"||site.username||site.password||
   site.pathname!=="/"||site.search||site.hash)return null;
  const allowed=(env.RECRUITER_MESSAGE_VERIFIED_PUBLIC_ORIGINS??"")
   .split(",").map(item=>item.trim().toLowerCase()).filter(Boolean);
  if(!allowed.includes(site.origin.toLowerCase()))return null;
  const url=new URL("/recruiter/messages",site);
  if(collegeId&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(collegeId))
   url.searchParams.set("collegeId",collegeId);
  return url.toString();
 }catch{return null;}
}
/** REC-calendar-messages-profile-R01. No sending without a dedicated provisioned
 * non-OTP ZeptoMail template, Reply-To domain, and the global recipient allowlist.
 * A digest failure is not an acknowledgement of a placement-cell message.
 */
export async function sendRecruiterMessageDigest(
 digest:RecruiterMailDigest,env:Record<string,string|undefined>=process.env,
 fetchImpl:typeof fetch=fetch,
):Promise<boolean>{
 if(env.RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED!=="true")return false;
 const recipient=normalizeRecipient("EMAIL",digest.recipient);
 if(!canContactRecipientAtRuntime("EMAIL",recipient,env))return false;
 const config=readZeptoMailConfig(env);
 const key=(env.RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY??"").trim();
 let endpoint:URL;
 try{endpoint=new URL(config.apiUrl);}catch{return false;}
 if(endpoint.protocol!=="https:"||endpoint.username||endpoint.password)return false;
 if(!config.token.trim()||!isCampaignTemplateKey(key)||key===config.otpTemplateKey ||
    !isRecruiterReplyAddress(digest.replyTo,env.RECRUITER_MESSAGE_REPLY_DOMAIN??"")||
    digest.messages.length===0)return false;
 // A display name is allowed to vary; a From address never varies unless
 // the operator has separately marked that exact address as verified.
 const verifiedFromAddresses=[
  config.fromAddress,...(env.ZEPTOMAIL_VERIFIED_FROM_ADDRESSES??"").split(","),
 ].map(address=>normalizeRecipient("EMAIL",address)).filter(Boolean);
 const requestedFrom=digest.fromAddress?
  normalizeRecipient("EMAIL",digest.fromAddress):normalizeRecipient("EMAIL",config.fromAddress);
 if(!verifiedFromAddresses.includes(requestedFrom))return false;
 const brandedName=digest.collegeName.trim()?
  digest.collegeName+" Campus Recruitment":"Campus Recruitment";
 const senderName=safeRecruiterHeaderName(digest.senderName??brandedName)||
   safeRecruiterHeaderName(config.fromName)||"Campus Recruitment";
 const replyToName=safeRecruiterHeaderName(digest.replyToName??senderName)||"Campus Recruitment";
 const recipientName=safeRecruiterEmailAddressName(digest.recipientName)||"there";
 const displayGreeting=recipientName.trim()||"there";
 const subjectJob=(digest.jobTitle??"").trim();
 const mailSubject=safeRecruiterEmailMergeText(
  subjectJob?digest.companyName+" · "+subjectJob:"Your recruitment with us",180);
 const earlierCount=Number.isSafeInteger(digest.earlierMessageCount)&&
  (digest.earlierMessageCount??0)>0?digest.earlierMessageCount!:0;
 const earlierSummary=earlierCount>0?
  earlierCount+" earlier "+(earlierCount===1?"message":"messages")+" omitted":"";
 const workspaceUrl=recruiterDigestWorkspaceUrl(env,digest.collegeId);
 try{
  const excerpts=safeRecruiterDigestMessages(digest.messages);
  const response=await outboundFetch(config.apiUrl,{
   method:"POST",
   // Reject redirects; the provider Authorization header and private digest
   // must never be forwarded to a different destination.
   redirect:"error",
   headers:{Authorization:config.token,"Content-Type":"application/json",Accept:"application/json"},
   body:JSON.stringify({
    template_key:key,from:{address:requestedFrom,name:senderName},
    to:[{email_address:{address:recipient,name:recipientName}}],
    reply_to:[{address:digest.replyTo,name:replyToName}],
    merge_info:{name:safeRecruiterEmailMergeText(displayGreeting,160),
      college:safeRecruiterEmailMergeText(digest.collegeName,160),
      company:safeRecruiterEmailMergeText(digest.companyName,160),
      fromName:safeRecruiterEmailMergeText(senderName,80),
      senderName:safeRecruiterEmailMergeText(digest.messages.at(-1)?.senderName?.trim()||
       "Campus Recruitment Team",80),
      subject:mailSubject,
      earlierMessages:earlierSummary,
      messageCount:String(digest.messages.length+earlierCount),
      message1:excerpts[0]??"",
      message2:excerpts[1]??"",
      message3:excerpts[2]??"",
      message1When:safeRecruiterMessageDate(digest.messages.at(-3)?.createdAt),
      message2When:safeRecruiterMessageDate(digest.messages.at(-2)?.createdAt),
      message3When:safeRecruiterMessageDate(digest.messages.at(-1)?.createdAt),
      workspaceCta:workspaceUrl?"Open recruiter messages":
       "Sign in to your recruiter workspace to review messages",
      ...(workspaceUrl?{workspaceUrl}:{}),
    },
   }),
   timeoutMs:10_000,maxAttempts:1,fetchImpl,
  });
  return response.ok;
 }catch{return false;}
}
