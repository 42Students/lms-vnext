import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import {
  bulkAssignTpoLeadOwner,
  listTpoLeadOwners,
} from "@/modules/placements/tpo-bulk-lead-owner-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const owners = await listTpoLeadOwners(await getCurrentRequestContext());
    return NextResponse.json({ owners }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    return NextResponse.json(await bulkAssignTpoLeadOwner(
      await getCurrentRequestContext(),
      await request.json(),
    ));
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
