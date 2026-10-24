import { NextResponse } from "next/server";
import {z} from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import {recruiterConversationPulseColleges} from "@/modules/placements/recruiter-conversation-pulse-scope-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getDb } from "@/db/client";
import { apiErrorResponse } from "@/lib/api-error";
import { placementTpoMessages, placementTpoMessageThreads } from "@/db/schema/tpo-collaboration";
import { hasActiveRecruiter } from "@/modules/identity/context";

export const runtime = "nodejs";

/** Scoped lightweight recruiter inbox pulse. No message bodies or foreign
 * college threads are returned, and polling never marks anything as read. */
export async function GET(request:Request) {
 try {
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const parameters=new URL(request.url).searchParams;
  if([...parameters.keys()].some(key=>key!=="collegeId"&&key!=="threadId")||
     parameters.getAll("collegeId").length>1||parameters.getAll("threadId").length>1)
   return NextResponse.json({error:"INVALID_PULSE_SCOPE"},{status:400});
  const parsed=z.strictObject({
    collegeId:z.string().uuid().optional(),
    threadId:z.string().uuid().optional(),
  }).safeParse({
    ...(parameters.has("collegeId")?{collegeId:parameters.get("collegeId")}:{}),
    ...(parameters.has("threadId")?{threadId:parameters.get("threadId")}:{}),
  });
  if(!parsed.success||parsed.data.threadId&&!parsed.data.collegeId)
   return NextResponse.json({error:"INVALID_PULSE_SCOPE"},{status:400});
  const collegeIds=recruiterConversationPulseColleges(
    (context.recruiter.grants??[]).map(grant=>grant.collegeId),parsed.data.collegeId);
  if(collegeIds===null)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(!collegeIds.length)
   return NextResponse.json({version:"no-access"},{headers:{"Cache-Control":"private, no-store"}});
  const [pulse]=await getDb().select({
   version:sql<string>`concat(
      count(distinct ${placementTpoMessageThreads.id}), ':',
      coalesce(max(${placementTpoMessageThreads.lastMessageAt})::text,''), ':',
      coalesce(max(${placementTpoMessages.readAt})::text,''), ':',
      count(${placementTpoMessages.id})
   )`,
  }).from(placementTpoMessageThreads)
   .leftJoin(placementTpoMessages,eq(placementTpoMessages.threadId,placementTpoMessageThreads.id))
   .where(and(
     eq(placementTpoMessageThreads.recruiterUserId,context.user.id),
     inArray(placementTpoMessageThreads.collegeId,collegeIds),
     ...(parsed.data.threadId?[eq(placementTpoMessageThreads.id,parsed.data.threadId)]:[]),
   ));
  return NextResponse.json({version:pulse?.version??"empty"},{
   headers:{"Cache-Control":"private, no-store"},
  });
 }catch(error){return apiErrorResponse(error);}
}
