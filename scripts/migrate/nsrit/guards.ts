/**
 * Safety guards for the NSRIT loader. The loader is dev/rehearsal tooling:
 *  - it only connects to a loopback database unless an explicit remote-dev
 *    flag AND an environment acknowledgement are both present;
 *  - applying or rolling back needs ALLOW_NSRIT_IMPORT=I_ACCEPT;
 *  - every write statement is checked against a table allowlist, so the
 *    loader can never touch outbox, notification or messaging tables.
 */

export const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
export const REMOTE_DEV_ACK = "I_ACCEPT_DEV_ONLY_NSRIT";
export const APPLY_ACK = "I_ACCEPT";

export class GuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuardError";
  }
}

export type TargetInfo = { host: string; database: string; local: boolean };

export function assertTargetAllowed(
  databaseUrl: string | undefined,
  options: { allowRemoteDev: boolean; env: Record<string, string | undefined> },
): TargetInfo {
  if (!databaseUrl?.trim()) throw new GuardError("DATABASE_URL is required");
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new GuardError("DATABASE_URL is not a valid PostgreSQL URL");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new GuardError("DATABASE_URL must use a PostgreSQL URL");
  }
  for (const key of ["host", "hostaddr", "port", "dbname", "database"]) {
    if (url.searchParams.has(key)) {
      throw new GuardError(`DATABASE_URL query parameter "${key}" could redirect the target`);
    }
  }
  const host = url.hostname.toLowerCase();
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!host) throw new GuardError("DATABASE_URL must include an explicit host");
  if (!database || !/^[a-z0-9_]+$/i.test(database)) {
    throw new GuardError("DATABASE_URL must name a simple database");
  }
  const local = LOOPBACK_HOSTS.has(host);
  if (!local) {
    if (!options.allowRemoteDev) {
      throw new GuardError("Refusing a non-local database: pass --allow-remote-dev (dev only)");
    }
    if (options.env.ALLOW_NSRIT_REMOTE_DEV !== REMOTE_DEV_ACK) {
      throw new GuardError("Remote dev target needs ALLOW_NSRIT_REMOTE_DEV acknowledgement");
    }
    if (/prod/i.test(database) || /prod/i.test(host)) {
      throw new GuardError("Refusing a target that looks like production");
    }
  }
  return { host, database, local };
}

export function assertApplyAllowed(env: Record<string, string | undefined>) {
  if (env.ALLOW_NSRIT_IMPORT !== APPLY_ACK) {
    throw new GuardError("Applying or rolling back needs ALLOW_NSRIT_IMPORT=I_ACCEPT");
  }
}

/** The only tables the loader may INSERT/UPDATE/DELETE. */
export const WRITE_TABLE_ALLOWLIST: ReadonlySet<string> = new Set([
  "organizations",
  "colleges",
  "departments",
  "programs",
  "academic_periods",
  "cohorts",
  "cohort_progression_state",
  "sections",
  "program_terms",
  "lecture_halls",
  "users",
  "college_memberships",
  "membership_roles",
  "learner_profiles",
  "faculty_profiles",
  "learner_program_enrollments",
  "section_enrollments",
  "data_import_batches",
  "legacy_id_map",
  // Stage 2b-i (academics)
  "courses",
  "course_offerings",
  "course_section_deliveries",
  "course_teaching_assignments",
  "faculty_course_associations",
  "course_learning_paths",
  "course_lessons",
  "lesson_contents",
  "course_assignments",
  "assignment_submissions",
  "learner_content_progress",
  "section_schedule_events",
  "section_schedule_event_courses",
  "attendance_sessions",
  "attendance_records",
  "course_quizzes",
  "quiz_questions",
  "quiz_options",
  "quiz_attempts",
  "quiz_attempt_answers",
  "course_discussion_messages",
  "announcements",
  // Stage 2b-ii (placements, projects, learner in-app notifications). Never an outbox,
  // delivery or messaging table: activity_events and in_app_notifications hold the
  // already-delivered learner notifications only.
  "module_access_rules",
  "placement_companies",
  "placement_company_relationships",
  "placement_recruiter_profiles",
  "placement_recruiter_college_grants",
  "placement_seasons",
  "placement_jobs",
  "placement_job_role_options",
  "placement_job_eligibility_policies",
  "placement_job_rounds",
  "placement_hr_interview_slots",
  "placement_applications",
  "placement_application_status_history",
  "placement_application_screenings",
  "placement_application_screening_history",
  "placement_round_results",
  "placement_offers",
  "placement_offer_status_history",
  "placement_batch_lifecycles",
  "placement_batch_registrations",
  "placement_eligibility_decisions",
  "placement_saved_jobs",
  "placement_candidate_preferences",
  "project_templates",
  "project_template_versions",
  "project_template_college_assignments",
  "project_instances",
  "project_releases",
  "project_sprints",
  "project_tasks",
  "project_task_submissions",
  "project_task_comments",
  "project_members",
  "project_resources",
  "project_meetings",
  "project_submissions",
  "project_submission_reviews",
  "project_delivery_events",
  "activity_events",
  "in_app_notifications",
]);

/**
 * Statements allowed ONLY during a rollback, written out in full: the
 * registration audit trail is append-only (immutability trigger plus a
 * restrict foreign key), so undoing a loaded batch must lift that one trigger
 * inside the rollback transaction, delete the audit rows of the mapped
 * registrations and put the trigger back. Nothing else is ever allowed.
 */
export const ROLLBACK_ONLY_STATEMENTS: readonly RegExp[] = [
  /^alter table placement_batch_registration_events (disable|enable) trigger db08_registration_events_no_mutation$/i,
  /^delete from placement_batch_registration_events where registration_id in \(select new_id from legacy_id_map where batch_id = \$1 and college_id = \$2 and new_entity_type = 'placement_batch_registrations'\)$/i,
];

const WRITE_STATEMENT =
  /^(insert\s+into|update|delete\s+from)\s+(?:only\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?/i;

/** Throws unless a statement is read-only or writes an allowlisted table. */
export function assertStatementAllowed(sql: string) {
  const text = sql.trim();
  if (ROLLBACK_ONLY_STATEMENTS.some((re) => re.test(text.replace(/\s+/g, " ")))) return;
  if (/^(select|begin|commit|rollback|savepoint|release|show|set\s+local)\b/i.test(text)) return;
  const match = WRITE_STATEMENT.exec(text);
  if (!match) {
    throw new GuardError("Statement is neither read-only nor an allowlisted write");
  }
  const table = match[2].toLowerCase();
  if (!WRITE_TABLE_ALLOWLIST.has(table)) {
    throw new GuardError(`Write to table ${table} is not allowed for the NSRIT loader`);
  }
}

/** Error text that cannot leak row values (pg detail fields are never printed). */
export function safeErrorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    ["GuardError", "LoadAbort", "SnapshotIntegrityError"].includes(error.name)
  ) {
    return error.message;
  }
  const e = error as {
    code?: string;
    constraint?: string;
    table?: string;
    column?: string;
    message?: string;
  };
  const parts = [`pg error ${e.code ?? "?"}`];
  if (e.table) parts.push(`table=${e.table}`);
  if (e.constraint) parts.push(`constraint=${e.constraint}`);
  if (e.column) parts.push(`column=${e.column}`);
  // Messages from class 22 (data exception) can echo the offending value.
  if (e.message && !String(e.code ?? "").startsWith("22") && !e.constraint) {
    parts.push(e.message.slice(0, 200));
  }
  return parts.join(" ");
}
