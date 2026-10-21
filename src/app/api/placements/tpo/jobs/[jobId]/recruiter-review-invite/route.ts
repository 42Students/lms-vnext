import {NextResponse} from "next/server";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementJobs,placementCompanyRelationships,placementCompanies,
 placementTpoLeads,placementTpoLeadActivities,activityEvents} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requireTpoJobCollege} from "@/modules/placements/tpo-job-write-base";
import {placementJobIdSchema} from "@/modules/placements/validation";
import {tpoCrmTablesReady} from "@/modules/placements/tpo-crm-storage-readiness";
import {issueTpoRecruiterInvite} from "@/modules/placements/tpo-recruiter-invite-service";
import {deliverTpoRecruiterInviteEmail} from "@/modules/placements/tpo-recruiter-invite-email-delivery";
import {PlacementsServiceError} from "@/modules/placements/errors";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Ctx={params:Promise<{jobId:string}>};
const requestSchema=z.strictObject({
 confirmed:z.literal(true),
 name:z.string().trim().min(2).max(150),
 email:z.email().max(150).transform(value=>value.toLowerCase()),
 note:z.string().trim().max(1000).default(""),
 includePublicLink:z.boolean().default(false),
 sendEmail:z.boolean().default(false),
});
const headers={"Cache-Control":"private, no-store"} as const;

/** Recruiter reviewer invitations must be attached to the exact employer
 * relationship on this drive. A company name alone is NEVER a grant. */
async function scoped(requestCtx:Awaited<ReturnType<typeof getCurrentRequestContext>>,
 rawJobId:string) {
 if(!requestCtx.membership||!hasMembershipRole(requestCtx,"TPO"))
  throw new AuthorizationError("placements.manage");
 const collegeId=await requireTpoJobCollege(requestCtx);
 const jobId=placementJobIdSchema.parse(rawJobId);
 const [row]=await getDb().select({
  id:placementJobs.id,title:placementJobs.title,
  companyId:placementCompanies.id,companyName:placementCompanies.name,
  primaryDomain:placementCompanies.primaryDomain,
  verifiedAt:placementCompanies.verifiedAt,
  relationshipId:placementCompanyRelationships.id,
 }).from(placementJobs)
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,collegeId),
   eq(placementCompanyRelationships.status,"ACTIVE")))
  .innerJoin(placementCompanies,and(
   eq(placementCompanies.id,placementCompanyRelationships.companyId),
   eq(placementCompanies.status,"ACTIVE")))
  .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId)))
  .limit(1);
 if(!row)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 return {job:row,collegeId};
}
export async function GET(_request:Request,{params}:Ctx) {
 try{
  const context=await getCurrentRequestContext();
  const {job}=await scoped(context,(await params).jobId);
  return NextResponse.json({jobTitle:job.title,companyName:job.companyName,
   verifiedDomain:job.verifiedAt?job.primaryDomain:null,
   canInvite:Boolean(job.verifiedAt&&job.primaryDomain),
   // No standalone public URL exists for this scoped drive. Never publish a
   // guessed URL or silently turn an authenticated recruiter page public.
   publicLinkAvailable:false},{headers});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:Ctx) {
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers});
 if(!await tpoCrmTablesReady())
  return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503,headers});
 try{
  const context=await getCurrentRequestContext();
  const {job,collegeId}=await scoped(context,(await params).jobId);
  const body=requestSchema.parse(await request.json());
  const emailDomain=body.email.split("@").at(-1)?.toLowerCase()??"";
  if(!job.verifiedAt||!job.primaryDomain)
   return NextResponse.json({error:"COMPANY_DOMAIN_UNVERIFIED",
    message:"Verify the company work domain before inviting a reviewer."},
    {status:409,headers});
  if(emailDomain!==job.primaryDomain.trim().toLowerCase())
   return NextResponse.json({error:"RECRUITER_EMAIL_DOMAIN_MISMATCH",
    message:"The work email must match the verified company domain."},
    {status:400,headers});
  const leadId=await getDb().transaction(async tx=>{
   const [old]=await tx.select({
    id:placementTpoLeads.id,relationshipId:placementTpoLeads.companyRelationshipId,
   }).from(placementTpoLeads).where(and(
    eq(placementTpoLeads.collegeId,collegeId),
    eq(placementTpoLeads.emailNorm,body.email))).for("update").limit(1);
   if(old&&old.relationshipId&&old.relationshipId!==job.relationshipId)
    throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
   if(old){
    if(!old.relationshipId)await tx.update(placementTpoLeads)
     .set({companyRelationshipId:job.relationshipId,updatedAt:new Date()})
     .where(eq(placementTpoLeads.id,old.id));
    await tx.insert(placementTpoLeadActivities).values({
     collegeId,leadId:old.id,type:"NOTE",isSystem:false,
     note:"Drive review requested for "+job.title+(body.note?" — "+body.note:""),
     createdByUserId:context.user.id,
    });
    return old.id;
   }
   const [created]=await tx.insert(placementTpoLeads).values({
    collegeId,companyRelationshipId:job.relationshipId,
    name:body.name,emailNorm:body.email,companyName:job.companyName,
    source:"COLD_OUTREACH",ownerMembershipId:context.membership!.id,
   }).onConflictDoNothing().returning({id:placementTpoLeads.id});
   if(!created)throw new PlacementsServiceError("PLACEMENT_REQUEST_CONFLICT");
   await tx.insert(placementTpoLeadActivities).values({
    collegeId,leadId:created.id,type:"NOTE",isSystem:false,
    note:"Drive reviewer invited to "+job.title+(body.note?" — "+body.note:""),
    createdByUserId:context.user.id,
   });
   return created.id;
  });
  // Existing invite-issuance service owns credential hashing, audit and
  // provider delivery. Never duplicate or log a bearer token in this route.
  const mailReady=process.env.TPO_RECRUITER_INVITE_EMAIL_READY==="VERIFIED";
  const invite=await issueTpoRecruiterInvite(context,collegeId,leadId,new Date(),{
   sendEmail:body.sendEmail&&mailReady,
   deliver:deliverTpoRecruiterInviteEmail,
  });
  const manualPath="/recruiter-invite/"+invite.token;
  const letter="Hello "+body.name+",\n\n"+body.note+
   (body.note?"\n\n":"")+"Please review "+job.title+
   " at "+job.companyName+".\nOpen your secure invitation: "+
   manualPath+"\n\nRegards,\nPlacement Cell";
  // The secure invite grants no unauthenticated/public job visibility. The
  // optional public-link request is surfaced as unavailable, not fabricated.
  return NextResponse.json({
   issued:true,emailed:invite.emailed,leadId,
   email:body.email,name:body.name,expiresAt:invite.expiresAt,
   secureInvitePath:manualPath,manualSubject:"Review placement drive: "+job.title,
   manualLetter:letter,
   publicLinkIncluded:false,
   publicLinkUnavailable:body.includePublicLink,
   emailDeliveryAvailable:mailReady,
  },{headers});
 }catch(error){return apiErrorResponse(error);}
}
