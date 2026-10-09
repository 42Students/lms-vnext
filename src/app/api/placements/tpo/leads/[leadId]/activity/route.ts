import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import {
  listTpoLeadActivities,
  logTpoLeadActivity,
} from "@/modules/placements/tpo-crm-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ leadId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const { leadId } = await params;
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    const activities = await listTpoLeadActivities(context, collegeId, leadId);
    return NextResponse.json({ activities });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { leadId } = await params;
    const activity = await logTpoLeadActivity(
      context, leadId, await request.json(),
    );
    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
