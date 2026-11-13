import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {readCompleteCollegeModuleTree} from "@/modules/module-access/admin-full-tree-read";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const query=z.strictObject({
 collegeId:z.uuid(),
 page:z.coerce.number().int().min(1).max(10000).default(1),
});

/** Return every academic scope, including Inherit-only scopes, in bounded
 * 500-row pages with stable parent IDs so clients can assemble the full tree.
 * Individual learners continue to use the authorized membership trace API.
 */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const url=new URL(request.url);
    const input=query.parse({
   collegeId:url.searchParams.get("collegeId")??undefined,
   page:url.searchParams.get("page")??undefined,
  });
    const tree=await readCompleteCollegeModuleTree(
   __ctx,input.collegeId,input.page,
  );
    if(!tree)return NextResponse.json({error:"COLLEGE_NOT_FOUND"},{status:404});
    return NextResponse.json({
   ...tree,scopeTypes:{COHORT:"Batch",SECTION:"Class",MEMBERSHIP:"Learner"},
   description:"Every academic scope in the selected college, including inherited-only nodes.",
  },{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
