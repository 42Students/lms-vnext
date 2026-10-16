/**
 * Database side of the NSRIT stage 2a loader. Everything here runs inside an
 * explicit transaction on a guarded connection (see guards.ts); every write
 * statement is checked against the table allowlist before it is sent.
 *
 * Idempotency: ids are deterministic UUIDv5 values, rows are written with
 * INSERT ... ON CONFLICT (id) DO UPDATE, and legacy_id_map stores a source
 * hash per mapped row. A re-run with an unchanged snapshot finds the same ids
 * and hashes and writes nothing (counted as `unchanged`).
 */
import type { Client } from "pg";
import { LOADER_VERSION, SOURCE_SYSTEM, nsritId } from "./common";
import { assertStatementAllowed } from "./guards";
import type { Planned, Plan, PersonData } from "./plan";
import type { LoadCounts } from "./reports";

export type Tx = {
  query<R extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: R[]; rowCount: number }>;
};

export function guardedTx(client: Client): Tx {
  return {
    async query(sql, params = []) {
      assertStatementAllowed(sql);
      const result = await client.query(sql, params as unknown[]);
      return { rows: result.rows, rowCount: result.rowCount ?? 0 };
    },
  };
}

export type Validation = { check: string; ok: boolean; detail: string };

export class LoadAbort extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoadAbort";
  }
}

type MapRow = { legacy_entity_type: string; legacy_id: string; new_entity_type: string; new_id: string; source_hash: string | null };

type PendingMap = [string, string, string, string, string];

export class LoadContext {
  counts: LoadCounts = {};
  private pending: PendingMap[] = [];
  constructor(
    readonly tx: Tx,
    readonly collegeId: string,
    public batchId: string | null,
  ) {}

  bump(table: string, kind: "inserted" | "updated" | "unchanged", n = 1) {
    const entry = (this.counts[table] ??= { inserted: 0, updated: 0, unchanged: 0 });
    entry[kind] += n;
  }

  /** Map rows need an open batch; foundation rows are written before it exists. */
  queueMap(row: PendingMap) {
    this.pending.push(row);
  }

  async attachBatch(batchId: string) {
    this.batchId = batchId;
    const queued = this.pending;
    this.pending = [];
    for (const [legacyType, legacyId, newType, newId, hash] of queued) {
      await writeMap(this, legacyType, legacyId, newType, newId, hash);
    }
  }
}

// ----------------------------------------------------------------- batches

export async function createBatch(
  tx: Tx,
  collegeId: string,
  snapshotSha256: string,
  label: string,
): Promise<string> {
  const result = await tx.query<{ id: string }>(
    `INSERT INTO data_import_batches (college_id, source_system, source_label, loader_version, snapshot_sha256, status)
     VALUES ($1, $2, $3, $4, $5, 'RUNNING') RETURNING id`,
    [collegeId, SOURCE_SYSTEM, label.slice(0, 120), LOADER_VERSION, snapshotSha256],
  );
  return result.rows[0].id;
}

export async function finishBatch(
  tx: Tx,
  batchId: string,
  status: "COMPLETED" | "FAILED",
  counts: Record<string, unknown>,
) {
  await tx.query(
    `UPDATE data_import_batches SET status = $2, finished_at = now(), counts = $3::jsonb WHERE id = $1`,
    [batchId, status, JSON.stringify(counts)],
  );
}

// -------------------------------------------------------------- preflight

export async function preflight(client: Client, plan: Plan): Promise<string[]> {
  const problems: string[] = [];
  const need: [string, string][] = [
    ["data_import_batches", "snapshot_sha256"],
    ["legacy_id_map", "batch_id"],
    ["legacy_id_map", "source_hash"],
    ["sections", "min_size"],
    ["users", "identity_uid"],
    ["learner_profiles", "profile_document"],
  ];
  for (const [table, column] of need) {
    const res = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      [table, column],
    );
    if (res.rowCount === 0) problems.push(`missing ${table}.${column}: run migrations through 0098 first`);
  }
  const org = await client.query(
    `SELECT id FROM organizations WHERE lower(name) = lower($1) AND status = 'ACTIVE' AND id <> $2`,
    [plan.organization.data.name, plan.organization.newId],
  );
  if ((org.rowCount ?? 0) > 0) problems.push("another active organization with the NSRIT name already exists");
  const college = await client.query(
    `SELECT id FROM colleges WHERE lower(code) = lower($1) AND id <> $2`,
    [plan.college.data.code, plan.college.newId],
  );
  if ((college.rowCount ?? 0) > 0) problems.push("another college with the NSRIT code already exists");
  return problems;
}

