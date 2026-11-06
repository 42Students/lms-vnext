import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { sendTpoStudentNudges } from "@/modules/placements/tpo-student-nudge-send-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const raw:unknown=await request.json();
    const body=raw!==null&&typeof raw==="object"&&!Array.isArray(raw)
    ?raw as Record<string,unknown>:null;
    const input=body&&!Object.prototype.hasOwnProperty.call(body,"template")
    ?{...body,template:"CUSTOM"}:raw;
    const result=await sendTpoStudentNudges(context,input);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
