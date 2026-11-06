import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { registerCollegeStudent } from "@/modules/people/college-student-registration-service";

export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const result = await registerCollegeStudent(context,await request.json());
    const partial=result.status==="PARTIAL";
    return NextResponse.json({...result,requiresFollowUp:partial,
      message:partial?"Student account created. Complete the outstanding enrollment or profile steps; do not register the student again.":"Student registered."},
      {status:partial?207:201,headers:{"Cache-Control":"private, no-store"}});
  },
);
