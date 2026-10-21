import {NextResponse} from "next/server";
import {and,eq,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getDb} from "@/db/client";
import {notificationDeliveryOutbox} from "@/db/schema/activity";
import {colleges} from "@/db/schema";
import {hasMembershipRole,isSuperAdmin} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {requireStaffNotificationMutation} from "@/modules/activity/notification-service";

export const runtime="nodejs";
type RouteContext={params:Promise<{id:string}>};
export async function POST(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  const {id:rawId}=await params;
  const id=z.string().uuid().safeParse(rawId);
  const collegeId=z.string().uuid().safeParse(
    new URL(request.url).searchParams.get("collegeId"),
  );
  if(!id.success||!collegeId.success)
    return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  try{
    const context=await getCurrentRequestContext();
    if(!isSuperAdmin(context)&&!hasMembershipRole(context,"COLLEGE_ADMIN"))
      return NextResponse.json({error:"FORBIDDEN"},{status:403});
    // No deceptive acknowledgement when the outbound queue has not been
    // registered or a release worker has not been deployed.
    const ready=await getDb().execute<{ready:boolean}>(sql`
      select to_regclass('public.notification_delivery_outbox') is not null as ready
    `);
    if(!ready.rows[0]?.ready)
      return NextResponse.json({error:"NOTIFICATION_DELIVERY_NOT_READY"},{status:503});
    const result=await getDb().transaction(async tx=>{
      const [row]=await tx.select({
        id:notificationDeliveryOutbox.id,
        eventId:notificationDeliveryOutbox.eventId,
        status:notificationDeliveryOutbox.deliveryStatus,
        collegeId:notificationDeliveryOutbox.collegeId,
        organizationId:notificationDeliveryOutbox.organizationId,
      }).from(notificationDeliveryOutbox)
        .where(and(eq(notificationDeliveryOutbox.id,id.data),
          eq(notificationDeliveryOutbox.collegeId,collegeId.data),
          isNull(notificationDeliveryOutbox.deletedAt)))
        .for("update").limit(1);
      if(!row)return {status:"NOT_FOUND" as const};
      const [college]=await tx.select({organizationId:colleges.organizationId})
        .from(colleges).where(eq(colleges.id,collegeId.data)).limit(1);
      if(!college||row.organizationId!==college.organizationId)
        return {status:"NOT_FOUND" as const};
      requirePermission(context,"courses.manage",{
        collegeId:collegeId.data,organizationId:college.organizationId,
      });
      await requireStaffNotificationMutation(context,row.eventId);
      if(row.status==="SENT"||row.status==="PROCESSING")
        return {status:"ALREADY_SENT" as const};
      if(row.status!=="SCHEDULED"&&row.status!=="FAILED")
        return {status:"INVALID_STATE" as const};
      const [updated]=await tx.update(notificationDeliveryOutbox).set({
        deliveryStatus:"SCHEDULED",scheduledAt:new Date(Date.now()-1000),
        nextRetryAt:null,deliveryError:null,updatedAt:new Date(),
      }).where(and(eq(notificationDeliveryOutbox.id,row.id),
        eq(notificationDeliveryOutbox.deliveryStatus,row.status)))
        .returning({id:notificationDeliveryOutbox.id,
          deliveryStatus:notificationDeliveryOutbox.deliveryStatus});
      return updated?{status:"QUEUED" as const,...updated}:{status:"CONFLICT" as const};
    });
    if(result.status==="NOT_FOUND")
      return NextResponse.json({error:"NOTIFICATION_NOT_FOUND"},{status:404});
    if(result.status==="ALREADY_SENT")
      return NextResponse.json({error:"ALREADY_DELIVERED",message:
        "That notification was already delivered. Compose a new one instead of resending it."},
        {status:400});
    if(result.status==="INVALID_STATE"||result.status==="CONFLICT")
      return NextResponse.json({error:"INVALID_NOTIFICATION_STATE"},{status:409});
    return NextResponse.json({status:"OK",message:"Queued for immediate delivery",
      data:{id:result.id,deliveryStatus:result.deliveryStatus}},{status:200});
  }catch(error){return apiErrorResponse(error);}
}
