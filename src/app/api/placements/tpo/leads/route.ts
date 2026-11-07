import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { confirmedCreateTpoLeadSchema } from "@/modules/placements/tpo-crm-validation";
import {
  createTpoLead,
  listTpoLeads,
} from "@/modules/placements/tpo-crm-service";
import { route } from "@/security/route";

export const runtime = "nodejs";

async function handleGET(request: Request) {
  if (!await tpoCrmTablesReady()) return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});
  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    const leads = await listTpoLeads(context, collegeId);
    return NextResponse.json({ leads });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);

async function handlePOST(request: Request) {
  if (!await tpoCrmTablesReady()) return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const payload = confirmedCreateTpoLeadSchema.parse(await request.json());
    const lead = await createTpoLead(context, payload.lead);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
