import {NextResponse} from "next/server";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {users} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateOwnRecruiterDesignation} from "@/modules/placements/recruiter-designation-service";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {readRecruiterJsonBody,RecruiterJsonBodyError} from "@/modules/placements/recruiter-json-request";
export const runtime="nodejs";
export async function PATCH(request:Request) {
 if(!isSameOriginRequest(request)) return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try {
  const context=await getCurrentRequestContext();
  const input:unknown=await readRecruiterJsonBody(request);
  return NextResponse.json({profile:await updateOwnRecruiterDesignation(context,input)});
 } catch(error){if(error instanceof RecruiterJsonBodyError)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:error.kind==="TOO_LARGE"?413:400});
   return apiErrorResponse(error);}
}

/** Existing recruiter self profile, selected from the authenticated user and
 * company grant. Do not trust supplied college/user IDs or a query bearer. */
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||!context.recruiter||
     context.recruiter.userId!==context.user.id||context.user.platformStatus!=="ACTIVE")
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const [identity]=await getDb().select({displayName:users.displayName,email:users.email})
   .from(users).where(eq(users.id,context.user.id)).limit(1);
  if(!identity)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  return NextResponse.json({profile:{
   id:context.user.id,displayName:identity.displayName,
   email:identity.email,companyId:context.recruiter.companyId,
   companyName:context.recruiter.companyName,
   grants:context.recruiter.grants.map(grant=>({
    collegeId:grant.collegeId,companyRelationshipId:grant.companyRelationshipId,
   })),
  }},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
