import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoStudentPanelDetail} from "@/modules/placements/tpo-student-panel-detail-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{membershipId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {membershipId}=params;
    const detail=await getTpoStudentPanelDetail(__ctx,membershipId);
    if(!detail)return NextResponse.json({error:"STUDENT_NOT_FOUND"},{status:404});
    return privateJson(detail);
  },
);