/** Contacts held by users the loader does not own (blocked, never merged). */
export async function findExternalConflicts(
  client: Client,
  plan: Plan,
): Promise<{ phones: Set<string>; emails: Set<string> }> {
  const ownIds = new Set(plan.people.map((p) => p.newId));
  const phones = plan.people.map((p) => p.data.phoneE164).filter((v): v is string => !!v);
  const emails = plan.people.map((p) => p.data.email).filter((v): v is string => !!v);
  const result = { phones: new Set<string>(), emails: new Set<string>() };
  if (phones.length === 0 && emails.length === 0) return result;
  const res = await client.query<{ id: string; phone_e164: string | null; email: string | null }>(
    `SELECT id, phone_e164, lower(email) AS email FROM users WHERE phone_e164 = ANY($1::text[]) OR lower(email) = ANY($2::text[])`,
    [phones, emails],
  );
  for (const row of res.rows) {
    if (ownIds.has(row.id)) continue;
    if (row.phone_e164) result.phones.add(row.phone_e164);
    if (row.email) result.emails.add(row.email);
  }
  return result;
}

// ------------------------------------------------------------- map handling

async function loadMapRows(ctx: LoadContext, newType: string): Promise<Map<string, MapRow>> {
  const res = await ctx.tx.query<MapRow>(
    `SELECT legacy_entity_type, legacy_id, new_entity_type, new_id, source_hash
       FROM legacy_id_map
      WHERE college_id = $1 AND source_system = $2 AND new_entity_type = $3`,
    [ctx.collegeId, SOURCE_SYSTEM, newType],
  );
  return new Map(res.rows.map((r) => [`${r.legacy_entity_type}|${r.legacy_id}`, r]));
}

async function writeMap(
  ctx: LoadContext,
  legacyType: string,
  legacyId: string,
  newType: string,
  newId: string,
  hash: string,
) {
  if (ctx.batchId === null) {
    ctx.queueMap([legacyType, legacyId, newType, newId, hash]);
    return;
  }
  await ctx.tx.query(
    `INSERT INTO legacy_id_map (legacy_entity_type, legacy_id, new_entity_type, new_id, college_id, batch_id, source_system, source_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (college_id, source_system, legacy_entity_type, legacy_id, new_entity_type) WHERE college_id IS NOT NULL
     DO UPDATE SET new_id = excluded.new_id, batch_id = excluded.batch_id, source_hash = excluded.source_hash, migrated_at = now()`,
    [legacyType, legacyId, newType, newId, ctx.collegeId, ctx.batchId, SOURCE_SYSTEM, hash],
  );
}

async function existingIds(ctx: LoadContext, table: string, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const key = table === "learner_profiles" || table === "faculty_profiles" ? "membership_id" : "id";
  const res = await ctx.tx.query<{ id: string }>(
    `SELECT ${key} AS id FROM ${table} WHERE ${key} = ANY($1::uuid[])`,
    [ids],
  );
  return new Set(res.rows.map((r) => r.id));
}

type SyncSpec<T> = {
  table: string;
  items: Planned<T>[];
  upsert: (ctx: LoadContext, item: Planned<T>) => Promise<void>;
};

async function syncTable<T>(ctx: LoadContext, spec: SyncSpec<T>) {
  const maps = await loadMapRows(ctx, spec.table);
  const existing = await existingIds(
    ctx,
    spec.table,
    spec.items.map((i) => i.newId),
  );
  for (const item of spec.items) {
    const mapRow = maps.get(`${item.legacyType}|${item.legacyId}`);
    if (mapRow && mapRow.new_id !== item.newId) {
      throw new LoadAbort(`legacy_id_map points ${spec.table} ${item.legacyType}#${item.legacyId} at an unexpected id`);
    }
    const exists = existing.has(item.newId);
    if (mapRow && mapRow.source_hash === item.hash && exists) {
      ctx.bump(spec.table, "unchanged");
      continue;
    }
    await spec.upsert(ctx, item);
    await writeMap(ctx, item.legacyType, item.legacyId, spec.table, item.newId, item.hash);
    ctx.bump(spec.table, exists ? "updated" : "inserted");
  }
}

const ts = (value: string | null) => value ?? null;

// ------------------------------------------------------------- foundation

