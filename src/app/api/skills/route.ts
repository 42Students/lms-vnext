import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getDb } from "@/db/client";
import {
  db10Skills,
  db10SkillSynonyms,
  db10SkillUsage,
} from "@/db/schema/db10-skills-catalog.draft";
import { apiErrorResponse } from "@/lib/api-error";
import { canReadSkillCatalog } from "@/modules/skills/catalog-access";
import { readSkillCatalog } from "@/modules/skills/catalog-service";
import { skillsCatalogRuntimeEnabled } from "@/modules/skills/catalog-readiness";
import { parseSkillCatalogQuery } from "@/modules/skills/catalog-validation";

export const runtime = "nodejs";

type ReadMode = "search" | "popular" | "categories" | "category" | "exists" | "stats";
type CompatVersion = "v1" | "v2" | null;

/**
 * Native /api/skills consumers retain {items}/{categories}. Explicit compat
 * responses are for adapters, not an assertion that legacy URLs are mounted.
 * Legacy path aliases remain a separate, route-owner handoff.
 */
function successPayload(mode: ReadMode, compat: CompatVersion, data: unknown, elapsedMs: number) {
  if (!compat) return data;

  const message = compat === "v1"
    ? ({
      search: "Skills retrieved successfully",
      popular: "Popular skills retrieved successfully",
      categories: "Categories retrieved successfully",
      category: "Skills retrieved successfully",
      exists: "Checked",
      stats: "Stats retrieved",
    } satisfies Record<ReadMode, string>)[mode]
    : ({
      search: `Skills retrieved in ${elapsedMs}ms`,
      popular: "Popular skills retrieved",
      categories: "Categories retrieved",
      category: "Skills retrieved",
      exists: "Checked",
      stats: "Stats retrieved",
    } satisfies Record<ReadMode, string>)[mode];
  return { status: "success", message, data };
}

function legacyErrorMessage(mode: ReadMode) {
  switch (mode) {
    case "popular":
      return "Failed to fetch popular skills. Please try again or contact support.";
    case "categories":
      return "Failed to fetch categories. Please try again or contact support.";
    case "category":
      return "Failed to fetch skills. Please try again or contact support.";
    default:
      return "Failed to search skills. Please try again or contact support.";
  }
}

/** Read-only skill catalog. All DB-backed reads remain disabled until DB10 is verified. */
export async function GET(request: Request) {
  if (!skillsCatalogRuntimeEnabled()) {
    return NextResponse.json(
      {
        error: "DB10_SKILLS_MIGRATIONS_PENDING",
        message: "Skill catalog temporarily unavailable. You can save the entered skill name.",
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const startedAt = Date.now();
  const params = new URL(request.url).searchParams;
  const requestedMode = params.get("mode") ?? "search";
  const compat: CompatVersion = params.get("compat") === "v1"
    ? "v1"
    : params.get("compat") === "v2" ? "v2" : null;

  try {
    const context = await getCurrentRequestContext();
    if (!canReadSkillCatalog(context)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    if (requestedMode === "exists") {
      const skillName = (params.get("skillName") ?? params.get("query") ?? "").trim();
      if (!skillName || skillName.length > 200) {
        return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
      }

      const normalized = skillName.toLocaleLowerCase("en-US");
      const rows = await getDb().select({ id: db10Skills.id }).from(db10Skills)
        .where(and(
          eq(db10Skills.isActive, true),
          sql`(lower(${db10Skills.name}) = ${normalized}
            or lower(${db10Skills.displayName}) = ${normalized}
            or exists (
              select 1 from ${db10SkillSynonyms} as synonym
              where synonym.skill_id = ${db10Skills.id}
                and lower(synonym.synonym) = ${normalized}
            ))`,
        ))
        .limit(1);
      const exists = rows.length > 0;
      return NextResponse.json(
        successPayload("exists", compat, compat ? exists : { exists }, Date.now() - startedAt),
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (requestedMode === "stats") {
      const db = getDb();
      const [skills] = await db.select({ total: sql<number>`count(*)::integer` })
        .from(db10Skills).where(eq(db10Skills.isActive, true));
      const [categories] = await db.select({
        total: sql<number>`count(distinct ${db10Skills.category})::integer`,
      }).from(db10Skills).where(eq(db10Skills.isActive, true));
      const [tracked] = await db.select({ total: sql<number>`count(*)::integer` })
        .from(db10SkillUsage);
      const stats = {
        totalSkills: skills?.total ?? 0,
        categories: categories?.total ?? 0,
        popularSkillsTracked: tracked?.total ?? 0,
      };
      return NextResponse.json(
        successPayload("stats", compat, stats, Date.now() - startedAt),
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    // Keep native search's default 15; legacy popular and category default
    // to 10 and 50 respectively unless the caller explicitly supplies limit.
    const normalizedParams = new URLSearchParams(params);
    if (!params.has("limit") && requestedMode === "popular") {
      normalizedParams.set("limit", "10");
    } else if (!params.has("limit") && requestedMode === "category") {
      normalizedParams.set("limit", "50");
    }
    const input = parseSkillCatalogQuery(normalizedParams);
    const result = await readSkillCatalog(input);
    const data = input.mode === "categories" ? result.categories ?? [] : result.items ?? [];
    return NextResponse.json(
      successPayload(input.mode, compat, compat ? data : result, Date.now() - startedAt),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }
    // Do not hide authentication/authorization failures behind a legacy 500.
    const mapped = apiErrorResponse(error);
    if (mapped.status !== 500) return mapped;
    if (compat === "v1" && (
      requestedMode === "search" ||
      requestedMode === "popular" ||
      requestedMode === "categories" ||
      requestedMode === "category"
    )) {
      return NextResponse.json(
        { status: "error", message: legacyErrorMessage(requestedMode), data: null },
        { status: 500, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    return mapped;
  }
}
