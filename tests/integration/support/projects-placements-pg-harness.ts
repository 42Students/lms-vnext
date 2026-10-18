/**
 * Reusable, rollback-only real PostgreSQL fixtures for Projects + Placements.
 * PROJ-HARNESS-01. Import from tests/integration/*; NEVER import in product code.
 *
 * Deliberately requires TEST_DATABASE_URL, a disposable database named *test*
 * or *ci*, and the registered migration tables. Never falls back to DATABASE_URL
 * and never commits. Fixture writes are on the SAME PoolClient as assertions.
 * Integration services using getDb() instead need isolated disposable DB cleanup,
 * since a separate connection cannot see these uncommitted rows.
 */
import { randomUUID } from "node:crypto";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

export type PgHarness = {
  client: PoolClient;
  runId: string;
  query<T extends QueryResultRow = QueryResultRow>(sql: string, values?: unknown[]): Promise<T[]>;
  /** SQLSTATE assertion uses a SAVEPOINT: error never poisons the outer TX. */
  expectSqlState(operation: () => Promise<unknown>, code: string): Promise<void>;
  /** Roll back only this sub-operation and continue the same test transaction. */
  savepoint<T>(fn: () => Promise<T>, rollback?: boolean): Promise<T>;
};

export type TenantFixture = { organizationId: string; collegeId: string };
export type PrincipalFixture = {
  userId: string; membershipId: string | null; collegeId: string | null;
  roles: readonly string[];
};
export type ProjectFixture = {
  templateId: string; versionId: string; assignmentId: string;
  projectId: string; workspaceId: string; releaseId: string; sprintId: string;
  taskId: string; resourceId: string; mentorMemberId: string; learnerMemberId: string;
};
export type PlacementFixture = {
  companyId: string; relationshipId: string; seasonId: string; driveId: string; jobId: string; roundId: string; roleOptionId: string;
};
export type RecruiterFixture = {
  userId: string; companyId: string; relationshipId: string; grantId: string;
};

const REQUIRED_TABLES = [
  "organizations","colleges","users","college_memberships","membership_roles","system_roles",
  "project_templates","project_template_versions","project_template_college_assignments",
  "project_instances","project_releases","project_sprints","project_tasks","project_resources",
  "project_members","project_task_submissions","project_submissions","project_delivery_events",
  "project_submission_reviews","project_evaluations","project_evaluation_items","project_meetings",
  "placement_companies","placement_company_relationships","placement_recruiter_profiles",
  "placement_recruiter_college_grants","placement_seasons","placement_jobs","placement_job_role_options","placement_job_rounds",
  "placement_applications","placement_application_screenings","placement_round_results",
  "placement_offers","placement_joining_outcomes",
] as const;

function clearlyDisposableDatabaseName(name: string): boolean {
  // Avoid substring "ci" in "financial" or "test" in "contest" accidentally
  // authorising access to a real data store.
  return /(?:^|[_-])(?:test|testing|ci|tmp)(?:$|[_-])/i.test(name) &&
    !/(?:prod|production|live|staging)/i.test(name);
}

export function disposableDatabaseUrl(): string {
  const raw = process.env.TEST_DATABASE_URL;
  if (!raw) throw new Error("PROJ-HARNESS: set an explicit disposable TEST_DATABASE_URL (DATABASE_URL is never used)");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("PROJ-HARNESS: TEST_DATABASE_URL must be a PostgreSQL URL"); }
  const dbName = decodeURIComponent(url.pathname.slice(1));
  if (!["postgres:","postgresql:"].includes(url.protocol) ||
      !clearlyDisposableDatabaseName(dbName)) {
    throw new Error("PROJ-HARNESS: refusing database without a clearly disposable test/ci/tmp name");
  }
  return raw;
}

