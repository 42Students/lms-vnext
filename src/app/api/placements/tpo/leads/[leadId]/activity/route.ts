import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import {
  listTpoLeadActivities,
  logTpoLeadActivity,
} from "@/modules/placements/tpo-crm-service";
import { route } from "@/security/route";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ leadId: string }> };

async function handleGET(request: Request, { params }: RouteContext) {
  if (!await tpoCrmTablesReady()) return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});

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
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);

async function handlePOST(request: Request, { params }: RouteContext) {
  if (!await tpoCrmTablesReady()) return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});

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
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
