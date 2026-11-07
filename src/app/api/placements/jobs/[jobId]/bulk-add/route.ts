import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  bulkAddLearnersToDrive,
  listBulkDriveCandidates,
} from "@/modules/placements/bulk-drive-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const search = new URL(request.url).searchParams;
    return NextResponse.json(await listBulkDriveCandidates(
      context, jobId, Object.fromEntries(search.entries()),
    ));
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    return NextResponse.json(await bulkAddLearnersToDrive(
      context, jobId, await boundedRequestJson(request, 8 * 1024 * 1024),
    ));
  },
);
