import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { listDueTpoFollowups } from "@/modules/placements/tpo-crm-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});

  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    const followups = await listDueTpoFollowups(context, collegeId);
    return NextResponse.json({ followups });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