export function newHarnessPool(): Pool {
  return new Pool({ connectionString: disposableDatabaseUrl(), max: 2,
    connectionTimeoutMillis: 5000, idleTimeoutMillis: 1000 });
}
export async function assertHarnessSchema(client: PoolClient): Promise<void> {
  const name = await client.query<{name: string}>("select current_database() as name");
  if (!clearlyDisposableDatabaseName(name.rows[0]?.name ?? "")) {
    throw new Error("PROJ-HARNESS: refusing non-test PostgreSQL database");
  }
  const requiredColumns = [
    ["project_members", "ended_at"],
    ["project_members", "can_mutate"],
    ["project_submissions", "submitted_by_membership_id"],
    ["project_delivery_events", "actor_membership_id"],
    ["project_sprints", "start_date"],
    ["project_instances", "status"],
    ["project_templates", "published_version"],
    ["project_releases", "status"],
    ["placement_jobs", "application_deadline"],
    ["placement_jobs", "minimum_annual_ctc_inr"],
    ["placement_job_role_options", "is_primary"],
    ["placement_applications", "role_option_id"],
    ["placement_job_rounds", "cancelled_at"],
    ["placement_seasons", "status"],
    ["placement_recruiter_profiles", "company_id"],
    ["placement_recruiter_college_grants", "verification_status"],
    ["placement_recruiter_college_grants", "valid_until"],
  ] as const;
  const missingColumns = await client.query<{tbl: string; col: string}>(`
    select req.tbl, req.col
      from unnest($1::text[], $2::text[]) as req(tbl, col)
      left join information_schema.columns c
        on c.table_schema = 'public'
       and c.table_name = req.tbl and c.column_name = req.col
     where c.column_name is null`,
    [requiredColumns.map(pair => pair[0]), requiredColumns.map(pair => pair[1])],
  );
  if (missingColumns.rows.length) throw new Error(
    "PROJ-HARNESS: registered migration columns missing: " +
    missingColumns.rows.map(row => row.tbl + "." + row.col).join(", "),
  );
  const tables = await client.query<{name: string; reg: string|null}>(
    "select t.name, to_regclass('public.' || t.name)::text as reg from unnest($1::text[]) t(name)",
    [REQUIRED_TABLES],
  );
  const missing = tables.rows.filter(row => !row.reg).map(row => row.name);
  if (missing.length) throw new Error("PROJ-HARNESS: registered migrations missing: " + missing.join(", "));
}

/** Each invocation owns a connection + outer transaction and ALWAYS rolls it back.
 * No test can accidentally persist fixture data, even when assertions throw.
 */
export async function withProjectPg<T>(pool: Pool, action: (db: PgHarness) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  let begun = false;
  let savepointCounter = 0;
  try {
    await assertHarnessSchema(client);
    await client.query("BEGIN");
    begun = true;
    // A connection-string options=search_path setting must not redirect
    // fixture writes to another schema after validating public tables.
    await client.query("SET LOCAL search_path = public, pg_temp");
    const db: PgHarness = {
      client, runId: randomUUID(),
      async query<T extends QueryResultRow>(sql: string, values?: unknown[]) {
        return (await client.query<T>(sql, values)).rows;
      },
      async savepoint<T>(fn: () => Promise<T>, rollback = false): Promise<T> {
        const name = "harness_sp_" + ++savepointCounter;
        await client.query("SAVEPOINT " + name);
        try {
          const result = await fn();
          await client.query(rollback ? "ROLLBACK TO SAVEPOINT " + name : "RELEASE SAVEPOINT " + name);
          if (rollback) await client.query("RELEASE SAVEPOINT " + name);
          return result;
        } catch (error) {
          await client.query("ROLLBACK TO SAVEPOINT " + name);
          await client.query("RELEASE SAVEPOINT " + name);
          throw error;
        }
      },
      async expectSqlState(operation: () => Promise<unknown>, code: string) {
        let failed = false;
        await db.savepoint(async () => {
          try { await operation(); } catch (error) {
            failed = true;
            if ((error as {code?: string}).code !== code) {
              throw new Error("PROJ-HARNESS: expected SQLSTATE " + code +
                " but received " + ((error as {code?: string}).code ?? "unknown"), { cause: error });
            }
          }
          if (!failed) throw new Error("PROJ-HARNESS: expected SQLSTATE " + code + " but operation succeeded");
        }, true);
      },
    };
    return await action(db);
  } finally {
    try { if (begun) await client.query("ROLLBACK"); } finally { client.release(); }
  }
}

/** Two real PostgreSQL sessions for races/tenant reads against *already committed*
 * seed records in the disposable DB. Uncommitted withProjectPg fixtures are NOT
 * visible here. Both sessions always roll back, even when a race throws.
 */
