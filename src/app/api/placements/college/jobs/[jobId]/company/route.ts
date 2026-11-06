import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {relinkDraftPlacementCompany} from "@/modules/placements/job-service";

export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {jobId}=params;
    const input:unknown=await request.json();
    const result=await relinkDraftPlacementCompany(context,jobId,input);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
