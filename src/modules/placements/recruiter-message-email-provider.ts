import "server-only";
import {outboundFetch} from "@/lib/outbound";
import {canContactRecipientAtRuntime} from "@/modules/messaging/runtime-safety";
import {normalizeRecipient} from "@/modules/messaging/model";
import {readZeptoMailConfig} from "@/modules/notifications/zeptomail-email";
import {isCampaignTemplateKey} from "@/modules/messaging/template-boundary-model";
import {safeRecruiterDigestMessages,safeRecruiterEmailMergeText,isRecruiterReplyAddress} from "./recruiter-message-email-model";

export type RecruiterMailDigest={
 recipient:string;recipientName:string;companyName:string;collegeName:string;
 replyTo:string;messages:readonly {body:string}[];
};
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
 try{
  const excerpts=safeRecruiterDigestMessages(digest.messages);
  const response=await outboundFetch(config.apiUrl,{
   method:"POST",
   // Reject redirects; the provider Authorization header and private digest
   // must never be forwarded to a different destination.
   redirect:"error",
   headers:{Authorization:config.token,"Content-Type":"application/json",Accept:"application/json"},
   body:JSON.stringify({
    template_key:key,from:{address:config.fromAddress,name:config.fromName},
    to:[{email_address:{address:recipient,name:digest.recipientName}}],
    reply_to:[{address:digest.replyTo}],
    merge_info:{name:safeRecruiterEmailMergeText(digest.recipientName,160),
      college:safeRecruiterEmailMergeText(digest.collegeName,160),
      company:safeRecruiterEmailMergeText(digest.companyName,160),
      message1:excerpts[0]??"",
      message2:excerpts[1]??"",
      message3:excerpts[2]??"",
    },
   }),
   timeoutMs:10_000,maxAttempts:1,fetchImpl,
  });
  return response.ok;
 }catch{return false;}
}