export async function withTwoPgSessions<T>(
  pool: Pool, run: (a: PoolClient, b: PoolClient) => Promise<T>,
): Promise<T> {
  const a = await pool.connect();
  let b: PoolClient | undefined;
  let aStarted = false, bStarted = false;
  try {
    await assertHarnessSchema(a);
    b = await pool.connect();
    await assertHarnessSchema(b);
    await a.query("BEGIN"); aStarted = true;
    await b.query("BEGIN"); bStarted = true;
    await a.query("SET LOCAL search_path = public, pg_temp");
    await b.query("SET LOCAL search_path = public, pg_temp");
    await a.query("SET LOCAL lock_timeout = '1500ms'");
    await b.query("SET LOCAL lock_timeout = '1500ms'");
    return await run(a,b);
  } finally {
    try {
      if (b && bStarted) await b.query("ROLLBACK");
    } finally {
      try {
        if (aStarted) await a.query("ROLLBACK");
      } finally {
        b?.release();
        a.release();
      }
    }
  }
}

/** For FK and business invariants, use truly separate orgs + colleges. */
export async function createTenant(db: PgHarness, name = "College"): Promise<TenantFixture> {
  const tag = randomUUID();
  const org = await db.query<{id: string}>(
    "insert into organizations (name) values ($1) returning id",
    ["Projects harness " + tag],
  );
  const college = await db.query<{id: string}>(
    "insert into colleges (organization_id,name,code) values ($1,$2,$3) returning id",
    [org[0]!.id, name, "PHT-" + tag.slice(0, 12)],
  );
  return { organizationId: org[0]!.id, collegeId: college[0]!.id };
}

/** Two colleges in one organization must still be isolated; this fixture
 * intentionally reuses only the parent organization, never memberships.
 */
export async function createSiblingCollege(db: PgHarness, parent: TenantFixture,
  name = "Sibling test college"): Promise<TenantFixture> {
  const suffix = randomUUID().slice(0, 12);
  const [row] = await db.query<{id:string}>(`
    insert into colleges (organization_id,name,code)
    values ($1,$2,$3) returning id`,
    [parent.organizationId,name,"PHS-"+suffix]);
  return { organizationId:parent.organizationId, collegeId:row!.id };
}

export async function createPrincipal(db: PgHarness, tenant: TenantFixture | null,
  roles: readonly ("COLLEGE_ADMIN"|"MENTOR"|"LEARNER"|"FACULTY"|"TPO")[] = [],
  systemRole = false): Promise<PrincipalFixture> {
  if (roles.length && !tenant) throw new Error("PROJ-HARNESS: roles require a tenant");
  const uid = randomUUID();
  const users = await db.query<{id: string}>(
    "insert into users (identity_uid,display_name) values ($1,$2) returning id",
    ["proj-harness-" + uid, "Harness " + uid.slice(0,8)],
  );
  const userId = users[0]!.id;
  if (systemRole) await db.query(
    "insert into system_roles (user_id,role) values ($1,'SUPER_ADMIN')", [userId]);
  let membershipId: string | null = null;
  if (tenant) {
    const member = await db.query<{id: string}>(
      "insert into college_memberships (user_id,college_id) values ($1,$2) returning id",
      [userId, tenant.collegeId],
    );
    membershipId = member[0]!.id;
    for (const role of new Set(roles)) await db.query(
      "insert into membership_roles (membership_id,role) values ($1,$2)", [membershipId, role]);
  }
  return {userId,membershipId,collegeId:tenant?.collegeId ?? null,roles};
}

/** Fixtures must not silently promote an inactive or wrong-role user into
 * a product graph. Role arrays supplied by tests are hints, never authority. */
async function requireFixtureCollegePrincipal(
  db: PgHarness, collegeId: string, actor: PrincipalFixture, roles: readonly string[],
): Promise<void> {
  if (!actor.membershipId || actor.collegeId !== collegeId ||
      !roles.some(role => actor.roles.includes(role))) {
    throw new Error("PROJ-HARNESS: actor role or college does not match fixture");
  }
  const rows = await db.query<{ id: string }>(`
    select cm.id from college_memberships cm
      join users u on u.id = cm.user_id
      join membership_roles mr on mr.membership_id = cm.id
      join colleges c on c.id = cm.college_id
      join organizations org on org.id = c.organization_id
     where cm.id = $1 and cm.college_id = $2 and u.id = $3
       and cm.status = 'ACTIVE' and u.platform_status = 'ACTIVE'
       and c.status = 'ACTIVE' and org.status = 'ACTIVE'
       and mr.role = any($4::membership_role[])
     limit 1`, [actor.membershipId, collegeId, actor.userId, roles]);
  if (!rows.length) throw new Error("PROJ-HARNESS: actor is not an active member in the required role");
}

