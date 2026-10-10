import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { checkTpoLeadContact } from "@/modules/placements/tpo-crm-service";

export const runtime = "nodejs";

/**
 * Legacy duplicate-preview: only returns a recruiter lead for the
 * authenticated college, with invitation secrets stripped.
 */
export async function GET(request: Request) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") {
    return NextResponse.json(
      { error: "DB09_MIGRATIONS_PENDING" },
      { status: 503 },
    );
  }
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const lead = await checkTpoLeadContact(context, {
      collegeId: url.searchParams.get("collegeId") ?? "",
      contact: url.searchParams.get("contact") ?? "",
    });
    return lead
      ? NextResponse.json({ lead })
      : new NextResponse(null, { status: 204 });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
