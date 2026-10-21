import { NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getDb } from "@/db/client";
import { apiErrorResponse } from "@/lib/api-error";
import { placementTpoMessages, placementTpoMessageThreads } from "@/db/schema/tpo-collaboration";
import { hasActiveRecruiter } from "@/modules/identity/context";

export const runtime = "nodejs";

/** Scoped lightweight recruiter inbox pulse. No message bodies or foreign
 * college threads are returned, and polling never marks anything as read. */
export async function GET() {
 try {
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const collegeIds=[...new Set((context.recruiter.grants??[]).map(grant=>grant.collegeId))];
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
   ));
  return NextResponse.json({version:pulse?.version??"empty"},{
   headers:{"Cache-Control":"private, no-store"},
  });
 }catch(error){return apiErrorResponse(error);}
}