/** Canonical project workspace graph, referencing the ACTUAL migration tables.
 * Cross-tenant tests should create two of these in distinct tenants.
 */
export async function createProjectFixture(db: PgHarness, tenant: TenantFixture,
  author: PrincipalFixture, mentor: PrincipalFixture, learner: PrincipalFixture): Promise<ProjectFixture> {
  if (author.collegeId !== tenant.collegeId || mentor.collegeId !== tenant.collegeId ||
      learner.collegeId !== tenant.collegeId || !mentor.membershipId || !learner.membershipId) {
    throw new Error("PROJ-HARNESS: project actors must belong to the fixture's college");
  }
  await requireFixtureCollegePrincipal(db, tenant.collegeId, author, ["COLLEGE_ADMIN"]);
  await requireFixtureCollegePrincipal(db, tenant.collegeId, mentor, ["MENTOR"]);
  await requireFixtureCollegePrincipal(db, tenant.collegeId, learner, ["LEARNER"]);
  const suffix = randomUUID().slice(0,12);
  const [template] = await db.query<{id:string}>(`
    insert into project_templates (slug,title,created_by_user_id)
    values ($1,$2,$3) returning id`, ["ph-template-"+suffix,"Harness template",author.userId]);
  const [version] = await db.query<{id:string}>(`
    insert into project_template_versions (template_id,version,title,blueprint,created_by_user_id)
    values ($1,1,$2,$3::jsonb,$4) returning id`,
    [template!.id,"Harness version",JSON.stringify({overview:{goal:"Harness",deliverables:["Proof"]},releases:[],sprints:[],tasks:[],resources:[]}),author.userId]);
  // College assignment of a DRAFT template would skip the template's
  // publication gate; make the fixture version visible before assigning.
  await db.query(
    "update project_templates set status='PUBLISHED',published_version=1 where id=$1",
    [template!.id]);
  const [assignment] = await db.query<{id:string}>(`
    insert into project_template_college_assignments
      (template_id,template_version_id,college_id,assigned_by_user_id)
    values ($1,$2,$3,$4) returning id`,
    [template!.id,version!.id,tenant.collegeId,author.userId]);
  const [project] = await db.query<{id:string}>(`
    insert into project_instances
      (college_id,template_id,template_version_id,slug,title,status,created_by_user_id)
    values ($1,$2,$3,$4,$5,'ACTIVE',$6) returning id`,
    [tenant.collegeId,template!.id,version!.id,"ph-workspace-"+suffix,"Harness workspace",author.userId]);
  const [release] = await db.query<{id:string}>(`
    insert into project_releases (project_id,template_key,title,sequence,status)
    values ($1,'release-1','Harness release',0,'IN_PROGRESS') returning id`,[project!.id]);
  const [sprint] = await db.query<{id:string}>(`
    insert into project_sprints (project_id,release_id,template_key,title,sequence,status)
    values ($1,$2,'sprint-1','Harness sprint',0,'ACTIVE') returning id`,[project!.id,release!.id]);
  const [task] = await db.query<{id:string}>(`
    insert into project_tasks
      (project_id,sprint_id,template_key,title,sequence,assignee_membership_id)
    values ($1,$2,'task-1','Harness task',0,$3) returning id`,
    [project!.id,sprint!.id,learner.membershipId]);
  const [resource] = await db.query<{id:string}>(`
    insert into project_resources (project_id,template_key,title,sequence)
    values ($1,'resource-1','Harness resource',0) returning id`,[project!.id]);
  const [mentorRow] = await db.query<{id:string}>(`
    insert into project_members (project_id,membership_id,role,is_primary,created_by_user_id)
    values ($1,$2,'MENTOR',true,$3) returning id`,[project!.id,mentor.membershipId,author.userId]);
  const [learnerRow] = await db.query<{id:string}>(`
    insert into project_members (project_id,membership_id,role,created_by_user_id)
    values ($1,$2,'LEARNER',$3) returning id`,[project!.id,learner.membershipId,author.userId]);
  return {templateId:template!.id,versionId:version!.id,assignmentId:assignment!.id,
    projectId:project!.id,workspaceId:project!.id,releaseId:release!.id,sprintId:sprint!.id,
    taskId:task!.id,resourceId:resource!.id,mentorMemberId:mentorRow!.id,learnerMemberId:learnerRow!.id};
}
/**
 * Guard the fixture API against accidentally creating impossible cross-tenant or
 * non-rostered submissions. This is a fixture integrity check, NOT a substitute
 * for a route/service authorization test. The same transaction sees the rows.
 */
