import {requireRecentDeviceAuthentication} from "@/auth/recent-device-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonRequest } from "@/lib/bounded-json-request";
import { isSuperAdmin } from "@/modules/identity/context";
import { reconcileCuratedSkillSynonyms } from "@/modules/skills/curated-synonym-seed-service";
import { skillsCatalogReadiness } from "@/modules/skills/catalog-readiness";
import { route } from "@/security/route";

import { CACHE, privateJson } from "@/security/responses";
export const runtime = "nodejs";

const inputSchema = z.strictObject({
  dryRun: z.boolean().default(true),
  source: z.literal("CURATED_SYNONYMS"),
});

/** Privileged operator-only preview/apply; never starts on public requests,
 * boot, or a CI environment without a verified schema replay marker. */
async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const context=await getCurrentRequestContext();
    if(!isSuperAdmin(context)||context.adminScope?.collegeId||
      context.adminScope?.organizationId)
      return NextResponse.json({error:"FORBIDDEN"},{status:403});
    if(!skillsCatalogReadiness().schemaReplayVerified)
      return NextResponse.json({error:"DB10_SKILLS_MIGRATIONS_PENDING",
        message:"Verify the DB10 PostgreSQL migration replay before importing."},
        {status:503,headers:{"Cache-Control":CACHE.PRIVATE}});
    const _p=await readBoundedJsonRequest(request,8192);
    if(!_p.ok)return privateJson({error:"INVALID_REQUEST"}, { status: 400 });
    const raw:unknown=_p.value;
    const input=inputSchema.parse(raw);
    await requireRecentDeviceAuthentication(context.user.id);
    const report=await reconcileCuratedSkillSynonyms(context,input.dryRun);
    return NextResponse.json({report,requiresVerification:true,
      message:input.dryRun?"Curated skill synonym preview complete":
        "Curated synonyms reconciled. Verify seed counts before enabling the catalog."},
      {headers:{"Cache-Control":CACHE.PRIVATE}});
  }catch(error){return apiErrorResponse(error);}
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
