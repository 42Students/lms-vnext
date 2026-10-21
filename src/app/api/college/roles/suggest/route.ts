import {getCurrentRequestContext} from "@/auth/request-context";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users} from "@/db/schema";
import {and,asc,eq,ilike,sql} from "drizzle-orm";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  if(!context.membership||!hasMembershipRole(context,"COLLEGE_ADMIN")||
    context.membership.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE")
    throw new AuthorizationError("people.manage");
  const scope={collegeId:context.membership.collegeId,
    organizationId:context.membership.organizationId};
  requirePermission(context,"people.manage",scope);
  const url=new URL(request.url);
  const kind=url.searchParams.get("kind");
  const value=(url.searchParams.get("q")??"").trim();
  if((kind!=="FACULTY"&&kind!=="LEARNER")||value.length<2||value.length>80)
    return Response.json({error:"INVALID_QUERY"},{status:400});
  const escaped=value.replace(/[\\%_]/g,"\\$&");
  const items=await getDb().select({
   membershipId:collegeMemberships.id,
   name:users.displayName,
  }).from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(
     eq(membershipRoles.membershipId,collegeMemberships.id),
     eq(membershipRoles.role,kind)))
   .where(and(
     eq(collegeMemberships.collegeId,scope.collegeId),
     eq(collegeMemberships.status,"ACTIVE"),
     eq(users.platformStatus,"ACTIVE"),
     ilike(users.displayName,"%"+escaped+"%"),
   ))
   .orderBy(asc(sql`lower(${users.displayName})`),asc(collegeMemberships.id))
   .limit(8);
  return Response.json({items:items.map(row=>({
    membershipId:row.membershipId,name:row.name??"Unnamed",
  }))},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