async function requireProjectLearner(db: PgHarness, projectId: string,
  learner: PrincipalFixture): Promise<void> {
  if (!learner.membershipId || !learner.roles.includes("LEARNER")) {
    throw new Error("PROJ-HARNESS: project submissions require a learner membership");
  }
  const rows = await db.query<{id: string}>(`
    select p.id
      from project_instances p
      join college_memberships cm
        on cm.college_id = p.college_id and cm.id = $2 and cm.college_id = $3
      join users u on u.id = cm.user_id and u.id = $4 and u.platform_status = 'ACTIVE'
      join colleges c on c.id = p.college_id and c.status = 'ACTIVE'
      join organizations org on org.id = c.organization_id and org.status = 'ACTIVE'
      join membership_roles mr on mr.membership_id = cm.id and mr.role = 'LEARNER'
      join project_members pm
        on pm.project_id = p.id and pm.membership_id = cm.id
     where p.id = $1
       and pm.role = 'LEARNER' and pm.ended_at is null and pm.can_mutate = true
       and cm.status = 'ACTIVE'
     limit 1`, [projectId, learner.membershipId, learner.collegeId, learner.userId]);
  if (!rows.length || learner.collegeId === null) {
    throw new Error("PROJ-HARNESS: learner is not an active member of this project and college");
  }
}
async function requireProjectCollegeActor(db: PgHarness, projectId: string,
  actor: PrincipalFixture): Promise<void> {
  if (!actor.collegeId) throw new Error("PROJ-HARNESS: project actor needs college scope");
  const rows = await db.query<{id: string}>(`
    select p.id from project_instances p
      join college_memberships cm
        on cm.college_id = p.college_id and cm.id = $3 and cm.status = 'ACTIVE'
      join users u on u.id = cm.user_id and u.id = $4 and u.platform_status = 'ACTIVE'
      join colleges c on c.id = p.college_id and c.status = 'ACTIVE'
      join organizations org on org.id = c.organization_id and org.status = 'ACTIVE'
     where p.id = $1 and p.college_id = $2`,
    [projectId, actor.collegeId, actor.membershipId, actor.userId]);
  if (!rows.length) throw new Error("PROJ-HARNESS: project actor wrong college");
}

export async function createTaskSubmission(db: PgHarness, project: ProjectFixture,
  learner: PrincipalFixture): Promise<string> {
  await requireProjectLearner(db, project.projectId, learner);
  await requireMutableFixtureProject(db, project.projectId, "task submissions");
  // The schema has separate task_id and project_id foreign keys. Neither
  // alone proves that a task belongs to the selected workspace.
  const tasks = await db.query<{id:string;assignee_membership_id:string|null;status:string;sprint_status:string}>(`
    select t.id,t.assignee_membership_id,t.status,s.status as sprint_status
      from project_tasks t
      join project_sprints s on s.id=t.sprint_id and s.project_id=t.project_id
     where t.id=$1 and t.project_id=$2`,
    [project.taskId, project.projectId],
  );
  if (tasks.length !== 1) {
    throw new Error("PROJ-HARNESS: task does not belong to this project");
  }
  if (tasks[0]!.assignee_membership_id !== learner.membershipId) {
    throw new Error("PROJ-HARNESS: task assignee is not the submitting learner");
  }
  if (tasks[0]!.sprint_status !== "ACTIVE" ||
      ["DONE","IN_REVIEW"].includes(tasks[0]!.status)) {
    throw new Error("PROJ-HARNESS: task sprint or task state cannot accept a submission");
  }
  // Product submission transitions the persisted task to IN_REVIEW.
  // Keep insert + task CAS in one SAVEPOINT so a competing status transition
  // cannot leave a partial submission when the caller catches an error.
  return db.savepoint(async()=>{
    const [row] = await db.query<{id:string}>(`
      insert into project_task_submissions
        (project_id,task_id,version,submitted_by_membership_id,submission_url)
      values ($1,$2,1,$3,$4) returning id`,
      [project.projectId,project.taskId,learner.membershipId,"https://example.test/proof"]);
    const changed = await db.query<{id:string}>(`
      update project_tasks set status='IN_REVIEW',updated_at=now()
      where id=$1 and project_id=$2 and status in ('TODO','IN_PROGRESS','BLOCKED')
      returning id`,[project.taskId,project.projectId]);
    if (changed.length !== 1) throw new Error("PROJ-HARNESS: task state changed while submitting");
    return row!.id;
  });
}
async function requireMutableFixtureProject(
  db: PgHarness, projectId: string, activity: "task submissions" | "final delivery" | "meetings",
): Promise<void> {
  const rows = await db.query<{id:string}>(`
    select id from project_instances
     where id=$1 and status not in ('ARCHIVED','COMPLETED')
     limit 1`,[projectId]);
  if (rows.length !== 1) throw new Error("PROJ-HARNESS: project " + activity + " is closed");
}