export async function loadFoundation(ctx: LoadContext, plan: Plan) {
  await syncTable(ctx, {
    table: "organizations",
    items: [plan.organization],
    upsert: async (c, i) => {
      await c.tx.query(
        `INSERT INTO organizations (id, name, status, created_at, updated_at)
         VALUES ($1, $2, 'ACTIVE', coalesce($3::timestamptz, now()), coalesce($4::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at`,
        [i.newId, i.data.name, ts(i.data.createdAt), ts(i.data.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "colleges",
    items: [plan.college],
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO colleges (id, organization_id, name, code, address_line1, address_line2, landmark, city, state, country, postal_code, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE', coalesce($12::timestamptz, now()), coalesce($13::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET organization_id = excluded.organization_id, name = excluded.name, code = excluded.code,
           address_line1 = excluded.address_line1, address_line2 = excluded.address_line2, landmark = excluded.landmark,
           city = excluded.city, state = excluded.state, country = excluded.country, postal_code = excluded.postal_code,
           updated_at = excluded.updated_at`,
        [i.newId, d.organizationId, d.name, d.code, d.addressLine1, d.addressLine2, d.landmark, d.city, d.state, d.country, d.postalCode, ts(d.createdAt), ts(d.updatedAt)],
      );
    },
  });
}

// ------------------------------------------------------------------ academics

export async function loadAcademics(ctx: LoadContext, plan: Plan) {
  await syncTable(ctx, {
    table: "departments",
    items: plan.departments,
    upsert: async (c, i) => {
      await c.tx.query(
        `INSERT INTO departments (id, college_id, name, created_at, updated_at)
         VALUES ($1, $2, $3, coalesce($4::timestamptz, now()), coalesce($5::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at`,
        [i.newId, c.collegeId, i.data.name, ts(i.data.createdAt), ts(i.data.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "programs",
    items: plan.programs,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO programs (id, department_id, name, code, duration_terms, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE', coalesce($6::timestamptz, now()), coalesce($7::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET name = excluded.name, code = excluded.code, duration_terms = excluded.duration_terms, updated_at = excluded.updated_at`,
        [i.newId, d.departmentId, d.name, d.code, d.durationTerms, ts(d.createdAt), ts(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "academic_periods",
    items: plan.periods,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO academic_periods (id, college_id, name, code, start_date, end_date, status)
         VALUES ($1, $2, $3, $4, $5::date, $6::date, $7)
         ON CONFLICT (id) DO UPDATE SET name = excluded.name, code = excluded.code, start_date = excluded.start_date,
           end_date = excluded.end_date, status = excluded.status, updated_at = now()`,
        [i.newId, c.collegeId, d.name, d.code, d.startDate, d.endDate, d.status],
      );
    },
  });
  await syncTable(ctx, {
    table: "cohorts",
    items: plan.cohorts,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO cohorts (id, program_id, name, code, start_period_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, coalesce($7::timestamptz, now()), coalesce($8::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET name = excluded.name, code = excluded.code, status = excluded.status, updated_at = excluded.updated_at`,
        [i.newId, d.programId, d.name, d.code, d.startPeriodId, d.status, ts(d.createdAt), ts(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "sections",
    items: plan.sections,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO sections (id, cohort_id, academic_period_id, name, code, capacity, min_size, description, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', coalesce($9::timestamptz, now()), coalesce($10::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET name = excluded.name, code = excluded.code, capacity = excluded.capacity,
           min_size = excluded.min_size, description = excluded.description, updated_at = excluded.updated_at`,
        [i.newId, d.cohortId, d.academicPeriodId, d.name, d.code, d.capacity, d.minSize, d.description, ts(d.createdAt), ts(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "program_terms",
    items: plan.terms,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO program_terms (id, program_id, term_number, name, is_active, total_credits, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, coalesce($7::timestamptz, now()), coalesce($8::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET name = excluded.name, is_active = excluded.is_active, total_credits = excluded.total_credits, updated_at = excluded.updated_at`,
        [i.newId, d.programId, d.termNumber, d.name, d.isActive, d.totalCredits, ts(d.createdAt), ts(d.updatedAt)],
      );
    },
  });
  await syncTable(ctx, {
    table: "lecture_halls",
    items: plan.halls,
    upsert: async (c, i) => {
      const d = i.data;
      await c.tx.query(
        `INSERT INTO lecture_halls (id, college_id, department_id, name, capacity, description, room_type, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', coalesce($8::timestamptz, now()), coalesce($9::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET department_id = excluded.department_id, name = excluded.name, capacity = excluded.capacity,
           description = excluded.description, room_type = excluded.room_type, updated_at = excluded.updated_at`,
        [i.newId, c.collegeId, d.departmentId, d.name, d.capacity, d.description, d.roomType, ts(d.createdAt), ts(d.updatedAt)],
      );
    },
  });
}

// --------------------------------------------------------------------- people

async function upsertPerson(ctx: LoadContext, item: Planned<PersonData>) {
  const d = item.data;
  const tx = ctx.tx;
  await tx.query(
    `INSERT INTO users (id, identity_uid, phone_e164, email, display_name, platform_status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'ACTIVE', coalesce($6::timestamptz, now()), coalesce($7::timestamptz, now()))
     ON CONFLICT (id) DO UPDATE SET phone_e164 = excluded.phone_e164, email = excluded.email,
       display_name = excluded.display_name, updated_at = excluded.updated_at`,
    [item.newId, d.identityUid, d.phoneE164, d.email, d.displayName, ts(d.createdAt), ts(d.updatedAt)],
  );
  await tx.query(
    `INSERT INTO college_memberships (id, user_id, college_id, status, suspended_at, suspension_reason, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5::timestamptz, $6, coalesce($7::timestamptz, now()), coalesce($8::timestamptz, now()))
     ON CONFLICT (id) DO UPDATE SET status = excluded.status, suspended_at = excluded.suspended_at,
       suspension_reason = excluded.suspension_reason, updated_at = excluded.updated_at`,
    [d.membershipId, item.newId, ctx.collegeId, d.membershipStatus, ts(d.suspendedAt), d.suspensionReason, ts(d.createdAt), ts(d.updatedAt)],
  );
  // Roles: exactly the mapped set (delete extras, add missing).
  await tx.query(
    `DELETE FROM membership_roles WHERE membership_id = $1 AND NOT (role::text = ANY($2::text[]))`,
    [d.membershipId, d.roles],
  );
  for (const role of d.roles) {
    await tx.query(
      `INSERT INTO membership_roles (membership_id, role) VALUES ($1, $2::membership_role)
       ON CONFLICT (membership_id, role) DO NOTHING`,
      [d.membershipId, role],
    );
  }
  if (d.learner) {
    await tx.query(
      `INSERT INTO learner_profiles (membership_id, roll_number, registration_number, profile_document)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (membership_id) DO UPDATE SET roll_number = excluded.roll_number,
         registration_number = excluded.registration_number, profile_document = excluded.profile_document, updated_at = now()`,
      [d.membershipId, d.learner.rollNumber, d.learner.registrationNumber, JSON.stringify(d.learner.document)],
    );
  }
  if (d.faculty) {
    await tx.query(
      `INSERT INTO faculty_profiles (membership_id, primary_department_id, employment_type, academic_title)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (membership_id) DO UPDATE SET primary_department_id = excluded.primary_department_id,
         employment_type = excluded.employment_type, academic_title = excluded.academic_title, updated_at = now()`,
      [d.membershipId, d.faculty.primaryDepartmentId, d.faculty.employmentType, d.faculty.academicTitle],
    );
  }
  if (d.enrollment) {
    const e = d.enrollment;
    await tx.query(
      `INSERT INTO learner_program_enrollments (id, membership_id, program_id, cohort_id, status, admitted_at)
       VALUES ($1, $2, $3, $4, 'ACTIVE', coalesce($5::timestamptz, now()))
       ON CONFLICT (id) DO UPDATE SET program_id = excluded.program_id, cohort_id = excluded.cohort_id, updated_at = now()`,
      [e.enrollmentId, d.membershipId, e.programId, e.cohortId, ts(e.admittedAt)],
    );
    await tx.query(
      `INSERT INTO section_enrollments (id, learner_enrollment_id, section_id, academic_period_id, status, started_at)
       VALUES ($1, $2, $3, $4, 'ACTIVE', coalesce($5::timestamptz, now()))
       ON CONFLICT (id) DO UPDATE SET section_id = excluded.section_id, academic_period_id = excluded.academic_period_id, updated_at = now()`,
      [e.sectionEnrollmentId, e.enrollmentId, e.sectionId, e.academicPeriodId, ts(e.admittedAt)],
    );
  }
}

export async function loadPeople(ctx: LoadContext, plan: Plan) {
  const maps = await loadMapRows(ctx, "users");
  const existing = await existingIds(
    ctx,
    "users",
    plan.people.map((p) => p.newId),
  );
  for (const item of plan.people) {
    const d = item.data;
    const mapRow = maps.get(`${item.legacyType}|${item.legacyId}`);
    const exists = existing.has(item.newId);
    const kind: "inserted" | "updated" | "unchanged" =
      mapRow && mapRow.source_hash === item.hash && exists ? "unchanged" : exists ? "updated" : "inserted";
    const tables = [
      "users",
      "college_memberships",
      d.learner ? "learner_profiles" : "faculty_profiles",
      ...(d.enrollment ? ["learner_program_enrollments", "section_enrollments"] : []),
    ];
    if (kind === "unchanged") {
      for (const table of tables) ctx.bump(table, "unchanged");
      continue;
    }
    await upsertPerson(ctx, item);
    const children: [string, string][] = [
      ["users", item.newId],
      ["college_memberships", d.membershipId],
      [d.learner ? "learner_profiles" : "faculty_profiles", d.membershipId],
    ];
    if (d.enrollment) {
      children.push(["learner_program_enrollments", d.enrollment.enrollmentId]);
      children.push(["section_enrollments", d.enrollment.sectionEnrollmentId]);
    }
    for (const [table, id] of children) {
      await writeMap(ctx, item.legacyType, item.legacyId, table, id, item.hash);
      ctx.bump(table, kind);
    }
  }
}

// ------------------------------------------------------------------ validation

export async function validate(ctx: LoadContext, plan: Plan): Promise<Validation[]> {
  const out: Validation[] = [];
  const check = async (name: string, sql: string, params: unknown[], expect: (n: number) => boolean, detail: (n: number) => string) => {
    const res = await ctx.tx.query<{ n: string }>(sql, params);
    const n = Number(res.rows[0]?.n ?? 0);
    out.push({ check: name, ok: expect(n), detail: detail(n) });
  };
  const cid = [ctx.collegeId];
  await check(
    "departments outside NSRIT college",
    `SELECT count(*) AS n FROM departments d JOIN legacy_id_map m ON m.new_id = d.id AND m.new_entity_type = 'departments' AND m.college_id = $1 WHERE d.college_id <> $1`,
    cid, (n) => n === 0, (n) => `${n} found`,
  );
  await check(
    "programs outside NSRIT college",
    `SELECT count(*) AS n FROM programs p JOIN legacy_id_map m ON m.new_id = p.id AND m.new_entity_type = 'programs' AND m.college_id = $1
       JOIN departments d ON d.id = p.department_id WHERE d.college_id <> $1`,
    cid, (n) => n === 0, (n) => `${n} found`,
  );
  await check(
    "sections outside NSRIT college",
    `SELECT count(*) AS n FROM sections s JOIN legacy_id_map m ON m.new_id = s.id AND m.new_entity_type = 'sections' AND m.college_id = $1
       JOIN cohorts c ON c.id = s.cohort_id JOIN programs p ON p.id = c.program_id JOIN departments d ON d.id = p.department_id WHERE d.college_id <> $1`,
    cid, (n) => n === 0, (n) => `${n} found`,
  );
  await check(
    "memberships outside NSRIT college",
    `SELECT count(*) AS n FROM college_memberships cm JOIN legacy_id_map m ON m.new_id = cm.id AND m.new_entity_type = 'college_memberships' AND m.college_id = $1 WHERE cm.college_id <> $1`,
    cid, (n) => n === 0, (n) => `${n} found`,
  );
  await check(
    "memberships without a role",
    `SELECT count(*) AS n FROM college_memberships cm JOIN legacy_id_map m ON m.new_id = cm.id AND m.new_entity_type = 'college_memberships' AND m.college_id = $1
       WHERE NOT EXISTS (SELECT 1 FROM membership_roles r WHERE r.membership_id = cm.id)`,
    cid, (n) => n === 0, (n) => `${n} found`,
  );
  await check(
    "loaded users with neither phone nor e-mail",
    `SELECT count(*) AS n FROM users u JOIN legacy_id_map m ON m.new_id = u.id AND m.new_entity_type = 'users' AND m.college_id = $1 WHERE u.phone_e164 IS NULL AND u.email IS NULL`,
    cid, (n) => n === 0, (n) => `${n} found`,
  );
  await check(
    "enrolled learners without a section enrollment",
    `SELECT count(*) AS n FROM learner_program_enrollments e JOIN legacy_id_map m ON m.new_id = e.id AND m.new_entity_type = 'learner_program_enrollments' AND m.college_id = $1
       WHERE NOT EXISTS (SELECT 1 FROM section_enrollments s WHERE s.learner_enrollment_id = e.id)`,
    cid, (n) => n === 0, (n) => `${n} found`,
  );
  await check(
    "duplicate roll numbers among loaded learners",
    `SELECT count(*) AS n FROM (SELECT roll_number FROM learner_profiles lp JOIN college_memberships cm ON cm.id = lp.membership_id
       WHERE cm.college_id = $1 AND lp.roll_number IS NOT NULL GROUP BY roll_number HAVING count(*) > 1) x`,
    cid, (n) => n === 0, (n) => `${n} duplicate roll numbers`,
  );
  const expected: [string, string, number][] = [
    ["departments", "departments", plan.departments.length],
    ["programs", "programs", plan.programs.length],
    ["academic_periods", "academic_periods", plan.periods.length],
    ["cohorts", "cohorts", plan.cohorts.length],
    ["sections", "sections", plan.sections.length],
    ["program_terms", "program_terms", plan.terms.length],
    ["lecture_halls", "lecture_halls", plan.halls.length],
    ["users", "users", plan.people.length],
    ["college_memberships", "college_memberships", plan.people.length],
  ];
  for (const [label, table, want] of expected) {
    await check(
      `mapped ${label} equals planned`,
      `SELECT count(*) AS n FROM legacy_id_map WHERE college_id = $1 AND source_system = '${SOURCE_SYSTEM}' AND new_entity_type = '${table}'`,
      cid, (n) => n === want, (n) => `${n} mapped, ${want} planned`,
    );
  }
  return out;
}

// ------------------------------------------------------------------- rollback

/** Child-first deletion order; organizations and colleges are kept (batches reference the college). */
const ROLLBACK_ORDER: { table: string; key: string }[] = [
  { table: "section_enrollments", key: "id" },
  { table: "learner_program_enrollments", key: "id" },
  { table: "learner_profiles", key: "membership_id" },
  { table: "faculty_profiles", key: "membership_id" },
  { table: "college_memberships", key: "id" },
  { table: "users", key: "id" },
  { table: "lecture_halls", key: "id" },
  { table: "program_terms", key: "id" },
  { table: "sections", key: "id" },
  { table: "cohorts", key: "id" },
  { table: "academic_periods", key: "id" },
  { table: "programs", key: "id" },
  { table: "departments", key: "id" },
];

export async function rollbackBatch(
  tx: Tx,
  batchId: string,
  expectedCollegeId: string,
): Promise<Record<string, number>> {
  const batch = await tx.query<{ college_id: string; status: string }>(
    `SELECT college_id, status FROM data_import_batches WHERE id = $1 FOR UPDATE`,
    [batchId],
  );
  const row = batch.rows[0];
  if (!row) throw new LoadAbort("Import batch not found");
  if (row.college_id !== expectedCollegeId) throw new LoadAbort("Batch does not belong to the NSRIT college: refusing");
  if (row.status === "ROLLED_BACK") throw new LoadAbort("Batch is already rolled back");
  if (row.status === "RUNNING") throw new LoadAbort("Batch is still RUNNING: refusing to roll it back");
  const deleted: Record<string, number> = {};
  // Roles are children of memberships and carry no map row of their own.
  const roles = await tx.query(
    `DELETE FROM membership_roles WHERE membership_id IN
       (SELECT new_id FROM legacy_id_map WHERE batch_id = $1 AND college_id = $2 AND new_entity_type = 'college_memberships')`,
    [batchId, expectedCollegeId],
  );
  deleted.membership_roles = roles.rowCount;
  for (const { table, key } of ROLLBACK_ORDER) {
    const res = await tx.query(
      `DELETE FROM ${table} WHERE ${key} IN
         (SELECT new_id FROM legacy_id_map WHERE batch_id = $1 AND college_id = $2 AND new_entity_type = $3)`,
      [batchId, expectedCollegeId, table],
    );
    deleted[table] = res.rowCount;
  }
  const maps = await tx.query(
    `DELETE FROM legacy_id_map WHERE batch_id = $1 AND college_id = $2`,
    [batchId, expectedCollegeId],
  );
  deleted.legacy_id_map = maps.rowCount;
  await tx.query(
    `UPDATE data_import_batches SET status = 'ROLLED_BACK', rolled_back_at = now(), counts = coalesce(counts, '{}'::jsonb) || $2::jsonb WHERE id = $1`,
    [batchId, JSON.stringify({ rollback: deleted })],
  );
  return deleted;
}

export const NSRIT_COLLEGE_ID = nsritId("colleges", "college", 6);
