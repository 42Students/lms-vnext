import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";

import {relinkDraftPlacementCompany} from "@/modules/placements/job-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {jobId}=params;
    const input:unknown=await boundedRequestJson(request);
    const result=await relinkDraftPlacementCompany(context,jobId,input);
    return privateJson(result);
  },
);
