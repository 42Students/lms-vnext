import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {listLearnerGroups} from "@/modules/groups/learner-group-list-service";
import {learnerGroupKindSchema} from "@/modules/groups/learner-group-detail-service";
import {apiErrorResponse} from "@/lib/api-error";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const raw=new URL(request.url).searchParams.get("kind");
    const kind=raw?learnerGroupKindSchema.parse(raw.toUpperCase()):undefined;
    const result=await listLearnerGroups(__ctx,new Date(),kind);
    return privateJson(result.open);
  },
);
