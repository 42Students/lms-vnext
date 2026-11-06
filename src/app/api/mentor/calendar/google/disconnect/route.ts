import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {disconnectMentorGoogleConnection} from
 "@/modules/projects/mentor-google-calendar-connection-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    await disconnectMentorGoogleConnection(__ctx);
    return NextResponse.json({connected:false},{
   headers:{"Cache-Control":"private, no-store"}});
  },
);
