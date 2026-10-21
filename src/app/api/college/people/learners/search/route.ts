import {NextResponse} from "next/server";
import {z} from "zod";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {listCollegePeopleWithRuntime} from "@/modules/people/runtime";
import {apiErrorResponse} from "@/lib/api-error";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"};
const querySchema=z.strictObject({
  q:z.string().trim().max(100).default(""),
  membershipId:z.string().uuid().optional(),
  limit:z.coerce.number().int().min(1).max(50).default(20),
});
/** Optional legacy-compatible learner search envelope. Selection is read-only:
 * no "Selection recorded" response without a persisted popularity write.
 * UI pages redirect on missing membership; API consumers receive HTTP 401.
 */
export async function GET(request:Request){
  let context:Awaited<ReturnType<typeof getCurrentRequestContext>>;
  try{context=await getCurrentRequestContext();}
  catch{return NextResponse.json({error:"AUTHENTICATION_REQUIRED",
    message:"Authentication required"},{status:401,headers:noStore});}
  const member=context.membership;
  if(!member||!hasMembershipRole(context,"COLLEGE_ADMIN"))
    return NextResponse.json({error:"FORBIDDEN",message:"College Admin access required"},
      {status:403,headers:noStore});
  try{
    requirePermission(context,"people.manage",{
      collegeId:member.collegeId,organizationId:member.organizationId});
    const query=new URL(request.url).searchParams;
    if([...query.keys()].some(key=>query.getAll(key).length>1))
      return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:noStore});
    const input=querySchema.safeParse(Object.fromEntries(query));
    if(!input.success)
      return NextResponse.json({error:"INVALID_REQUEST",
        message:"Check the learner search filters."},{status:400,headers:noStore});
    if(input.data.membershipId){
      const selected=await getDb().transaction(async tx=>{
        await assertPersistedPlatformPermission(tx,context,"people.manage",{
          collegeId:member.collegeId,organizationId:member.organizationId});
        return tx.select({membershipId:collegeMemberships.id})
          .from(collegeMemberships)
          .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
          .where(and(eq(collegeMemberships.id,input.data.membershipId!),
            eq(collegeMemberships.collegeId,member.collegeId),
            eq(collegeMemberships.status,"ACTIVE"),
            eq(membershipRoles.role,"LEARNER"))).limit(1);
      });
      if(!selected.length)return NextResponse.json({error:"LEARNER_NOT_FOUND",
        message:"Invalid learner id"},{status:404,headers:noStore});
      return NextResponse.json({status:"OK",message:"Learner retrieved",
        data:selected[0]},{headers:noStore});
    }
    const result=await listCollegePeopleWithRuntime(context,{
      collegeId:member.collegeId,limit:input.data.limit,offset:0,
      q:input.data.q,role:"LEARNER",status:"ALL"});
    return NextResponse.json({status:"OK",message:"Learners retrieved",
      data:result.items,total:result.pagination.total},{headers:noStore});
  }catch(error){return apiErrorResponse(error);}
}
