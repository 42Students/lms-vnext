import "server-only";
import {createHash} from "node:crypto";
import {and,asc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoMessageThreads} from "@/db/schema/tpo-collaboration";
import type {RequestContext} from "@/modules/identity/context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {z} from "zod";

const querySchema=z.strictObject({
 collegeId:z.string().uuid(),
 threadId:z.string().uuid().optional(),
});
/** Stable fingerprint: thread creation and any message update change it. */
export function recruiterConversationPulseSignature(rows:readonly {
 id:string;lastMessageAt:Date|null;createdAt:Date;
}[]):string{
 const sorted=[...rows].sort((a,b)=>a.id.localeCompare(b.id));
 return createHash("sha256").update(JSON.stringify(sorted.map(row=>[
  row.id,row.createdAt.toISOString(),row.lastMessageAt?.toISOString()??null,
 ]))).digest("hex");
}

/** REC-calendar-messages-profile-13: read-only scoped pulse, no read receipts. */
export async function getRecruiterConversationPulse(context:RequestContext,raw:unknown){
 const {collegeId,threadId}=querySchema.parse(raw);
 if(!hasActiveRecruiter(context)||!context.recruiter||
    context.recruiter.userId!==context.user.id)
  throw new Error("RECRUITER_CONVERSATION_ACCESS_DENIED");
 const grant=context.recruiter.grants.find(g=>g.collegeId===collegeId);
 if(!grant)throw new Error("RECRUITER_CONVERSATION_ACCESS_DENIED");
 requirePermission(context,"placements.recruiter.read",{collegeId,
   placementCompanyRelationshipId:grant.companyRelationshipId});
 const rows=await getDb().select({
  id:placementTpoMessageThreads.id,
  createdAt:placementTpoMessageThreads.createdAt,
  lastMessageAt:placementTpoMessageThreads.lastMessageAt,
 }).from(placementTpoMessageThreads).where(and(
  eq(placementTpoMessageThreads.recruiterUserId,context.user.id),
  eq(placementTpoMessageThreads.collegeId,collegeId),
  ...(threadId?[eq(placementTpoMessageThreads.id,threadId)]:[]),
 )).orderBy(asc(placementTpoMessageThreads.id));
 if(threadId&&rows.length!==1)throw new Error("RECRUITER_CONVERSATION_NOT_FOUND");
 return {version:recruiterConversationPulseSignature(rows)};
}
