import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listMentorGoogleInvitees} from
 "@/modules/projects/mentor-google-meeting-sync-service";
export const runtime="nodejs";
type Params={params:Promise<{projectId:string;meetingId:string}>};
/** Current assigned Mentor only; reveal a bounded roster of names and opaque
 * membership IDs, never addresses, tokens, or historic project members.
 */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId,meetingId}=params;
    const result=await listMentorGoogleInvitees(
   __ctx,projectId,meetingId);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
