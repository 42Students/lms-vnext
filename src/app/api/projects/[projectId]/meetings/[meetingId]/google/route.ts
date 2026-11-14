import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {checkMentorGoogleMeeting,syncMentorGoogleMeeting,
 removeCancelledMentorGoogleMeeting}
 from "@/modules/projects/mentor-google-meeting-sync-service";
import { privateJson } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime="nodejs";
type Params={params:Promise<{projectId:string;meetingId:string}>};
const inputSchema=z.strictObject({
 weeklyCount:z.number().int().min(2).max(52).optional(),
 inviteeMembershipIds:z.array(zUuid).min(1).max(100).optional(),
});
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId,meetingId}=params;
    const status=await checkMentorGoogleMeeting(
   __ctx,projectId,meetingId);
    return privateJson(status);
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const raw=await request.text();
if(raw.length>6000)return NextResponse.json({error:"INVALID_REQUEST"},{status:413});
const input=inputSchema.safeParse(JSON.parse(raw||"{}"));
if(!input.success)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
const {projectId,meetingId}=params;
const result=await syncMentorGoogleMeeting(__ctx,
   projectId,meetingId,input.data.weeklyCount,input.data.inviteeMembershipIds);
return privateJson(result);
} catch(error){
  if(error instanceof SyntaxError)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  return apiErrorResponse(error);
 }
  },
);

/** Explicitly retract an already-cancelled meeting from the consented
 * Google account. This does not cancel an active local meeting.
 */
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId,meetingId}=params;
    const result=await removeCancelledMentorGoogleMeeting(
   __ctx,projectId,meetingId);
    return privateJson(result);
  },
);
