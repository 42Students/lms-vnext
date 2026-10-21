import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { isSuperAdmin } from "@/modules/identity/context";
import { reconcileCuratedSkillSynonyms } from "@/modules/skills/curated-synonym-seed-service";
import { skillsCatalogReadiness } from "@/modules/skills/catalog-readiness";

export const runtime = "nodejs";

const inputSchema = z.strictObject({
  dryRun: z.boolean().default(true),
  source: z.literal("CURATED_SYNONYMS"),
});

/** Privileged operator-only preview/apply; never starts on public requests,
 * boot, or a CI environment without a verified schema replay marker. */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const context=await getCurrentRequestContext();
    if(!isSuperAdmin(context))
      return NextResponse.json({error:"FORBIDDEN"},{status:403});
    if(!skillsCatalogReadiness().schemaReplayVerified)
      return NextResponse.json({error:"DB10_SKILLS_MIGRATIONS_PENDING",
        message:"Verify the DB10 PostgreSQL migration replay before importing."},
        {status:503,headers:{"Cache-Control":"private, no-store"}});
    const raw:unknown=await request.json().catch(()=>null);
    const input=inputSchema.parse(raw);
    const report=await reconcileCuratedSkillSynonyms(context,input.dryRun);
    return NextResponse.json({report,requiresVerification:true,
      message:input.dryRun?"Curated skill synonym preview complete":
        "Curated synonyms reconciled. Verify seed counts before enabling the catalog."},
      {headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