export async function createFinalSubmission(db: PgHarness, project: ProjectFixture,
  learner: PrincipalFixture): Promise<string> {
  await requireProjectLearner(db, project.projectId, learner);
  await requireMutableFixtureProject(db, project.projectId, "final delivery");
  const [row] = await db.query<{id:string}>(`
    insert into project_submissions (project_id,version,status,summary,created_by_membership_id)
    values ($1,1,'DRAFT','Harness final proof',$2) returning id`,
    [project.projectId,learner.membershipId]);
  return row!.id;
}
/** Move a draft final submission into the persisted SUBMITTED shape.
 * Deliberately uses the same actor membership as submission, not client time.
 */
export async function submitFinalSubmission(db: PgHarness, submissionId: string,
  learner: PrincipalFixture): Promise<void> {
  const submissions = await db.query<{project_id: string}>(
    "select project_id from project_submissions where id=$1", [submissionId]);
  if (submissions.length !== 1) throw new Error("PROJ-HARNESS: submission not found");
  await requireProjectLearner(db, submissions[0]!.project_id, learner);
  await requireMutableFixtureProject(db, submissions[0]!.project_id, "final delivery");
  const rows = await db.query<{id:string}>(`
    update project_submissions
       set status='SUBMITTED',submitted_by_membership_id=$2,submitted_at=now(),updated_at=now()
     where id=$1 and status='DRAFT'
     returning id`, [submissionId,learner.membershipId]);
  if (rows.length !== 1) throw new Error("PROJ-HARNESS: expected one draft final submission");
}
export async function createMeeting(db: PgHarness, project: ProjectFixture,
  learner: PrincipalFixture, author: PrincipalFixture): Promise<string> {
  await requireProjectLearner(db, project.projectId, learner);
  await requireMutableFixtureProject(db, project.projectId, "meetings");
  await requireProjectCollegeActor(db, project.projectId, author);
  await requireFixtureCollegePrincipal(db, author.collegeId!, author, ["COLLEGE_ADMIN","MENTOR"]);
  const coordinator = await db.query<{id:string}>(`
    select cm.id from college_memberships cm
      left join membership_roles admin
        on admin.membership_id=cm.id and admin.role='COLLEGE_ADMIN'
      left join project_members mentor
        on mentor.membership_id=cm.id and mentor.project_id=$2
       and mentor.role='MENTOR' and mentor.ended_at is null
       and mentor.can_mutate=true
     where cm.id=$1 and (admin.membership_id is not null or mentor.id is not null)
     limit 1`, [author.membershipId,project.projectId]);
  if (coordinator.length !== 1) {
    throw new Error("PROJ-HARNESS: meeting mentor is not active on this project");
  }
  const [row] = await db.query<{id:string}>(`
    insert into project_meetings
      (project_id,title,starts_at,ends_at,time_zone,requested_by_membership_id,created_by_user_id)
    values ($1,'Review',$2::timestamptz,$3::timestamptz,'Asia/Kolkata',$4,$5) returning id`,
    [project.projectId,"2099-10-20T04:30:00Z","2099-10-20T05:00:00Z",learner.membershipId,author.userId]);
  return row!.id;
}

