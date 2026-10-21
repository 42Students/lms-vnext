import "server-only";
import { and,desc,eq,gt,isNull,sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
 activityEvents,collegeMemberships,colleges,inAppNotifications,membershipRoles,
 placementPublicEnquiryChallenges,placementPublicPageSettings,placementPublicRecruitEnquiries,
 placementTpoLeadActivities,placementTpoLeads,users,
} from "@/db/schema";
import { publicRecruiterWorkEmailSchema } from "../public-college-join-model";
import { normalizedTpoLeadPhoneSchema } from "../tpo-crm-validation";
import { publicEnquiryTablesReady } from "./readiness";
import { enquiryMacMatches } from "./otp-model";
import { publicEnquiryNetworkTag,PublicEnquiryError } from "./send-service";

export const publicRecruitEnquirySchema=z.strictObject({
 email:publicRecruiterWorkEmailSchema.max(150),code:z.string().regex(/^[0-9]{6}$/),
 name:z.string().trim().min(1).max(120),company:z.string().trim().max(150).default(""),
 mobile:normalizedTpoLeadPhoneSchema,
 hiringFor:z.string().trim().max(1500),
});
export async function submitPublicRecruitEnquiry(collegeId:string,raw:unknown,verifiedIp:string|null){
 const parsed=publicRecruitEnquirySchema.safeParse(raw);
 if(!parsed.success||!z.string().uuid().safeParse(collegeId).success)
  throw new PublicEnquiryError("INVALID");
 if(process.env.DB09_TPO_API_READY!=="DB09_VERIFIED"||!await publicEnquiryTablesReady())
  throw new PublicEnquiryError("NOT_READY");
 const secret=process.env.TPO_RECRUITER_OTP_HMAC_SECRET??"";
 const ipTag=publicEnquiryNetworkTag(verifiedIp,secret);
 const ready=await getDb().execute<{ready:boolean}>(sql`select to_regclass('public.placement_public_enquiry_rate_events') is not null as ready`);
 if(ready.rows[0]?.ready!==true)throw new PublicEnquiryError("NOT_READY");
 const {email,code,name,company,mobile,hiringFor}=parsed.data;
 const outcome=await getDb().transaction(async tx=>{
  const now=new Date(),hourAgo=new Date(now.getTime()-3600000);
  const [page]=await tx.select({id:colleges.id,organizationId:colleges.organizationId})
   .from(placementPublicPageSettings).innerJoin(colleges,
    eq(colleges.id,placementPublicPageSettings.collegeId))
   .where(and(eq(colleges.id,collegeId),eq(colleges.status,"ACTIVE"),
    eq(placementPublicPageSettings.enabled,true))).for("update").limit(1);
  if(!page)return "DENIED";
  const sends=await tx.execute<{n:number}>(sql`select count(*)::integer as n
   from placement_public_enquiry_rate_events where ip_hash=${ipTag}::varchar
    and action='RECRUIT' and created_at>=${hourAgo}::timestamptz`);
  if((sends.rows[0]?.n??0)>=30)return "LIMIT";
  await tx.execute(sql`insert into placement_public_enquiry_rate_events(college_id,ip_hash,action)
   values(${collegeId}::uuid,${ipTag}::varchar,'RECRUIT')`);
  const [challenge]=await tx.select().from(placementPublicEnquiryChallenges)
   .where(and(eq(placementPublicEnquiryChallenges.collegeId,collegeId),
    eq(placementPublicEnquiryChallenges.workEmail,email)))
   .orderBy(desc(placementPublicEnquiryChallenges.requestedAt),
    desc(placementPublicEnquiryChallenges.id)).for("update").limit(1);
  if(!challenge||challenge.verifiedAt||challenge.expiresAt<=now||challenge.attempts>=5)
   return "DENIED";
  if(!enquiryMacMatches(challenge.codeHash,challenge.id,email,code,secret)){
   await tx.update(placementPublicEnquiryChallenges)
    .set({attempts:challenge.attempts+1}).where(eq(placementPublicEnquiryChallenges.id,challenge.id));
   return "DENIED";
  }
  // The challenge and enquiry must commit together, preventing code replay.
  const [consumed]=await tx.update(placementPublicEnquiryChallenges).set({verifiedAt:now})
   .where(and(eq(placementPublicEnquiryChallenges.id,challenge.id),
    isNull(placementPublicEnquiryChallenges.verifiedAt)))
   .returning({id:placementPublicEnquiryChallenges.id});
  if(!consumed)throw new PublicEnquiryError("INVALID");
  const [enquiry]=await tx.insert(placementPublicRecruitEnquiries).values({
   collegeId,challengeId:challenge.id,fullName:name,companyName:company,
   message:hiringFor.length>=10?hiringFor:"Recruiter reached out through the public placements page.",
  }).returning({id:placementPublicRecruitEnquiries.id});
  if(!enquiry)throw new PublicEnquiryError("INVALID");
  const [created]=await tx.insert(placementTpoLeads).values({
   collegeId,name,emailNorm:email,phoneNorm:mobile,companyName:company,
   source:"COMPANY_REACHED_OUT",
  }).onConflictDoNothing().returning({id:placementTpoLeads.id});
  const [lead]=created?[created]:await tx.select({id:placementTpoLeads.id})
   .from(placementTpoLeads).where(and(eq(placementTpoLeads.collegeId,collegeId),
    eq(placementTpoLeads.emailNorm,email))).limit(1);
  if(!lead)throw new PublicEnquiryError("INVALID");
  await tx.insert(placementTpoLeadActivities).values({
   collegeId,leadId:lead.id,type:"SYSTEM",isSystem:true,
   note:"Recruiter reached out through public placements",
   createdAt:now,
  });
  const [event]=await tx.insert(activityEvents).values({
   organizationId:page.organizationId,collegeId,module:"PLACEMENTS",
   eventType:"RECRUIT_FROM_US",subjectType:"placement_tpo_lead",
   subjectId:lead.id,subjectLabel:"Recruiter enquiry",
   summary:name+" wants to recruit from you",
   metadata:{leadId:lead.id,enquiryId:enquiry.id},
  }).returning({id:activityEvents.id});
  if(!event)throw new PublicEnquiryError("INVALID");
  const recipients=await tx.selectDistinct({userId:collegeMemberships.userId})
   .from(collegeMemberships).innerJoin(membershipRoles,
     eq(membershipRoles.membershipId,collegeMemberships.id))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.status,"ACTIVE"),eq(membershipRoles.role,"TPO"),
    eq(users.platformStatus,"ACTIVE")));
  if(recipients.length)await tx.insert(inAppNotifications).values(
   recipients.map(r=>({userId:r.userId,eventId:event.id,
    title:name+" wants to recruit from you",
    body:"A company contacted your placement cell through the public page.",
    actionHref:"/tpo/recruiters/"+encodeURIComponent(lead.id)}))).onConflictDoNothing();
  return "DONE";
 });
 if(outcome==="LIMIT")throw new PublicEnquiryError("LIMIT");
 if(outcome!=="DONE")throw new PublicEnquiryError("INVALID");
 return {received:true as const};
}
