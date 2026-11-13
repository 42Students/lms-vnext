import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {addTpoTeamAssignment,removeTpoTeamAssignment,readTpoTeamRemovalImpact} from "@/modules/placements/tpo-settings-team-actions-service";
import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";
function teamErrorResponse(error:unknown){
 if(error instanceof Error){
  const responses:Record<string,{status:number;message:string}>={
   TEAM_MEMBER_OWNS_WORK:{status:409,message:"Hand over owned drives, companies, recruiter leads and follow-ups before removing this team member."},
   TEAM_ASSIGNMENT_NOT_FOUND:{status:404,message:"This team assignment is no longer available. Refresh the team."},
   CANNOT_REMOVE_OWN_TEAM_ASSIGNMENT:{status:403,message:"You cannot remove your own placement team assignment."},
   TEAM_OWNERSHIP_NOT_REGISTERED:{status:503,message:"Team ownership records are temporarily unavailable. No changes have been made."},
  };
  const response=responses[error.message];
  if(response)return NextResponse.json({error:error.message,message:response.message},
   {status:response.status,headers:{"Cache-Control":CACHE.PRIVATE}});
 }
 return apiErrorResponse(error);
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const membershipId=new URL(request.url).searchParams.get("membershipId");
const impact=await readTpoTeamRemovalImpact(__ctx,membershipId);
return privateJson({impact});
} catch(error){return teamErrorResponse(error);}
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
return NextResponse.json(await addTpoTeamAssignment(__ctx,await boundedRequestJson(request)),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
} catch(error){return teamErrorResponse(error);}
  },
);
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
return NextResponse.json(await removeTpoTeamAssignment(__ctx,await boundedRequestJson(request)),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
} catch(error){return teamErrorResponse(error);}
  },
);
