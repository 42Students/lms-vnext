import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { getDb } from "@/db/client";
import { activityEvents } from "@/db/schema";
import { hasMembershipRole, isSuperAdmin } from "@/modules/identity/context";
import {
  db10Skills,
  db10SkillSynonyms,
  db10SkillUsage,
} from "@/db/schema/db10-skills-catalog.draft";
import { apiErrorResponse } from "@/lib/api-error";
import { canReadSkillCatalog } from "@/modules/skills/catalog-access";
import { readSkillCatalog, recordSkillSelection, invalidateSkillCatalogSearchCache } from "@/modules/skills/catalog-service";
import { skillsCatalogRuntimeEnabled, skillsCatalogSchemaReady, skillsCatalogReadiness } from "@/modules/skills/catalog-readiness";
import { parseSkillCatalogQuery } from "@/modules/skills/catalog-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The catalog is not writable while DB10 schema replay is unverified.
// A successful import does not auto-enable GET or certify synonym/source parity.
const selectionInput = z.discriminatedUnion("action",[
  z.strictObject({action:z.literal("SELECT_V1"),
    name:z.string().trim().min(1).max(200),skillId:z.string().uuid()}),
  z.strictObject({action:z.literal("SELECT_V2"),
    name:z.string().trim().min(1).max(200)}),
]);
const importInput = z.strictObject({
  action:z.literal("IMPORT_SKILLS"),
  items:z.array(z.strictObject({
    name:z.string().trim().min(1).max(200),
    displayName:z.string().trim().min(1).max(200),
    category:z.string().trim().max(50).nullable().optional(),
  })).min(1).max(1000),
});
/** One call processes at most 1,000 rows in 100-row transactions.
 * Replaying the same request is safe: the canonical lower(name) index guards
 * duplicate inserts, including concurrent import calls. Do not repurpose the
 * legacy integer source IDs as UUID keys.
 */
