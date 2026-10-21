import "server-only";

import {
  sql,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import {
  parseActivityDateBoundary,
} from "@/modules/activity/date-boundary";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
} from "@/modules/permissions/policy";

import {
  TPO_AUDIT_KINDS,
  tpoAuditAboutCategory,
  summarizeTpoAuditKinds,
  tpoAuditActorLabel,
  type TpoAuditKind,
} from "./tpo-audit-model";
import { requirePlacementManageScope } from "./scope";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {tpoAuditEntityHref} from "./tpo-audit-entity-link-model";
import { placementTableExists } from "./staged-tables";

const dateSchema = z.iso.date();

/** Original LMS filterModel stores a checklist as f_key=a,b.
 * Each item is URI-encoded separately; server callers can also pass arrays.
 * Validate and bound the options before using parameterized SQL.
 */
const auditFacetSchema = z.preprocess((raw) => {
  if (raw === undefined || raw === null || raw === "") return [];
  const values = Array.isArray(raw) ? raw : String(raw).split(",");
  return values.map((item) => {
    const value = String(item).trim();
    try { return decodeURIComponent(value); } catch { return value; }
  }).filter(Boolean);
}, z.array(z.string().trim().min(1).max(120)).max(40).default([]));

/** Legacy TPO entity to vNext recorded-source crosswalk.
 * DRIVE / RECRUITER_LEAD / SETTINGS / BULK => activity_events.
 * STUDENT => application and screening histories.
 * ROUND => round events and round results.
 * OFFER => offer and joining histories; SHARE => share events.
 * Readers preserve all source IDs. One business mutation can generate both
 * an activity row and a domain-history row: counts are rows, not unique acts.
 * The writers are responsible for atomic persistence; this read query cannot
 * synthesize operations that were never recorded. No old-LMS data migration.
 */
export const TPO_AUDIT_SOURCE_CROSSWALK = {
  ACTIVITY: ["DRIVE", "RECRUITER_LEAD", "SETTINGS", "BULK", "GENERAL"],
  APPLICATION: ["STUDENT", "DRIVE"],
  SCREENING: ["STUDENT", "ROUND"],
  ROUND: ["ROUND"], RESULT: ["ROUND"], OFFER: ["OFFER"],
  JOINING: ["OFFER"], SHARE: ["SHARE"],
} as const;

export const tpoAuditQuerySchema = z
  .object({
    kind: z
      .enum(["ALL", ...TPO_AUDIT_KINDS])
      .default("ALL"),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    q: z.string().trim().max(120, "Search is limited to 120 characters").default(""),
    who: z.string().trim().max(120, "Actor search is limited to 120 characters").default(""),
    // Legacy checklist filters: OR inside each facet, AND between facets.
    f_about: auditFacetSchema,
    f_event: auditFacetSchema,
    f_who: auditFacetSchema,
    f_when: auditFacetSchema,
    page: z.coerce
      .number()
      .int()
      .min(1)
      .max(10000)
      .default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25),
  })
  .strict()
  .superRefine((query, ctx) => {
    if (
      query.from &&
      query.to &&
      query.from > query.to
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message:
          "The end date must not precede the start date",
      });
    }
  });

export type TpoAuditQuery = z.infer<
  typeof tpoAuditQuerySchema
>;

export type TpoAuditRow = {
  id: string;
  kind: TpoAuditKind;
  eventType: string;
  title: string;
  detail: string;
  occurredAt: string;
  jobId: string | null;
  entityHref?: string | null;
  actorName: string;
  /** Old audit-log field names, deliberately keeping private actor IDs out. */
  actorType: "USER" | "SYSTEM";
  actorId: null;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  sourceKind: TpoAuditKind;
  sourceId: string;
};

type AuditSource = {
  kind: TpoAuditKind;
  statement: SQL;
};

type CountRow = {
  kind: TpoAuditKind;
  total: number | string;
};

type AuditDbRow = {
  id: string;
  kind: TpoAuditKind;
  eventType: string;
  title: string;
  detail: string;
  occurredAt: Date | string;
  jobId: string | null;
  subjectType:string|null;
  subjectId:string|null;
  actorName: string | null;
  actorIdPresent: boolean;
};

