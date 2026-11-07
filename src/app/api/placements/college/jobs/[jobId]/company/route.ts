import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {relinkDraftPlacementCompany} from "@/modules/placements/job-service";

export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {jobId}=params;
    const input:unknown=await boundedRequestJson(request);
    const result=await relinkDraftPlacementCompany(context,jobId,input);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
