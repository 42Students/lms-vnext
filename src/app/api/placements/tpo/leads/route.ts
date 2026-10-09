import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import {
  createTpoLead,
  listTpoLeads,
} from "@/modules/placements/tpo-crm-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    const leads = await listTpoLeads(context, collegeId);
    return NextResponse.json({ leads });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const lead = await createTpoLead(context, await request.json());
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