/**
 * Every UNION arm independently restricts its source
 * to the current TPO college. The outer filters never
 * determine tenant authorization.
 *
 * Only allowlisted operational values are projected:
 * category, status/action, placement job title, time
 * and an optional job ID.
 *
 * Only the actor's display name is exposed (not actor IDs, email or phone).
 * Deliberately excluded:
 * - recipient emails and share secrets;
 * - IP addresses and activity metadata;
 * - free-text rejection reasons, comments and notes;
 * - applicant, recruiter and learner identifiers.
 *
 * Canonical activity rows and domain history rows may
 * represent the same action. They are retained as
 * separately attributed source records, not silently
 * deduplicated or presented as unique user actions.
 */
function auditSources(
  collegeId: string,
  shareAvailable: boolean,
): AuditSource[] {
  const sources: AuditSource[] = [
    {
      kind: "ACTIVITY",
      statement: sql`
        select
          ae.id as event_id,
          'ACTIVITY'::text as kind,
          ae.event_type::text as event_type,
          case
           when ae.subject_type in ('placement_job','placement_season')
             then coalesce(nullif(trim(ae.subject_label),''),'Placement activity')
           else coalesce(nullif(trim(ae.subject_label),''),nullif(trim(ae.summary),''),'Placement activity')
          end::text as title,
          case
           when ae.event_type = 'PLACEMENTS_COLLEGE_RULES_UPDATED'
             then concat('Held offers: ',
              coalesce(ae.metadata->'to'->>'maxHeldOffers','unknown'),
              ' · Uplift: ',coalesce(ae.metadata->'to'->>'upliftPct','unknown'),
              '% · Response hours: ',
              coalesce(ae.metadata->'to'->>'minResponseHours','unknown'))
           when ae.event_type = 'placements.tpo_college_rules.changed'
             then concat(
              'Placed at: ',coalesce(ae.metadata->>'countsAsPlacedAt','not recorded'),
              ' · Held offers: ',coalesce(ae.metadata->>'maxHeldOffers','not recorded'),
              ' · Uplift: ',coalesce(ae.metadata->>'upliftPct','not recorded'),
              '% · Response hours: ',coalesce(ae.metadata->>'minResponseHours','not recorded'))
           when ae.event_type = 'placements.tpo_company_visibility.changed'
             then concat(
              'Exact CGPA: ',coalesce(ae.metadata->>'showCgpaExact','not recorded'),
              ' · 10th/12th: ',coalesce(ae.metadata->>'showTenthTwelfth','not recorded'),
              ' · Project links: ',coalesce(ae.metadata->>'showProjectLinks','not recorded'),
              ' · Assessment scores: ',coalesce(ae.metadata->>'showAssessmentScores','not recorded'),
              ' · Attendance: ',coalesce(ae.metadata->>'showAttendance','not recorded'))
           when ae.event_type = 'PLACEMENTS_SEASON_DETAILS_UPDATED'
             then concat('Season: ',coalesce(ae.metadata->'after'->>'name','unknown'),
              ' · Ends: ',coalesce(ae.metadata->'after'->>'endDate','unknown'))
           else coalesce(nullif(trim(ae.summary),''),'Recorded placement event')
          end::text as detail,
          ae.occurred_at as occurred_at,
          null::uuid as job_id,
          ae.subject_type::text as subject_type,
          ae.subject_id::text as subject_id,
          ae.actor_user_id as actor_user_id
        from activity_events ae
        where ae.college_id = ${collegeId}
          and ae.module = 'PLACEMENTS'
      `,
    },
    {
      kind: "APPLICATION",
      statement: sql`
        select
          history.id as event_id,
          'APPLICATION'::text as kind,
          history.to_status::text as event_type,
          job.title::text as title,
          concat(
            coalesce(history.from_status, 'START'),
            ' → ',
            history.to_status
          )::text as detail,
          history.created_at as occurred_at,
          job.id as job_id,
          null::text as subject_type,
          null::text as subject_id,
          history.actor_user_id as actor_user_id
        from placement_application_status_history history
        inner join placement_applications application
          on application.id = history.application_id
        inner join placement_jobs job
          on job.id = application.job_id
        where job.college_id = ${collegeId}
      `,
    },
    {
      kind: "SCREENING",
      statement: sql`
        select
          history.id as event_id,
          'SCREENING'::text as kind,
          history.to_status::text as event_type,
          job.title::text as title,
          concat(
            history.from_status,
            ' → ',
            history.to_status
          )::text as detail,
          history.created_at as occurred_at,
          job.id as job_id,
          null::text as subject_type,
          null::text as subject_id,
          history.actor_user_id as actor_user_id
        from placement_application_screening_history history
        inner join placement_applications application
          on application.id = history.application_id
        inner join placement_jobs job
          on job.id = application.job_id
        where job.college_id = ${collegeId}
      `,
    },
    {
      kind: "ROUND",
      statement: sql`
        select
          event.id as event_id,
          'ROUND'::text as kind,
          event.event_type::text as event_type,
          job.title::text as title,
          'Placement round change'::text as detail,
          event.created_at as occurred_at,
          job.id as job_id,
          null::text as subject_type,
          null::text as subject_id,
          event.actor_user_id as actor_user_id
        from placement_job_round_events event
        inner join placement_job_rounds round_record
          on round_record.id = event.round_id
        inner join placement_jobs job
          on job.id = round_record.job_id
        where job.college_id = ${collegeId}
      `,
    },
    {
      kind: "RESULT",
      statement: sql`
        select
          result.id as event_id,
          'RESULT'::text as kind,
          result.status::text as event_type,
          job.title::text as title,
          concat(
            'Outcome ',
            result.outcome,
            ' · version ',
            result.version
          )::text as detail,
          result.submitted_at as occurred_at,
          job.id as job_id,
          null::text as subject_type,
          null::text as subject_id,
          coalesce(result.applied_by_user_id,result.submitted_by_user_id) as actor_user_id
        from placement_round_results result
        inner join placement_job_rounds round_record
          on round_record.id = result.round_id
        inner join placement_jobs job
          on job.id = round_record.job_id
        where job.college_id = ${collegeId}
      `,
    },
    {
      kind: "OFFER",
      statement: sql`
        select
          history.id as event_id,
          'OFFER'::text as kind,
          history.to_status::text as event_type,
          job.title::text as title,
          concat(
            coalesce(history.from_status, 'START'),
            ' → ',
            history.to_status
          )::text as detail,
          history.created_at as occurred_at,
          job.id as job_id,
          null::text as subject_type,
          null::text as subject_id,
          history.actor_user_id as actor_user_id
        from placement_offer_status_history history
        inner join placement_offers offer_record
          on offer_record.id = history.offer_id
        inner join placement_applications application
          on application.id = offer_record.application_id
        inner join placement_jobs job
          on job.id = application.job_id
        where job.college_id = ${collegeId}
      `,
    },
    {
      kind: "JOINING",
      statement: sql`
        select
          history.id as event_id,
          'JOINING'::text as kind,
          history.to_status::text as event_type,
          job.title::text as title,
          concat(
            history.from_status,
            ' → ',
            history.to_status
          )::text as detail,
          history.created_at as occurred_at,
          job.id as job_id,
          null::text as subject_type,
          null::text as subject_id,
          history.actor_user_id as actor_user_id
        from placement_joining_history history
        inner join placement_offers offer_record
          on offer_record.id = history.offer_id
        inner join placement_applications application
          on application.id = offer_record.application_id
        inner join placement_jobs job
          on job.id = application.job_id
        where job.college_id = ${collegeId}
      `,
    },
  ];

  if (shareAvailable) {
    sources.push({
      kind: "SHARE",
      statement: sql`
        select
          event.id as event_id,
          'SHARE'::text as kind,
          event.action::text as event_type,
          job.title::text as title,
          'Recruiter share access event'::text as detail,
          event.created_at as occurred_at,
          job.id as job_id,
          null::text as subject_type,
          null::text as subject_id,
          null::uuid as actor_user_id
        from placement_tpo_share_events event
        inner join placement_tpo_share_links share_record
          on share_record.id = event.share_id
        inner join placement_jobs job
          on job.id = share_record.job_id
        where share_record.college_id = ${collegeId}
          and job.college_id = ${collegeId}
      `,
    });
  }

  return sources;
}

