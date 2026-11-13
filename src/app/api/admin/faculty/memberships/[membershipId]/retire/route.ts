import {NextResponse} from "next/server";
import {and,count,eq,gt,isNull} from "drizzle-orm";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getDb} from "@/db/client";
import {courseTeachingAssignments,sectionScheduleEvents,projectMembers} from "@/db/schema";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";
import {isSuperAdmin} from "@/modules/identity/context";
import {getPersonMembershipDetailWithRuntime,updateMembershipLifecycleWithRuntime} from "@/modules/people/runtime";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import { route } from "@/security/route";

import { ROLE } from "@/modules/identity/roles";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"} as const;
type Props={params:Promise<{membershipId:string}>};

/** Non-destructive replacement for legacy faculty delete: check all known
 * teaching/dependency edges before allowing an audited college membership END.
 * Never delete the shared user, academic records, or a membership role. */
async function impact({membershipId}: {membershipId:string}){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("membership.lifecycle.manage");
 const selected=await resolveActingCollege(context,"membership.lifecycle.manage");
 requirePermission(context,"membership.lifecycle.manage",{
  collegeId:selected.collegeId,organizationId:selected.organizationId,
 });
 const person=await getPersonMembershipDetailWithRuntime(context,membershipId);
 if(person.membership.collegeId!==selected.collegeId||
    !person.membership.roles.includes(ROLE.FACULTY))
  throw new AuthorizationError("membership.lifecycle.manage");
 const db=getDb(),now=new Date(),id=person.membership.id;
 const [[courses],[schedules],[projects]]=await Promise.all([
  db.select({n:count()}).from(courseTeachingAssignments).where(and(
   eq(courseTeachingAssignments.membershipId,id),
   isNull(courseTeachingAssignments.endedAt),isNull(courseTeachingAssignments.deletedAt))),
  db.select({n:count()}).from(sectionScheduleEvents).where(and(
   eq(sectionScheduleEvents.facultyMembershipId,id),
   eq(sectionScheduleEvents.status,"SCHEDULED"),gt(sectionScheduleEvents.endsAt,now))),
  db.select({n:count()}).from(projectMembers).where(and(
   eq(projectMembers.membershipId,id),isNull(projectMembers.endedAt),
   isNull(projectMembers.deletedAt))),
 ]);
 const otherRoles=person.membership.roles.some(role=>role!==ROLE.FACULTY);
 const canEnd=person.membership.status!=="ENDED" &&
  person.user.id!==context.user.id && !otherRoles &&
  !(courses?.n||schedules?.n||projects?.n);
 return {context,person,canEnd,otherRoles,courses:courses?.n??0,
  schedules:schedules?.n??0,projects:projects?.n??0};
}
async function handleGET(_request:Request,{params}:Props){
 try{
  const result=await impact(await params);
  return NextResponse.json({
   canEnd:result.canEnd,otherRoles:result.otherRoles,
   courses:result.courses,schedules:result.schedules,projects:result.projects,
  },{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
async function handlePOST(request:Request,{params}:Props){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const _b=await readBoundedJsonRequest(request,8192);
  if(!_b.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:noStore});
  const raw:unknown=_b.value;
  if(!raw||typeof raw!=="object"||!("confirmed" in raw)||raw.confirmed!==true)
   return NextResponse.json({error:"CONFIRMATION_REQUIRED"},{status:400,headers:noStore});
  const checked=await impact(await params);
  if(!checked.canEnd)
   return NextResponse.json({error:"FACULTY_ASSIGNMENTS_REMAIN",impact:{
    courses:checked.courses,schedules:checked.schedules,projects:checked.projects,
    otherRoles:checked.otherRoles,
   }},{status:409,headers:noStore});
  // The existing membership lifecycle writer performs its own scoped permission
  // checks, session invalidation and durable mutation audit.
  const updated=await updateMembershipLifecycleWithRuntime(
   checked.context,checked.person.membership.id,{action:"END"});
  return NextResponse.json({status:updated.membership.status},
   {headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