export async function POST(request:Request) {
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  if(!skillsCatalogSchemaReady())
    return NextResponse.json({error:"DB10_SKILLS_MIGRATIONS_PENDING"},
      {status:503,headers:{"Cache-Control":"private, no-store"}});
  try{
    const context=await getCurrentRequestContext();
    const payload:unknown=await request.json();
    const actionInput=z.strictObject({action:z.string()}).passthrough().safeParse(payload);
    const action=actionInput.success?actionInput.data.action:null;
    if(!action)return recordSelectedSkillIds(context,request,payload);
    if(action==="IMPORT_SKILLS"){
      if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE")
        return NextResponse.json({error:"FORBIDDEN"},{status:403});
      const input=importInput.parse(payload);
      let created=0;
      for(let start=0;start<input.items.length;start+=100) {
        const batch=input.items.slice(start,start+100).map(item=>({
          name:item.name.toLocaleLowerCase("en-US"),
          displayName:item.displayName,
          category:item.category??null,
          isActive:true,
        }));
        const inserted=await getDb().transaction(tx=>
          tx.insert(db10Skills).values(batch).onConflictDoNothing()
            .returning({id:db10Skills.id}));
        created+=inserted.length;
      }
      invalidateSkillCatalogSearchCache();
      return NextResponse.json({
        processed:input.items.length,created,skipped:input.items.length-created,
        remaining:0,sourceReconciled:false,verificationRequired:true,
      },{headers:{"Cache-Control":"private, no-store"}});
    }
    const selected=selectionInput.parse(payload);
    await recordSkillSelection(context,{
      name:selected.name,source:selected.action==="SELECT_V1"?"v1":"v2",
      skillId:selected.action==="SELECT_V1"?selected.skillId:undefined,
    });
    return NextResponse.json({recorded:true},{
      headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof ZodError)
      return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    return apiErrorResponse(error);
  }
}


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
  const firstParams = new URL(request.url).searchParams;
  if (firstParams.get("mode")==="readiness") {
    try {
      const context=await getCurrentRequestContext();
      if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE")
        return NextResponse.json({error:"FORBIDDEN"},{status:403});
      return NextResponse.json(skillsCatalogReadiness(),
        {headers:{"Cache-Control":"private, no-store"}});
    }catch(error){return apiErrorResponse(error);}
  }
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
      // Operational aggregate includes organization-wide tracking data.
      if (!isSuperAdmin(context) && !hasMembershipRole(context, "COLLEGE_ADMIN"))
        return NextResponse.json({error:"FORBIDDEN"},{status:403});
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
    if (error instanceof ZodError || error instanceof SyntaxError) {
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

const skillSelectionSchema=z.strictObject({
  skillId:z.uuid().optional(),
  skillIds:z.array(z.uuid()).max(25).optional(),
  confirmed:z.literal(true),
}).refine(value=>Boolean(value.skillId||value.skillIds?.length),
  {message:"Select at least one skill"});
/**
 * One atomic, at-most-once selection per authenticated actor and immutable
 * idempotency token. The globally unique activity dedupe key is the durable
 * claim: rollback also rolls back the usage increments. Client retries with
 * the same token and IDs return success without incrementing again.
 *
 * v1 numeric skill IDs must be resolved by an explicitly scoped migration
 * adapter; never reinterpret untrusted legacy integers as a UUID.
 */
async function recordSelectedSkillIds(
  context:Awaited<ReturnType<typeof getCurrentRequestContext>>,
  request:Request,payload:unknown,
) {
  if (!skillsCatalogRuntimeEnabled())
    return NextResponse.json({error:"DB10_SKILLS_MIGRATIONS_PENDING"},
      {status:503,headers:{"Cache-Control":"private, no-store"}});
  try {
    if(!canReadSkillCatalog(context))
      return NextResponse.json({error:"FORBIDDEN"},{status:403});
    const token=request.headers.get("idempotency-key");
    if(!token||!z.uuid().safeParse(token).success)
      return NextResponse.json({error:"IDEMPOTENCY_KEY_REQUIRED"},{status:400});
    const input=skillSelectionSchema.parse(payload);
    const ids=[...new Set([...(input.skillIds??[]),...(input.skillId?[input.skillId]:[])])].sort();
    const dedupeKey=`skills:usage:${context.user.id}:${token}`;
    const result=await getDb().transaction(async tx=>{
      const existing=await tx.select({id:db10Skills.id,name:db10Skills.name})
        .from(db10Skills).where(and(
          eq(db10Skills.isActive,true),inArray(db10Skills.id,ids),
        )).orderBy(db10Skills.id).for("update");
      if(existing.length!==ids.length)return "SKILL_NOT_FOUND" as const;
      // Unique index on activity_events.dedupe_key serializes concurrent
      // requests with the same idempotency key across all app replicas.
      const receipt=await tx.insert(activityEvents).values({
        actorUserId:context.user.id,
        module:"PLATFORM",eventType:"skills.selection.recorded",
        importance:"LOW",subjectType:"SKILL_SELECTION",
        subjectId:context.user.id,
        summary:"Authenticated skill selection recorded",
        metadata:{skillIds:ids,selectedCount:ids.length},
        dedupeKey,
      }).onConflictDoNothing().returning({id:activityEvents.id});
      if(!receipt.length){
        const [previous]=await tx.select({metadata:activityEvents.metadata})
          .from(activityEvents).where(eq(activityEvents.dedupeKey,dedupeKey)).limit(1);
        const previousIds=previous?.metadata?.skillIds;
        if(!Array.isArray(previousIds)||JSON.stringify(previousIds)!==JSON.stringify(ids))
          return "IDEMPOTENCY_CONFLICT" as const;
        return "ALREADY_RECORDED" as const;
      }
      const now=new Date();
      for(const skill of existing){
        await tx.update(db10Skills).set({
          usageCount:sql`${db10Skills.usageCount} + 1`,updatedAt:now,
        }).where(eq(db10Skills.id,skill.id));
        await tx.insert(db10SkillUsage).values({
          skillName:skill.name.toLocaleLowerCase("en-US"),
          usageCount:1,lastUsed:now,
        }).onConflictDoUpdate({target:db10SkillUsage.skillName,set:{
          usageCount:sql`${db10SkillUsage.usageCount} + 1`,
          lastUsed:now,
        }});
      }
      return "RECORDED" as const;
    });
    if(result==="SKILL_NOT_FOUND")
      return NextResponse.json({error:"SKILL_NOT_FOUND"},{status:404});
    if(result==="IDEMPOTENCY_CONFLICT")
      return NextResponse.json({error:"IDEMPOTENCY_CONFLICT"},{status:409});
    const compat=new URL(request.url).searchParams.get("compat");
    return NextResponse.json(
      compat==="v1"||compat==="v2"?
        {status:"success",message:"Selection recorded",data:{selected:ids.length}}:
        {recorded:true,selected:ids.length,replayed:result==="ALREADY_RECORDED"},
      {headers:{"Cache-Control":"private, no-store"}},
    );
  }catch(error){
    if(error instanceof ZodError||error instanceof SyntaxError)
      return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    return apiErrorResponse(error);
  }
}