function auditDateFilters(
  query: TpoAuditQuery,
): SQL {
  const conditions: SQL[] = [];

  if (query.from) {
    conditions.push(
      sql`record.occurred_at >= ${
        parseActivityDateBoundary(
          query.from,
          "from",
        )
      }`,
    );
  }

  if (query.to) {
    conditions.push(
      sql`record.occurred_at <= ${
        parseActivityDateBoundary(
          query.to,
          "to",
        )
      }`,
    );
  }

  // Original LMS: OR within each filter checklist; AND between checklists.
  // Every value is a bound SQL parameter, including multi-value URL facets.
  const aboutText = sql`upper(coalesce(record.event_type, '') || ' ' || coalesce(record.subject_type, ''))`;
  const about = sql`case
    when record.kind = 'SHARE' or ${aboutText} like '%SHARE%' or ${aboutText} like '%DOWNLOAD%' then 'SHARE'
    when ${aboutText} like '%BULK%' then 'BULK'
    when ${aboutText} like '%SETTINGS%' or ${aboutText} like '%RULES%' or ${aboutText} like '%CONFIG%' then 'SETTINGS'
    when ${aboutText} like '%RECRUITER%' or ${aboutText} like '%LEAD%' then 'RECRUITER_LEAD'
    when ${aboutText} like '%STUDENT%' or ${aboutText} like '%LEARNER%' then 'STUDENT'
    when record.kind in ('OFFER', 'JOINING') or ${aboutText} like '%OFFER%' then 'OFFER'
    when record.kind in ('ROUND', 'RESULT') or ${aboutText} like '%ROUND%' or ${aboutText} like '%RESULT%' then 'ROUND'
    when ${aboutText} like '%DRIVE%' or ${aboutText} like '%JOB%' or ${aboutText} like '%APPLICATION%' then 'DRIVE'
    else 'GENERAL' end`;
  if (query.f_about.length) {
    conditions.push(sql`${about} in (${sql.join(query.f_about.map((value) => sql`${value.toUpperCase()}`), sql`, `)})`);
  }
  if (query.f_event.length) {
    const actions = query.f_event.map((value) => sql`(
      lower(record.event_type) = ${value.toLowerCase()}
      or lower(replace(replace(record.event_type, '_', ' '), '.', ' ')) = ${value.toLowerCase()}
      or lower(record.detail) = ${value.toLowerCase()}
    )`);
    conditions.push(sql`(${sql.join(actions, sql` or `)})`);
  }
  if (query.f_who.length) {
    const actors = query.f_who.map((value) => sql`lower(coalesce(
      nullif(trim(actor.display_name), ''),
      case when record.actor_user_id is null then 'System'
        else 'Account no longer available' end)) = ${value.toLowerCase()}`);
    conditions.push(sql`(${sql.join(actors, sql` or `)})`);
  }
  if (query.f_when.length) {
    const localTime = sql`(record.occurred_at at time zone 'Asia/Kolkata')`;
    const localNow = sql`(now() at time zone 'Asia/Kolkata')`;
    const when: SQL[] = [];
    for (const value of query.f_when) {
      if (value === 'TODAY') when.push(sql`${localTime} >= date_trunc('day', ${localNow})`);
      else if (value === 'WEEK') when.push(sql`${localTime} > ${localNow} - interval '7 days'`);
      else if (value === 'MONTH') when.push(sql`${localTime} > ${localNow} - interval '30 days'`);
      else if (value === 'OLDER') when.push(sql`${localTime} <= ${localNow} - interval '30 days'`);
    }
    conditions.push(when.length ? sql`(${sql.join(when, sql` or `)})` : sql`false`);
  }
  if (query.who) conditions.push(sql`position(lower(${query.who}) in lower(coalesce(actor.display_name,''))) > 0`);
  if (query.q) {
    conditions.push(sql`
      (
        position(
          lower(${query.q}) in lower(record.title)
        ) > 0
        or position(
          lower(${query.q}) in lower(record.event_type)
        ) > 0
        or position(
          lower(${query.q}) in lower(record.detail)
        ) > 0
        or position(
          lower(${query.q}) in lower(record.kind)
        ) > 0
        or position(lower(${query.q}) in lower(coalesce(actor.display_name,''))) > 0
      )
    `);
  }

  return conditions.length
    ? sql`where ${sql.join(
        conditions,
        sql` and `,
      )}`
    : sql``;
}

