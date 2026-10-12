import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { canReadSkillCatalog } from "@/modules/skills/catalog-access";
import { readSkillCatalog } from "@/modules/skills/catalog-service";
import { skillsCatalogRuntimeEnabled } from "@/modules/skills/catalog-readiness";
import { parseSkillCatalogQuery } from "@/modules/skills/catalog-validation";

export const runtime = "nodejs";

/** W06 shared read-only catalog. W02 owns frontend profile autocomplete. */
export async function GET(request: Request) {
  if (!skillsCatalogRuntimeEnabled()) {
    return NextResponse.json(
      { error: "DB10_SKILLS_MIGRATIONS_PENDING" },
      { status: 503 },
    );
  }
  try {
    const context = await getCurrentRequestContext();
    if (!canReadSkillCatalog(context)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const input = parseSkillCatalogQuery(new URL(request.url).searchParams);
    const result = await readSkillCatalog(input);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
