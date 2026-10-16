/**
 * Stage 2b-ii planner entry point: placements, projects and learner in-app
 * notifications. Pure (no database); it needs the stage 2a plan for people,
 * cohorts, sections and programs. Rows that are not planned appear in the
 * rejection list with a reason code; legacy tables that are deliberately not
 * loaded are listed in NOT_LOADED with their discovery row counts.
 */
import { istNaiveToUtcIso } from "./common";
import { junkChildNameReasons } from "./filters";
import { str, type Row } from "./mappers";
import {
  buildPlacementsPlan,
  item2bii,
  type ExistingCompanies,
  type PlacementFacts,
  type PlacementsPlan,
} from "./plan-placements";
import { buildProjectsPlan, type ProjectFacts, type ProjectsPlan } from "./plan-projects";
import { Collector, type Blocked, type Deferral, type EntityStat, type Plan, type Planned, type Reason, type Rejection } from "./plan";
import type { Snapshot } from "./snapshot";

const ist = (value: unknown) => istNaiveToUtcIso(str(value));
const isTrue = (value: unknown) => value === 1 || value === "1" || value === true;

export type NotificationData = {
  userId: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string | null;
};
export type NotificationEventData = {
  collegeId: string;
  organizationId: string;
  summary: string;
  occurredAt: string | null;
  dedupeKey: string;
  legacyId: string;
};

export type NotificationsPlan = {
  events: Planned<NotificationEventData>[];
  notifications: Planned<NotificationData>[];
  /** legacy notification type -> loaded count (for the report). */
  byType: Record<string, number>;
};

/** Legacy tables that were discovered for NSRIT but are not loaded in 2b-ii, with the reason (counts from discovery). */
export const NOT_LOADED: { table: string; rows: number; reason: string }[] = [
  { table: "notification_outbox", rows: 721, reason: "outbox: never loaded (all PENDING; loading it could send messages)" },
  { table: "project_activity_event", rows: 780, reason: "audit history: skipped by owner decision" },
  { table: "project_resource_audit", rows: 231, reason: "audit history: skipped by owner decision" },
  { table: "project_meeting_history", rows: 44, reason: "audit history: skipped by owner decision" },
  { table: "tpo_audit_log", rows: 73, reason: "audit history: skipped by owner decision" },
  { table: "admin_audit_log", rows: 869, reason: "audit history: skipped by owner decision" },
  { table: "recruiter_lead", rows: 10, reason: "TPO CRM lead (invite tokens must be regenerated): later stage" },
  { table: "recruiter_lead_activity", rows: 17, reason: "TPO CRM: later stage" },
  { table: "recruiter_follow_up", rows: 4, reason: "TPO CRM: later stage" },
  { table: "drive_change_request", rows: 4, reason: "recruiter drive change requests: no loader (requests, not data)" },
  { table: "drive_internal_note", rows: 1, reason: "TPO internal note: later stage (free text about drives)" },
  { table: "drive_group", rows: 1, reason: "shared recruiter form: no vNext table" },
  { table: "placement_announcement", rows: 6, reason: "no vNext table with recipient fan-out and read state" },
  { table: "placement_announcement_recipient", rows: 73, reason: "no vNext table" },
  { table: "placement_announcement_read", rows: 5, reason: "no vNext table" },
  { table: "tpo_message_thread", rows: 3, reason: "TPO collaboration: later stage" },
  { table: "tpo_message", rows: 10, reason: "TPO collaboration: later stage" },
  { table: "tpo_team_thread", rows: 5, reason: "TPO collaboration: later stage" },
  { table: "tpo_team_message", rows: 9, reason: "TPO collaboration: later stage" },
  { table: "tpo_team_ask", rows: 2, reason: "no vNext table" },
  { table: "tpo_team_mention", rows: 2, reason: "no vNext table" },
  { table: "tpo_bell", rows: 23, reason: "TPO bell: TPO account was rejected as test data" },
  { table: "tpo_saved_view", rows: 3, reason: "TPO UI preference: later stage" },
  { table: "tpo_email_campaign", rows: 1, reason: "campaign: a loaded campaign could send; later stage" },
  { table: "tpo_email_campaign_recipient", rows: 2, reason: "campaign: later stage" },
  { table: "tpo_company_outreach", rows: 1, reason: "no exact vNext column" },
  { table: "company_alias / company_domain (as rows)", rows: 12, reason: "kept as map metadata; only the primary domain has a column" },
  { table: "college_public_link", rows: 1, reason: "public join link: token must be regenerated" },
  { table: "college_placements_page", rows: 1, reason: "public page settings: later stage" },
];

