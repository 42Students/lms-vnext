import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import {
  bulkAssignTpoLeadOwner,
  listTpoLeadOwners,
} from "@/modules/placements/tpo-bulk-lead-owner-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleGET() {
  if (!await tpoCrmTablesReady()) {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const owners = await listTpoLeadOwners(await getCurrentRequestContext());
    return NextResponse.json({ owners }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
export const GET = secured(handleGET);

async function handlePOST(request: Request) {
  if (!await tpoCrmTablesReady()) {
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
export const POST = secured(handlePOST, { csrf: "enforce" });