/**
 * Authenticated, read-only TPO audit feed.
 *
 * The college ID comes exclusively from the active TPO
 * membership, never from query parameters or a caller-
 * supplied college ID.
 */
export async function getTpoAuditLog(
  context: RequestContext,
  rawQuery: unknown = {},
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    throw new AuthorizationError(
      "placements.manage",
    );
  }

  const query =
    tpoAuditQuerySchema.parse(rawQuery);

  const collegeId =
    context.membership.collegeId;

  await requirePlacementManageScope(
    context,
    collegeId,
  );
  // The audit includes private company and student activity. A TPO cookie
  // remains valid after role removal, so check the persisted active actor
  // before probing tables or executing any history UNION arm.
  const liveCollegeId=await requireTpoBatchActor(context);
  if(liveCollegeId!==collegeId)throw new AuthorizationError("placements.manage");

  const [shareEventsExists, shareLinksExist] =
    await Promise.all([
      placementTableExists(
        "placement_tpo_share_events",
      ),
      placementTableExists(
        "placement_tpo_share_links",
      ),
    ]);

  const shareAvailable =
    shareEventsExists && shareLinksExist;

  const allSources = auditSources(
    collegeId,
    shareAvailable,
  );

  const selectedSources =
    query.kind === "ALL"
      ? allSources
      : allSources.filter(
          (source) =>
            source.kind === query.kind,
        );

  const unavailableSources =
    shareAvailable
      ? []
      : (["SHARE"] as const);

  if (selectedSources.length === 0) {
    return {
      query,
      items: [] as TpoAuditRow[],
      summary: summarizeTpoAuditKinds([]),
      page: query.page,
      pageSize: query.pageSize,
      totalPages: 1,
      unavailableSources,
      snapshotLimit: query.from || query.to ? 5000 : 500,
      exportTruncated: false,
      matchedCount: 0,
    };
  }

  const union = sql.join(
    selectedSources.map(
      (source) => source.statement,
    ),
    sql` union all `,
  );

  const where = auditDateFilters(query);
  const offset =
    (query.page - 1) * query.pageSize;

  const db = getDb();

  const [countsResult, eventsResult] =
    await Promise.all([
      db.execute<CountRow>(sql`
        with audit as (${union})
        select
          record.kind as kind,
          count(*)::int as total
        from audit record
        left join users actor on actor.id = record.actor_user_id
        ${where}
        group by record.kind
      `),
      db.execute<AuditDbRow>(sql`
        with audit as (${union})
        select
          record.event_id::text as id,
          record.kind as kind,
          record.event_type as "eventType",
          record.title as title,
          record.detail as detail,
          record.occurred_at as "occurredAt",
          record.job_id::text as "jobId",
          record.subject_type as "subjectType",
          record.subject_id as "subjectId",
          actor.display_name::text as "actorName",
          (record.actor_user_id is not null) as "actorIdPresent"
        from audit record
        left join users actor on actor.id = record.actor_user_id
        ${where}
        order by
          record.occurred_at desc,
          record.event_id desc,
          record.kind asc
        limit ${query.pageSize}
        offset ${offset}
      `),
    ]);

  const summary =
    summarizeTpoAuditKinds(
      countsResult.rows.map((row) => ({
        kind: row.kind,
        total: Number(row.total),
      })),
    );

  const items: TpoAuditRow[] =
    eventsResult.rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      eventType: row.eventType,
      title: row.title,
      detail: row.detail,
      occurredAt:
        row.occurredAt instanceof Date
          ? row.occurredAt.toISOString()
          : new Date(
              row.occurredAt,
            ).toISOString(),
      jobId: row.jobId,
      entityHref:row.subjectType&&row.subjectId?tpoAuditEntityHref(row.subjectType,row.subjectId):
       row.jobId?tpoAuditEntityHref("placement_job",row.jobId):null,
      actorName: row.actorName?.trim() || (row.actorIdPresent
        ? "Account no longer available"
        : tpoAuditActorLabel(null, "SYSTEM")),
      actorType: row.actorIdPresent ? "USER" : "SYSTEM",
      actorId: null,
      action: row.eventType,
      entityType: tpoAuditAboutCategory(row.eventType, row.subjectType),
      entityId: row.subjectType === "placement_job" ? row.subjectId : row.jobId,
      createdAt: row.occurredAt instanceof Date
        ? row.occurredAt.toISOString() : new Date(row.occurredAt).toISOString(),
      sourceKind: row.kind,
      sourceId: row.id,
    }));

  return {
    query,
    items,
    summary,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(
      1,
      Math.ceil(
        summary.total / query.pageSize,
      ),
    ),
    unavailableSources,
    snapshotLimit: query.from || query.to ? 5000 : 500,
    exportTruncated: summary.total > (query.from || query.to ? 5000 : 500),
    matchedCount: summary.total,
  };
}

