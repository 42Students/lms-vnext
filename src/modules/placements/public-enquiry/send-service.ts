import "server-only";
import { createHmac,randomUUID } from "node:crypto";
import { and,count,eq,gte,sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges,placementPublicEnquiryChallenges,placementPublicPageSettings } from "@/db/schema";
import { deliverPublicRecruiterJoinCode } from "@/modules/messaging/public-join-code-delivery";
import { publicEnquiryTablesReady } from "./readiness";
import { publicEnquirySendSchema,canSendPublicEnquiryCode,newEnquiryCode,enquiryMac,PUBLIC_ENQUIRY_TTL_MS } from "./otp-model";
import { z } from "zod";
import {publicPublicationFresh} from "../public-page/publication-freshness-model";

export class PublicEnquiryError extends Error {
 constructor(readonly code:"NOT_READY"|"INVALID"|"LIMIT"|"DELIVERY_FAILED"|"NAME_REQUIRED"){super("PUBLIC_ENQUIRY_"+code);}
}
export function publicEnquiryNetworkTag(ip:string|null,secret:string){
 if(!ip||ip.length>120||Buffer.byteLength(secret,"utf8")<32)
  throw new PublicEnquiryError("NOT_READY");
 return createHmac("sha256",secret).update("public-enquiry-ip-v1:").update(ip).digest("hex");
}
export async function sendPublicEnquiryCode(collegeId:string,raw:unknown,verifiedIp:string|null,
 deliver:(email:string,code:string)=>Promise<boolean>=deliverPublicRecruiterJoinCode){
 const input=publicEnquirySendSchema.safeParse(raw);
 if(!input.success||!z.string().uuid().safeParse(collegeId).success)
  throw new PublicEnquiryError("INVALID");
 if(process.env.DB09_TPO_API_READY!=="DB09_VERIFIED"||!await publicEnquiryTablesReady())
  throw new PublicEnquiryError("NOT_READY");
 const secret=process.env.TPO_RECRUITER_OTP_HMAC_SECRET??"";
 const network=publicEnquiryNetworkTag(verifiedIp,secret);
 const ready=await getDb().execute<{ready:boolean}>(sql`select to_regclass('public.placement_public_enquiry_rate_events') is not null as ready`);
 if(ready.rows[0]?.ready!==true)throw new PublicEnquiryError("NOT_READY");
 const {email}=input.data,code=newEnquiryCode(),challengeId=randomUUID();
 await getDb().transaction(async tx=>{
  const now=new Date(),hourAgo=new Date(now.getTime()-3600000);
  const [page]=await tx.select({id:colleges.id,
   publishedAt:placementPublicPageSettings.publishedAt,
   populationCount:placementPublicPageSettings.populationCount,
 }).from(placementPublicPageSettings)
   .innerJoin(colleges,eq(colleges.id,placementPublicPageSettings.collegeId))
   .where(and(eq(colleges.id,collegeId),eq(colleges.status,"ACTIVE"),
    eq(placementPublicPageSettings.enabled,true))).for("update").limit(1);
  if(!page||!page.publishedAt||!publicPublicationFresh(page.publishedAt,now)||
      (page.populationCount??0)<5)throw new PublicEnquiryError("INVALID");
  const [own]=await tx.select({n:count()}).from(placementPublicEnquiryChallenges).where(and(
   eq(placementPublicEnquiryChallenges.collegeId,collegeId),
   eq(placementPublicEnquiryChallenges.workEmail,email),
   gte(placementPublicEnquiryChallenges.requestedAt,hourAgo)));
  const [all]=await tx.select({n:count()}).from(placementPublicEnquiryChallenges).where(and(
   eq(placementPublicEnquiryChallenges.collegeId,collegeId),
   gte(placementPublicEnquiryChallenges.requestedAt,hourAgo)));
  const networkCount=await tx.execute<{n:number}>(sql`select count(*)::integer as n from placement_public_enquiry_rate_events
   where ip_hash=${network}::varchar and action='SEND_CODE' and created_at>=${hourAgo}::timestamptz`);
  if(!canSendPublicEnquiryCode({email:own?.n??0,college:all?.n??0,ip:networkCount.rows[0]?.n??0}))
   throw new PublicEnquiryError("LIMIT");
  await tx.insert(placementPublicEnquiryChallenges).values({
   id:challengeId,collegeId,workEmail:email,codeHash:enquiryMac(challengeId,email,code,secret),
   expiresAt:new Date(now.getTime()+PUBLIC_ENQUIRY_TTL_MS),
  });
  await tx.execute(sql`insert into placement_public_enquiry_rate_events (college_id,ip_hash,action)
   values (${collegeId}::uuid,${network}::varchar,'SEND_CODE')`);
 });
 let accepted=false;
 try{accepted=await deliver(email,code);}catch{accepted=false;}
 if(!accepted){
  await getDb().update(placementPublicEnquiryChallenges).set({expiresAt:new Date()})
   .where(eq(placementPublicEnquiryChallenges.id,challengeId));
  throw new PublicEnquiryError("DELIVERY_FAILED");
 }
 return {sent:true as const,status:"CODE_SENT" as const,email};
}