/**
 * Names of rejected entities (workspaces, jobs, companies, tasks, templates) that do not also
 * name a loaded entity: a notification that mentions one is about test data.
 */
function rejectedEntityNames(snapshot: Snapshot, c: Collector, placements: PlacementsPlan, projects: ProjectsPlan): string[] {
  const t = snapshot.tables;
  const fields: Record<string, { table: string; columns: string[] }> = {
    project_workspace: { table: "project_workspace", columns: ["title"] },
    job: { table: "job", columns: ["job_title", "company_name"] },
    company: { table: "company", columns: ["name"] },
    project_task: { table: "project_task", columns: ["title"] },
    project_template: { table: "project_template", columns: ["title"] },
  };
  const loaded = new Set<string>([
    ...placements.jobs.map((j) => j.data.title),
    ...placements.companies.map((x) => x.data.name),
    ...projects.instances.map((x) => x.data.title),
    ...projects.tasks.map((x) => x.data.title),
  ].map((v) => v.toLowerCase()));
  const out = new Set<string>();
  for (const r of c.rejections) {
    const spec = fields[r.entity];
    if (!spec) continue;
    const row = (t[spec.table] ?? []).find((x) => String(x.id) === r.legacyId);
    if (!row) continue;
    for (const col of spec.columns) {
      const name = str(row[col])?.toLowerCase();
      if (name && name.length >= 6 && !loaded.has(name)) out.add(name);
    }
  }
  return [...out];
}

