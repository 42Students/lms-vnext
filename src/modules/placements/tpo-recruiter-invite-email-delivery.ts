import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,placementTpoLeads} from "@/db/schema";
import {createOutboundProvider,readOutboundProviderConfig} from "@/modules/messaging/providers";
import {isCampaignTemplateKey} from "@/modules/messaging/template-boundary-model";

/** Existing messaging provider enforces non-production recipient allowlisting.
 * Delivery is explicitly gated; no email is attempted for an unprovisioned template.
 */
export async function deliverTpoRecruiterInviteEmail(collegeId:string,leadId:string,token:string){
 const template=process.env.TPO_RECRUITER_INVITE_ZEPTO_TEMPLATE_KEY??"";
 const origin=process.env.APP_PUBLIC_URL??"";
 if(process.env.TPO_RECRUITER_INVITE_EMAIL_READY!=="VERIFIED"||
   !isCampaignTemplateKey(template)||template===process.env.ZEPTOMAIL_OTP_TEMPLATE_KEY)
  return false;
 let url:URL;
 try{url=new URL(origin);}catch{return false}
 if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash)return false;
 const [lead]=await getDb().select({
  email:placementTpoLeads.emailNorm,name:placementTpoLeads.name,
  company:placementTpoLeads.companyName,collegeName:colleges.name,
  unsubscribedAt:placementTpoLeads.unsubscribedAt,recruiterId:placementTpoLeads.recruiterUserId,
 }).from(placementTpoLeads).innerJoin(colleges,
  eq(colleges.id,placementTpoLeads.collegeId))
 .where(and(eq(placementTpoLeads.id,leadId),
  eq(placementTpoLeads.collegeId,collegeId))).limit(1);
 if(!lead?.email||lead.unsubscribedAt||lead.recruiterId)return false;
 const outbound=createOutboundProvider(readOutboundProviderConfig({
  [template]:{zeptoTemplateKey:template},
 }));
 return outbound.send({
  channel:"EMAIL",recipient:lead.email,templateKey:template,
  purpose:"tpo-recruiter-invite:"+leadId,
  variables:{
   name:lead.name,company:lead.company??"",college:lead.collegeName,
   invitationUrl:url.origin+"/recruiter-invite/"+encodeURIComponent(token),
  },
 });
}
