import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoRecruiterInviteApiErrorResponse } from "@/lib/tpo-recruiter-invite-api-error";
import { issueTpoRecruiterInvite } from "@/modules/placements/tpo-recruiter-invite-service";
import {deliverTpoRecruiterInviteEmail} from "@/modules/placements/tpo-recruiter-invite-email-delivery";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ leadId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  if (!await tpoCrmTablesReady()) {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    if(body.sendEmail===true &&
       process.env.TPO_RECRUITER_INVITE_EMAIL_READY!=="VERIFIED")
      return NextResponse.json({error:"TPO_RECRUITER_INVITE_DELIVERY_PENDING"},{status:503});
    const context = await getCurrentRequestContext();
    const { leadId } = await params;
    const collegeId = typeof body.collegeId === "string" ? body.collegeId : "";
    const invite = await issueTpoRecruiterInvite(
      context,
      collegeId,
      leadId,
      new Date(),
      { sendEmail: body.sendEmail===true, deliver: deliverTpoRecruiterInviteEmail },
    );
    if(body.sendEmail===true){
      if(!invite.emailed)
        return NextResponse.json({
          error:"INVITE_EMAIL_NOT_ACCEPTED",emailAvailable:invite.emailAvailable,emailed:false,
        },{status:503,headers:{"Cache-Control":"no-store"}});
      return NextResponse.json({invite:{
        leadId:invite.leadId,expiresAt:invite.expiresAt,
        emailAvailable:invite.emailAvailable,emailed:true,
      }},{headers:{"Cache-Control":"no-store"}});
    }
    return NextResponse.json({ invite },{headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    return tpoRecruiterInviteApiErrorResponse(error);
  }
}
