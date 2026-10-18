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
  companyId: string; relationshipId: string; driveId: string; jobId: string; roundId: string;
};

const REQUIRED_TABLES = [
  "organizations","colleges","users","college_memberships","membership_roles","system_roles",
  "project_templates","project_template_versions","project_template_college_assignments",
  "project_instances","project_releases","project_sprints","project_tasks","project_resources",
  "project_members","project_task_submissions","project_submissions","project_delivery_events",
  "project_submission_reviews","project_evaluations","project_evaluation_items","project_meetings",
  "placement_companies","placement_company_relationships","placement_jobs","placement_job_rounds",
] as const;

export function disposableDatabaseUrl(): string {
  const raw = process.env.TEST_DATABASE_URL;
  if (!raw) throw new Error("PROJ-HARNESS: set an explicit disposable TEST_DATABASE_URL (DATABASE_URL is never used)");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("PROJ-HARNESS: TEST_DATABASE_URL must be a PostgreSQL URL"); }
  const dbName = decodeURIComponent(url.pathname.slice(1));
  if (!["postgres:","postgresql:"].includes(url.protocol) ||
      !/(?:test|ci|tmp)/i.test(dbName) ||
      /(?:prod|production|live)/i.test(dbName)) {
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
  if (!/(?:test|ci|tmp)/i.test(name.rows[0]?.name ?? "") ||
      /(?:prod|production|live)/i.test(name.rows[0]?.name ?? "")) {
    throw new Error("PROJ-HARNESS: refusing non-test PostgreSQL database");
  }
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
        await this.savepoint(async () => {
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

/** Canonical project workspace graph, referencing the ACTUAL migration tables.
 * Cross-tenant tests should create two of these in distinct tenants.
 */
export async function createProjectFixture(db: PgHarness, tenant: TenantFixture,
  author: PrincipalFixture, mentor: PrincipalFixture, learner: PrincipalFixture): Promise<ProjectFixture> {
  if (author.collegeId !== tenant.collegeId || mentor.collegeId !== tenant.collegeId ||
      learner.collegeId !== tenant.collegeId || !mentor.membershipId || !learner.membershipId) {
    throw new Error("PROJ-HARNESS: project actors must belong to the fixture's college");
  }
  const suffix = randomUUID().slice(0,12);
  const [template] = await db.query<{id:string}>(`
    insert into project_templates (slug,title,created_by_user_id)
    values ($1,$2,$3) returning id`, ["ph-template-"+suffix,"Harness template",author.userId]);
  const [version] = await db.query<{id:string}>(`
    insert into project_template_versions (template_id,version,title,blueprint,created_by_user_id)
    values ($1,1,$2,$3::jsonb,$4) returning id`,
    [template!.id,"Harness version",JSON.stringify({overview:{goal:"Harness",deliverables:["Proof"]},releases:[],sprints:[],tasks:[],resources:[]}),author.userId]);
  const [assignment] = await db.query<{id:string}>(`
    insert into project_template_college_assignments
      (template_id,template_version_id,college_id,assigned_by_user_id)
    values ($1,$2,$3,$4) returning id`,
    [template!.id,version!.id,tenant.collegeId,author.userId]);
  const [project] = await db.query<{id:string}>(`
    insert into project_instances
      (college_id,template_id,template_version_id,slug,title,created_by_user_id)
    values ($1,$2,$3,$4,$5,$6) returning id`,
    [tenant.collegeId,template!.id,version!.id,"ph-workspace-"+suffix,"Harness workspace",author.userId]);
  const [release] = await db.query<{id:string}>(`
    insert into project_releases (project_id,template_key,title,sequence)
    values ($1,'release-1','Harness release',0) returning id`,[project!.id]);
  const [sprint] = await db.query<{id:string}>(`
    insert into project_sprints (project_id,release_id,template_key,title,sequence)
    values ($1,$2,'sprint-1','Harness sprint',0) returning id`,[project!.id,release!.id]);
  const [task] = await db.query<{id:string}>(`
    insert into project_tasks (project_id,sprint_id,template_key,title,sequence)
    values ($1,$2,'task-1','Harness task',0) returning id`,[project!.id,sprint!.id]);
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
export async function createTaskSubmission(db: PgHarness, project: ProjectFixture,
  learner: PrincipalFixture): Promise<string> {
  if (!learner.membershipId) throw new Error("PROJ-HARNESS: submission needs membership");
  const [row] = await db.query<{id:string}>(`
    insert into project_task_submissions
      (project_id,task_id,version,submitted_by_membership_id,submission_url)
    values ($1,$2,1,$3,$4) returning id`,
    [project.projectId,project.taskId,learner.membershipId,"https://example.test/proof"]);
  return row!.id;
}
export async function createFinalSubmission(db: PgHarness, project: ProjectFixture,
  learner: PrincipalFixture): Promise<string> {
  if (!learner.membershipId) throw new Error("PROJ-HARNESS: final submission needs membership");
  const [row] = await db.query<{id:string}>(`
    insert into project_submissions (project_id,version,status,summary,created_by_membership_id)
    values ($1,1,'DRAFT','Harness final proof',$2) returning id`,
    [project.projectId,learner.membershipId]);
  return row!.id;
}
export async function createMeeting(db: PgHarness, project: ProjectFixture,
  learner: PrincipalFixture, author: PrincipalFixture): Promise<string> {
  if (!learner.membershipId) throw new Error("PROJ-HARNESS: meeting requester needs membership");
  const [row] = await db.query<{id:string}>(`
    insert into project_meetings
      (project_id,title,starts_at,ends_at,time_zone,requested_by_membership_id,created_by_user_id)
    values ($1,'Review',$2::timestamptz,$3::timestamptz,'Asia/Kolkata',$4,$5) returning id`,
    [project.projectId,"2026-10-20T04:30:00Z","2026-10-20T05:00:00Z",learner.membershipId,author.userId]);
  return row!.id;
}

/** A "drive" is the canonical placement_jobs record, not a fabricated table. */
export async function createPlacementFixture(db: PgHarness, tenant: TenantFixture,
  author: PrincipalFixture): Promise<PlacementFixture> {
  if (author.collegeId !== tenant.collegeId) throw new Error("PROJ-HARNESS: drive actor wrong college");
  const suffix = randomUUID().slice(0,12);
  const [company] = await db.query<{id:string}>(`
    insert into placement_companies (name,created_by_user_id)
    values ($1,$2) returning id`,["Harness employer "+suffix,author.userId]);
  const [relationship] = await db.query<{id:string}>(`
    insert into placement_company_relationships (college_id,company_id,created_by_user_id)
    values ($1,$2,$3) returning id`,[tenant.collegeId,company!.id,author.userId]);
  const [job] = await db.query<{id:string}>(`
    insert into placement_jobs (college_id,company_relationship_id,title,description,
      employment_type,work_mode,created_by_user_id)
    values ($1,$2,'Harness drive','Fixture job','FULL_TIME','REMOTE',$3) returning id`,
    [tenant.collegeId,relationship!.id,author.userId]);
  const [round] = await db.query<{id:string}>(`
    insert into placement_job_rounds (job_id,sequence,kind,name,created_by_user_id)
    values ($1,1,'INTERVIEW','Harness interview',$2) returning id`,
    [job!.id,author.userId]);
  return {companyId:company!.id,relationshipId:relationship!.id,
    driveId:job!.id,jobId:job!.id,roundId:round!.id};
}
