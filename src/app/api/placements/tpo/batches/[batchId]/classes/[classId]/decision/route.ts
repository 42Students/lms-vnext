import {z} from "zod";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {sections} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoBatch} from "@/modules/placements/tpo-batch-workspace-read-service";
import {decidePlacementParticipation} from "@/modules/placements/batch-participation-service";
export const runtime="nodejs";
const command=z.discriminatedUnion("decision",[
 z.strictObject({decision:z.literal("ELIGIBLE"),expectedVersion:z.string().min(1)}),
 z.strictObject({decision:z.literal("INELIGIBLE"),reason:z.string().trim().min(3).max(200),expectedVersion:z.string().min(1)}),
 z.strictObject({decision:z.literal("NOT_DECIDED"),expectedVersion:z.string().min(1)}),
]);
export async function POST(request:Request,{params}:{params:Promise<{batchId:string;classId:string}>}){
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const ctx=await getCurrentRequestContext(),{batchId,classId}=await params;
  z.uuid().parse(classId);
  const {collegeId,ready,lifecycle}=await getTpoBatch(ctx,batchId);
  if(!ready)return Response.json({error:"BATCH_STORAGE_UNAVAILABLE"},{status:503});
  if(lifecycle?.finishedAt)return Response.json({error:"BATCH_FINISHED"},{status:409});
  const [section]=await getDb().select({id:sections.id}).from(sections)
    .where(and(eq(sections.id,classId),eq(sections.cohortId,batchId),eq(sections.status,"ACTIVE"))).limit(1);
  if(!section)return Response.json({error:"CLASS_NOT_IN_BATCH"},{status:404});
  const input=command.parse(await request.json());
  const outcome=await decidePlacementParticipation(ctx,{collegeId,expectedCohortId:batchId,changes:[{
   scopeType:"SECTION",scopeId:section.id,status:input.decision,
   expectedVersion:input.expectedVersion,
   reason:input.decision==="INELIGIBLE"?input.reason:null,
  }]});
  return Response.json(outcome,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