/** A "drive" is the canonical placement_jobs record, not a fabricated table. */
export async function createPlacementFixture(db: PgHarness, tenant: TenantFixture,
  author: PrincipalFixture): Promise<PlacementFixture> {
  if (author.collegeId !== tenant.collegeId) throw new Error("PROJ-HARNESS: drive actor wrong college");
  await requireFixtureCollegePrincipal(db, tenant.collegeId, author, ["COLLEGE_ADMIN","TPO"]);
  const suffix = randomUUID().slice(0,12);
  const [company] = await db.query<{id:string}>(`
    insert into placement_companies (name,created_by_user_id)
    values ($1,$2) returning id`,["Harness employer "+suffix,author.userId]);
  const [relationship] = await db.query<{id:string}>(`
    insert into placement_company_relationships (college_id,company_id,created_by_user_id)
    values ($1,$2,$3) returning id`,[tenant.collegeId,company!.id,author.userId]);
  const existing = await db.query<{id:string}>(`
    select id from placement_seasons where college_id=$1 and status='ACTIVE'
    order by created_at,id limit 1`,[tenant.collegeId]);
  const season = existing[0] ?? (await db.query<{id:string}>(`
    insert into placement_seasons (college_id,name,code,start_date,end_date,created_by_user_id)
    values ($1,$2,$3,$4,$5,$6) returning id`,
    [tenant.collegeId,"Harness "+suffix,"PH-"+suffix,"2099-10-01","2099-06-30",author.userId]))[0]!;
  const [job] = await db.query<{id:string}>(`
    insert into placement_jobs (college_id,company_relationship_id,season_id,title,description,
      employment_type,work_mode,openings,minimum_annual_ctc_inr,application_deadline,
      status,published_at,created_by_user_id)
    values ($1,$2,$3,'Harness drive','Fixture job','FULL_TIME','REMOTE',2,800000,
      '2099-06-01T12:00:00Z','PUBLISHED',now(),$4) returning id`,
    [tenant.collegeId,relationship!.id,season.id,author.userId]);
  const [roleOption] = await db.query<{id:string}>(`
    insert into placement_job_role_options
      (job_id,title,employment_type,work_mode,openings,is_primary)
    values ($1,'Software Engineer','FULL_TIME','REMOTE',2,true)
    returning id`,[job!.id]);
  const [round] = await db.query<{id:string}>(`
    insert into placement_job_rounds (job_id,sequence,kind,name,created_by_user_id)
    values ($1,1,'INTERVIEW','Harness interview',$2) returning id`,
    [job!.id,author.userId]);
  return {companyId:company!.id,relationshipId:relationship!.id,seasonId:season.id,
    driveId:job!.id,jobId:job!.id,roundId:round!.id,roleOptionId:roleOption!.id};
}

/** Optional placement applicant, screening, round and offer fixtures.
 * All actions share db.client's transaction and are always rolled back.
 * Real job eligibility/application policy must still be tested through services.
 */
export type PlacementCandidateFixture = {
  applicationId: string;
  screeningApplicationId: string;
  roundResultId: string;
  offerId: string;
};

/** Real HR/recruiter identity: NOT a fabricated COLLEGE_ADMIN membership.
 * A recruiter is a global user with a company profile and a bounded,
 * verified relationship grant, which downstream service tests must re-read.
 */
export async function createRecruiterFixture(
  db: PgHarness, drive: PlacementFixture, actor: PrincipalFixture,
): Promise<RecruiterFixture> {
  const [row]=await db.query<{college_id:string;relationship_id:string;company_id:string}>(`
    select j.college_id,rel.id as relationship_id,rel.company_id
      from placement_jobs j
      join placement_company_relationships rel
        on rel.id=j.company_relationship_id and rel.college_id=j.college_id
     where j.id=$1`,[drive.jobId]);
  if (!row || row.company_id!==drive.companyId || row.relationship_id!==drive.relationshipId)
    throw new Error("PROJ-HARNESS: recruiter company relationship does not match drive");
  await requireFixtureCollegePrincipal(db,row.college_id,actor,["COLLEGE_ADMIN","TPO"]);
  // The global user/profile and relationship grant form one atomic identity:
  // a grant constraint failure must never leave an orphaned recruiter profile.
  return db.savepoint(async()=>{
    const user=await createPrincipal(db,null);
    await db.query(`
      insert into placement_recruiter_profiles(user_id,company_id,created_by_user_id)
      values ($1,$2,$3)`,[user.userId,row.company_id,actor.userId]);
    const [grant]=await db.query<{id:string}>(`
      insert into placement_recruiter_college_grants
        (recruiter_user_id,company_relationship_id,granted_by_user_id,valid_until,
         verification_status,capabilities)
      values ($1,$2,$3,'2099-12-31T23:59:00Z','VERIFIED',
        ARRAY['DRIVES','INTERVIEWS','MESSAGES','APPLICANT_EXPORT']::text[]) returning id`,
      [user.userId,row.relationship_id,actor.userId]);
    return {userId:user.userId,companyId:row.company_id,
      relationshipId:row.relationship_id,grantId:grant!.id};
  });
}

