import { createHash } from "node:crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { getDb } from "@/db/client";
import { activityEvents } from "@/db/schema/activity";
import { db10Skills, db10SkillUsage } from "@/db/schema/db10-skills-catalog.draft";
import { apiErrorResponse } from "@/lib/api-error";
import { canReadSkillCatalog } from "@/modules/skills/catalog-access";
import { skillsCatalogRuntimeEnabled } from "@/modules/skills/catalog-readiness";

export const runtime = "nodejs";

const selectionSchema = z.strictObject({
  requestId: z.uuid(),
  skillIds: z.array(z.uuid()).max(20).default([]),
  freeTextSkills: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
}).superRefine((value, context) => {
  if (value.skillIds.length + value.freeTextSkills.length === 0 ||
      value.skillIds.length + value.freeTextSkills.length > 20) {
    context.addIssue({ code: "custom", message: "Select between one and twenty skills" });
  }
  if (new Set(value.skillIds).size !== value.skillIds.length ||
      new Set(value.freeTextSkills.map(name => name.toLocaleLowerCase("en-US"))).size !== value.freeTextSkills.length) {
    context.addIssue({ code: "custom", message: "Each skill can appear only once" });
  }
});

/**
 * A user selection is an explicit event, not a profile GET or save retry.
 * Dedupe keys are persisted in activity_events, which has a UNIQUE dedupe_key.
 * The actor-level advisory lock serializes hourly rate enforcement across nodes.
 * DB10 writes remain closed until migrations and seed verification are approved.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  if (!skillsCatalogRuntimeEnabled()) {
    return NextResponse.json({
      error: "DB10_SKILLS_MIGRATIONS_PENDING",
      message: "Skill selection tracking is not available yet.",
    }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
  try {
    const context = await getCurrentRequestContext();
    if (!canReadSkillCatalog(context)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const raw: unknown = await request.json();
    const input = selectionSchema.parse(raw);
    const names = input.freeTextSkills.map(name => name.toLocaleLowerCase("en-US"));
    const signature = createHash("sha256")
      .update(JSON.stringify({ ids: input.skillIds, names })).digest("hex");
    const dedupeKey = "skills.selection:" + context.user.id + ":" + input.requestId;
    const result = await getDb().transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"skills.selection:" + context.user.id}))`);
      const [existing] = await tx.select({ metadata: activityEvents.metadata })
        .from(activityEvents).where(eq(activityEvents.dedupeKey, dedupeKey)).limit(1);
      if (existing) {
        return { outcome: existing.metadata.fingerprint === signature ? "duplicate" : "conflict" } as const;
      }
      const [rate] = await tx.select({ total: sql<number>`count(*)::integer` })
        .from(activityEvents).where(and(
          eq(activityEvents.actorUserId, context.user.id),
          eq(activityEvents.eventType, "identity.skills.selection_recorded"),
          gte(activityEvents.occurredAt, new Date(Date.now() - 60 * 60 * 1000)),
        ));
      if ((rate?.total ?? 0) >= 20) return { outcome: "rate_limited" } as const;
      if (input.skillIds.length) {
        // Verify the complete set before any counters move, so a missing ID
        // cannot commit a partial batch. Active-status writers serialize on
        // their own row updates; a late mismatch throws and rolls back.
        const eligible = await tx.select({ id: db10Skills.id }).from(db10Skills)
          .where(and(inArray(db10Skills.id, input.skillIds), eq(db10Skills.isActive, true)));
        if (eligible.length !== input.skillIds.length) return { outcome: "missing_skill" } as const;
        const updated = await tx.update(db10Skills)
          .set({ usageCount: sql`${db10Skills.usageCount} + 1`, updatedAt: new Date() })
          .where(and(inArray(db10Skills.id, input.skillIds), eq(db10Skills.isActive, true)))
          .returning({ id: db10Skills.id });
        if (updated.length !== input.skillIds.length) throw new Error("SKILL_SELECTION_CHANGED");
      }
      if (names.length) {
        await tx.insert(db10SkillUsage)
          .values(names.map(skillName => ({ skillName, usageCount: 1, lastUsed: new Date() })))
          .onConflictDoUpdate({
            target: db10SkillUsage.skillName,
            set: {
              usageCount: sql`${db10SkillUsage.usageCount} + 1`,
              lastUsed: new Date(),
            },
          });
      }
      await tx.insert(activityEvents).values({
        actorUserId: context.user.id,
        module: "IDENTITY",
        eventType: "identity.skills.selection_recorded",
        subjectType: "USER",
        subjectId: context.user.id,
        summary: "Skill selections recorded",
        dedupeKey,
        metadata: { fingerprint: signature, catalogCount: input.skillIds.length, freeTextCount: names.length },
      });
      return { outcome: "recorded" } as const;
    });
    if (result.outcome === "conflict") {
      return NextResponse.json({ error: "IDEMPOTENCY_KEY_CONFLICT" }, { status: 409 });
    }
    if (result.outcome === "rate_limited") {
      return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }
    if (result.outcome === "missing_skill") {
      return NextResponse.json({ error: "SKILL_NOT_FOUND" }, { status: 404 });
    }
    const count = input.skillIds.length + names.length;
    return NextResponse.json({
      status: "success",
      message: count === 1 ? "Selection recorded" : "Selections recorded",
      duplicate: result.outcome === "duplicate",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "SKILL_SELECTION_CHANGED") {
      return NextResponse.json({ error: "SKILL_NOT_FOUND" }, { status: 409 });
    }
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "INVALID_REQUEST", message: "Failed to record selection" }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