function buildNotificationsPlan(
  snapshot: Snapshot,
  base: Plan,
  c: Collector,
  notes: Record<string, number>,
  rejectedNames: string[],
  plannedApplications: Set<string>,
): NotificationsPlan {
  const rows: Row[] = snapshot.tables.notification ?? [];
  if (!snapshot.tables.notification) throw new Error("Snapshot lacks stage 2b-ii table notification: re-run the export");
  c.stat("notification", rows.length);
  const learner = new Map<string, Planned<(typeof base.people)[number]["data"]>>();
  for (const p of base.people) if (p.legacyType === "learner") learner.set(p.legacyId, p);
  const events: Planned<NotificationEventData>[] = [];
  const notifications: Planned<NotificationData>[] = [];
  const byType: Record<string, number> = {};
  for (const row of [...rows].sort((a, b) => Number(a.id) - Number(b.id))) {
    if (isTrue(row.is_deleted)) {
      c.reject("notification", row, "SOFT_DELETED");
      continue;
    }
    if (row.learner_id === null || row.learner_id === undefined || String(row.learner_id) === "") {
      // Faculty or class addressed rows: only learner in-app notifications are loaded.
      c.reject("notification", row, "NO_RECIPIENT");
      continue;
    }
    const lrn = learner.get(String(row.learner_id));
    if (!lrn) {
      c.reject("notification", row, "PERSON_NOT_LOADED");
      continue;
    }
    const title = str(row.title);
    const body = str(row.message);
    if (!title || !body) {
      c.reject("notification", row, "INVALID_VALUE");
      continue;
    }
    // Title and body: E2E tokens and markup only (a real message may say "test" or "QA"); rejected parents are matched by name below.
    const reasons = [...junkChildNameReasons(title), ...junkChildNameReasons(body)];
    if (reasons.length) {
      c.reject("notification", row, reasons[0] as Reason);
      continue;
    }
    const applicationId = row.application_id === null || row.application_id === undefined ? null : String(row.application_id);
    const haystack = `${title} ${body}`.toLowerCase();
    if ((applicationId && !plannedApplications.has(applicationId)) || rejectedNames.some((name) => haystack.includes(name))) {
      c.reject("notification", row, "PARENT_REJECTED");
      continue;
    }
    const createdAt = ist(row.created_at);
    const id = String(row.id);
    const event = item2bii(
      "notification",
      id,
      "activity_events",
      {
        collegeId: base.college.newId,
        organizationId: base.organization.newId,
        summary: title.slice(0, 500),
        occurredAt: createdAt,
        dedupeKey: `legacy-import:nsrit:notification:${id}`,
        legacyId: id,
      },
      { id, title },
    );
    events.push(event);
    const read = isTrue(row.is_read);
    notifications.push(
      item2bii(
        "notification",
        id,
        "in_app_notifications",
        {
          userId: lrn.newId,
          title: title.slice(0, 500),
          body: body.slice(0, 4000),
          readAt: read ? (ist(row.updated_at) ?? createdAt) : null,
          createdAt,
        },
        row,
        {
          unmapped: {
            type: str(row.notification_type),
            contextLabel: str(row.context_label),
            legacyDelivery: str(row.delivery_status),
            classId: row.class_id ?? null,
            courseId: row.course_id ?? null,
            applicationId: row.application_id ?? null,
          },
        },
      ),
    );
    const type = str(row.notification_type) ?? "UNKNOWN";
    byType[type] = (byType[type] ?? 0) + 1;
    c.stat("notification").planned += 1;
  }
  notes.notificationsMarkedRead = notifications.filter((n) => n.data.readAt !== null).length;
  return { events, notifications, byType };
}

export type Plan2bii = {
  placements: PlacementsPlan;
  projects: ProjectsPlan;
  notifications: NotificationsPlan;
  stats: Record<string, EntityStat>;
  rejections: Rejection[];
  deferred: Deferral[];
  blocked: Blocked[];
  notes: Record<string, number>;
  notLoaded: typeof NOT_LOADED;
};

export type Options2bii = {
  asOf: Date;
  externalCompanies?: ExistingCompanies;
  externalContacts?: { phones: Set<string>; emails: Set<string> };
};

export function buildPlan2bii(snapshot: Snapshot, base: Plan, options: Options2bii): Plan2bii {
  const c = new Collector();
  const notes: Record<string, number> = { roundedToInteger: 0 };
  c.stat("recruiter", (snapshot.tables.recruiter ?? []).length);
  const placements = buildPlacementsPlan(snapshot, base, c, options, notes);
  const projects = buildProjectsPlan(snapshot, base, c, { asOf: options.asOf }, notes);
  const notifications = buildNotificationsPlan(
    snapshot,
    base,
    c,
    notes,
    rejectedEntityNames(snapshot, c, placements, projects),
    new Set(placements.applications.map((a) => a.legacyId)),
  );
  // Files stay for a later stage: counts only.
  notes.filesLaterStage_projectResources = notes.projectResourceFilesPending ?? 0;
  notes.filesLaterStage_projectDeliveries = notes.projectDeliveryFileReferences ?? 0;
  notes.filesLaterStage_applicationResumes = placements.unmappedCounts.applicationResumeReferences ?? 0;
  notes.filesLaterStage_offerLetters = placements.unmappedCounts.offerLetterReferences ?? 0;
  return {
    placements,
    projects,
    notifications,
    stats: c.stats,
    rejections: c.rejections,
    deferred: c.deferred,
    blocked: c.blocked,
    notes,
    notLoaded: NOT_LOADED,
  };
}

export type Facts2bii = { placements: PlacementFacts; projects: ProjectFacts };
