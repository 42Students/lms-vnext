import { NextResponse } from "next/server";
import {recruiterInviteNotHiringNoteSchema} from "@/modules/placements/recruiter-invite-not-hiring-note-model";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoRecruiterInviteApiErrorResponse } from "@/lib/tpo-recruiter-invite-api-error";
import { markRecruiterInviteNotHiring } from "@/modules/placements/tpo-recruiter-invite-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  if (process.env["DB09_TPO_API_READY"] !== "DB09_VERIFIED") {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { token } = await params;
    // A public bearer token only permits declining this invitation. Limit the
    // optional plain-text note without allowing any other caller-selected CRM field.
    const bytes=Number(request.headers.get("content-length")??"0");
    if(!Number.isFinite(bytes)||bytes>2048)
      return NextResponse.json({error:"INVALID_BODY"},{status:413});
    let payload:unknown={};
    if(request.headers.get("content-type")?.startsWith("application/json")){
      try{const body=await request.text();if(body.length>2048)
        return NextResponse.json({error:"INVALID_BODY"},{status:413});
        payload=JSON.parse(body) as unknown;
      }catch{return NextResponse.json({error:"INVALID_BODY"},{status:400});}
    }
    if(!payload||typeof payload!=="object"||Array.isArray(payload)||
       Object.keys(payload).some(key=>key!=="note"))
      return NextResponse.json({error:"INVALID_BODY"},{status:400});
    const parsed=recruiterInviteNotHiringNoteSchema.safeParse(
      (payload as {note?:unknown}).note);
    if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
    return NextResponse.json(await (parsed.data
      ?markRecruiterInviteNotHiring(token,new Date(),parsed.data)
      :markRecruiterInviteNotHiring(token)));
  } catch (error) {
    return tpoRecruiterInviteApiErrorResponse(error);
  }
}