export async function createPlacementCandidateFixture(
  db: PgHarness, drive: PlacementFixture, learner: PrincipalFixture,
  actor: PrincipalFixture,
): Promise<PlacementCandidateFixture> {
  if (!learner.membershipId || learner.roles.indexOf("LEARNER") < 0) {
    throw new Error("PROJ-HARNESS: placement applicant must have learner membership");
  }
  if (!actor.collegeId || actor.collegeId !== learner.collegeId) {
    throw new Error("PROJ-HARNESS: applicant and coordinator must share a college");
  }
  const [job] = await db.query<{college_id:string; round_id:string|null; round_status:string|null; role_option_id:string|null; accepting_applications:boolean}>(`
    select j.college_id,r.id as round_id,r.status as round_status,
        role.id as role_option_id,
        (j.status='PUBLISHED' and j.published_at is not null
          and j.application_deadline>now() and season.status='ACTIVE') as accepting_applications
      from placement_jobs j
      join placement_seasons season on season.id=j.season_id and season.college_id=j.college_id
      left join placement_job_rounds r
        on r.job_id=j.id and r.id=$2
      left join placement_job_role_options role
        on role.job_id=j.id and role.id=$3 and role.status='ACTIVE'
     where j.id=$1`,[drive.jobId,drive.roundId,drive.roleOptionId]);
  if (!job || job.college_id !== learner.collegeId) {
    throw new Error("PROJ-HARNESS: applicant and drive have different colleges");
  }
  if (job.round_id !== drive.roundId) {
    throw new Error("PROJ-HARNESS: supplied round does not belong to this drive");
  }
  if (job.round_status === "CANCELLED") {
    throw new Error("PROJ-HARNESS: cancelled round cannot accept candidate results");
  }
  if (!job.role_option_id) {
    throw new Error("PROJ-HARNESS: supplied role option is not active on this drive");
  }
  if (!job.accepting_applications) {
    throw new Error("PROJ-HARNESS: drive is not open for applications");
  }
  // Roles held in fixture objects are insufficient evidence; the real
  // memberships and both users must still be active in the drive's college.
  await requireFixtureCollegePrincipal(db, job.college_id, learner, ["LEARNER"]);
  await requireFixtureCollegePrincipal(db, job.college_id, actor, ["COLLEGE_ADMIN", "TPO"]);
  const [application] = await db.query<{id:string}>(`
    insert into placement_applications
      (job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id)
    values ($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) returning id`,
    [drive.jobId,drive.roleOptionId,learner.membershipId,learner.userId]);
  await db.query(`
    insert into placement_application_screenings(application_id) values ($1)
    on conflict(application_id) do nothing`,[application!.id]);
  const [result] = await db.query<{id:string}>(`
    insert into placement_round_results
      (round_id,application_id,version,outcome,source,status,submitted_by_user_id)
    values ($1,$2,1,'PASS','TPO','STAGED',$3) returning id`,
    [drive.roundId,application!.id,actor.userId]);
  const [offer] = await db.query<{id:string}>(`
    insert into placement_offers
      (application_id,version,role_title,issued_by_user_id)
    values ($1,1,'Software Engineer',$2) returning id`,
    [application!.id,actor.userId]);
  await db.query(`
    insert into placement_joining_outcomes(offer_id) values ($1)`,[offer!.id]);
  return {applicationId:application!.id,screeningApplicationId:application!.id,
    roundResultId:result!.id,offerId:offer!.id};
}
