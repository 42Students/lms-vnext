/**
 * Dev-only QA sign-in accounts for the loaded NSRIT college.
 *
 * Imported people keep their real contacts, and in non-production the messaging
 * allowlist means nobody can receive a real code, so nobody could sign in to look
 * at the loaded data. This script creates a few fictitious accounts (college admin,
 * TPO, recruiter) and, for the people whose data is worth looking at (the faculty
 * member with the most courses, the mentor with the most projects, a few learners),
 * swaps their phone and email for fictitious test contacts. The originals are
 * written to a private mapping file so `--restore` puts every real contact back.
 *
 *   dry run (default, rolled back):  tsx scripts/migrate/nsrit/qa-personas.ts --allow-remote-dev
 *   apply:    ALLOW_NSRIT_IMPORT=I_ACCEPT tsx ... --apply --mapping=<private file>
 *   restore:  ALLOW_NSRIT_IMPORT=I_ACCEPT tsx ... --restore --mapping=<private file>
 *
 * Remote targets need --allow-remote-dev plus ALLOW_NSRIT_REMOTE_DEV; names that
 * look like production are refused. Never run this against production.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { Client } from "pg";
import { assertApplyAllowed, assertTargetAllowed } from "./guards";

const COLLEGE_CODE = "nsrit42";
const HOST = "nsrit.development.42lms.com";
const ORG_COMPANY = "NSRIT QA Recruiter Co";

type Synthetic = {
  label: string;
  phone: string;
  email: string;
  name: string;
  roles: string[];
};

const SYNTHETIC: Synthetic[] = [
  { label: "College Admin", phone: "+919100062001", email: "nsrit.admin@vnext.test", name: "NSRIT QA College Admin", roles: ["COLLEGE_ADMIN"] },
  { label: "TPO", phone: "+919100062002", email: "nsrit.tpo@vnext.test", name: "NSRIT QA TPO", roles: ["FACULTY", "TPO"] },
];
const RECRUITER = { phone: "+919100062003", email: "nsrit.hr@vnext.test", name: "NSRIT QA Recruiter" };

type PersonaSpec = { label: string; phone: string; email: string; sql: string };

const PERSONAS: PersonaSpec[] = [
  {
    label: "Faculty (most teaching assignments)",
    phone: "+919100062004",
    email: "nsrit.faculty@vnext.test",
    sql: `SELECT cm.user_id FROM course_teaching_assignments t JOIN college_memberships cm ON cm.id = t.membership_id AND cm.college_id = $1 WHERE t.ended_at IS NULL GROUP BY cm.user_id ORDER BY count(*) DESC, cm.user_id LIMIT 1`,
  },
  {
    label: "Mentor (primary mentor of the most projects)",
    phone: "+919100062005",
    email: "nsrit.mentor@vnext.test",
    sql: `SELECT cm.user_id FROM project_members pm JOIN project_instances i ON i.id = pm.project_id AND i.college_id = $1 JOIN college_memberships cm ON cm.id = pm.membership_id WHERE pm.is_primary AND pm.ended_at IS NULL GROUP BY cm.user_id ORDER BY count(*) DESC, cm.user_id LIMIT 1`,
  },
  {
    label: "Learner (most applications)",
    phone: "+919100062006",
    email: "nsrit.learner1@vnext.test",
    sql: `SELECT cm.user_id FROM placement_applications a JOIN college_memberships cm ON cm.id = a.membership_id AND cm.college_id = $1 GROUP BY cm.user_id ORDER BY count(*) DESC, cm.user_id LIMIT 1`,
  },
  {
    label: "Learner (has an offer)",
    phone: "+919100062007",
    email: "nsrit.learner2@vnext.test",
    sql: `SELECT cm.user_id FROM placement_offers o JOIN placement_applications a ON a.id = o.application_id JOIN college_memberships cm ON cm.id = a.membership_id AND cm.college_id = $1 ORDER BY cm.user_id LIMIT 1`,
  },
  {
    label: "Learner (most notifications)",
    phone: "+919100062008",
    email: "nsrit.learner3@vnext.test",
    sql: `SELECT cm.user_id FROM in_app_notifications n JOIN college_memberships cm ON cm.user_id = n.user_id AND cm.college_id = $1 GROUP BY cm.user_id ORDER BY count(*) DESC, cm.user_id LIMIT 1`,
  },
  {
    label: "Learner (project member)",
    phone: "+919100062009",
    email: "nsrit.learner4@vnext.test",
    sql: `SELECT cm.user_id FROM project_members pm JOIN project_instances i ON i.id = pm.project_id AND i.college_id = $1 JOIN college_memberships cm ON cm.id = pm.membership_id JOIN membership_roles mr ON mr.membership_id = cm.id AND mr.role = 'LEARNER' WHERE pm.ended_at IS NULL ORDER BY cm.user_id LIMIT 1`,
  },
];

type Mapping = {
  createdAt: string;
  swapped: { userId: string; label: string; originalPhone: string | null; originalEmail: string | null; testPhone: string; testEmail: string }[];
  createdUserIds: string[];
};

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "true";
}

async function one<T>(client: Client, sql: string, params: unknown[] = []): Promise<T | null> {
  const r = await client.query(sql, params);
  return (r.rows[0] as T | undefined) ?? null;
}

async function upsertUser(client: Client, phone: string, email: string, name: string): Promise<string> {
  const existing = await one<{ id: string }>(client, `SELECT id FROM users WHERE phone_e164 = $1 OR lower(email) = $2 LIMIT 1`, [phone, email]);
  if (existing) return existing.id;
  const row = await one<{ id: string }>(
    client,
    `INSERT INTO users (identity_uid, phone_e164, email, display_name) VALUES ($1, $2, $3, $4) RETURNING id`,
    [`lms_test_${phone.replace(/\D/g, "")}`, phone, email, name],
  );
  return row!.id;
}

async function main() {
  const restore = arg("restore") === "true";
  const apply = arg("apply") === "true" || restore;
  const mappingPath = arg("mapping");
  const target = assertTargetAllowed(process.env.DATABASE_URL, {
    allowRemoteDev: arg("allow-remote-dev") === "true",
    env: process.env,
  });
  if (apply) assertApplyAllowed(process.env);
  if (apply && !mappingPath) throw new Error("--mapping=<private file> is required with --apply or --restore");

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log(`target ${target.host}/${target.database} (${apply ? (restore ? "restore" : "apply") : "dry run"})`);
  try {
    await client.query("BEGIN");
    const college = await one<{ id: string }>(client, `SELECT id FROM colleges WHERE lower(code) = lower($1)`, [COLLEGE_CODE]);
    if (!college) throw new Error(`college ${COLLEGE_CODE} not found; load stage 2a first`);

    if (restore) {
      const mapping = JSON.parse(readFileSync(mappingPath!, "utf8")) as Mapping;
      for (const s of mapping.swapped) {
        await client.query(`UPDATE users SET phone_e164 = $2, email = $3, updated_at = now() WHERE id = $1`, [s.userId, s.originalPhone, s.originalEmail]);
      }
      for (const id of mapping.createdUserIds) {
        await client.query(`DELETE FROM placement_recruiter_college_grants WHERE recruiter_user_id = $1`, [id]);
        await client.query(`DELETE FROM placement_recruiter_profiles WHERE user_id = $1`, [id]);
        await client.query(`DELETE FROM faculty_profiles WHERE membership_id IN (SELECT id FROM college_memberships WHERE user_id = $1)`, [id]);
        await client.query(`DELETE FROM membership_roles WHERE membership_id IN (SELECT id FROM college_memberships WHERE user_id = $1)`, [id]);
        await client.query(`DELETE FROM college_memberships WHERE user_id = $1`, [id]);
        await client.query(`DELETE FROM users WHERE id = $1`, [id]);
      }
      console.log(`restored ${mapping.swapped.length} contacts, removed ${mapping.createdUserIds.length} QA users`);
      await client.query("COMMIT");
      return;
    }

    const adminActor = await one<{ id: string }>(client, `SELECT user_id AS id FROM system_roles WHERE role = 'SUPER_ADMIN' LIMIT 1`);

    // 1. host for the college
    const hasDomain = await one(client, `SELECT 1 FROM tenant_domains WHERE lower(host) = $1`, [HOST]);
    if (!hasDomain) {
      await client.query(
        `INSERT INTO tenant_domains (college_id, host, is_primary, is_verified, verified_at, last_checked_at, last_check_result)
         VALUES ($1, $2, true, true, now(), now(), 'VERIFIED')`,
        [college.id, HOST],
      );
    }

    const mapping: Mapping = { createdAt: new Date().toISOString(), swapped: [], createdUserIds: [] };

    // 2. synthetic admin + TPO
    for (const account of SYNTHETIC) {
      const existed = await one(client, `SELECT 1 FROM users WHERE phone_e164 = $1`, [account.phone]);
      const userId = await upsertUser(client, account.phone, account.email, account.name);
      if (!existed) mapping.createdUserIds.push(userId);
      const membership =
        (await one<{ id: string }>(client, `SELECT id FROM college_memberships WHERE user_id = $1 AND college_id = $2`, [userId, college.id])) ??
        (await one<{ id: string }>(client, `INSERT INTO college_memberships (user_id, college_id) VALUES ($1, $2) RETURNING id`, [userId, college.id]))!;
      for (const role of account.roles) {
        await client.query(`INSERT INTO membership_roles (membership_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [membership.id, role]);
      }
      if (account.roles.includes("FACULTY")) {
        const dept = await one<{ id: string }>(client, `SELECT id FROM departments WHERE college_id = $1 AND archived_at IS NULL ORDER BY created_at LIMIT 1`, [college.id]);
        await client.query(
          `INSERT INTO faculty_profiles (membership_id, primary_department_id, employment_type, academic_title)
           VALUES ($1, $2, 'FULL_TIME', 'Assistant Professor') ON CONFLICT DO NOTHING`,
          [membership.id, dept?.id ?? null],
        );
      }
    }

    // 3. synthetic recruiter with a dated, verified grant
    if (adminActor) {
      const existedHr = await one(client, `SELECT 1 FROM users WHERE phone_e164 = $1`, [RECRUITER.phone]);
      const hrId = await upsertUser(client, RECRUITER.phone, RECRUITER.email, RECRUITER.name);
      if (!existedHr) mapping.createdUserIds.push(hrId);
      const company =
        (await one<{ id: string }>(client, `SELECT id FROM placement_companies WHERE lower(name) = lower($1)`, [ORG_COMPANY])) ??
        (await one<{ id: string }>(
          client,
          `INSERT INTO placement_companies (name, primary_domain, created_by_user_id) VALUES ($1, 'nsrit-qa.test', $2) RETURNING id`,
          [ORG_COMPANY, adminActor.id],
        ))!;
      await client.query(
        `INSERT INTO placement_recruiter_profiles (user_id, company_id, title, created_by_user_id)
         VALUES ($1, $2, 'Talent Partner', $3) ON CONFLICT DO NOTHING`,
        [hrId, company.id, adminActor.id],
      );
      const relationship =
        (await one<{ id: string }>(client, `SELECT id FROM placement_company_relationships WHERE college_id = $1 AND company_id = $2`, [college.id, company.id])) ??
        (await one<{ id: string }>(
          client,
          `INSERT INTO placement_company_relationships (college_id, company_id, created_by_user_id) VALUES ($1, $2, $3) RETURNING id`,
          [college.id, company.id, adminActor.id],
        ))!;
      const hasGrant = await one(
        client,
        `SELECT 1 FROM placement_recruiter_college_grants WHERE recruiter_user_id = $1 AND company_relationship_id = $2 AND status = 'ACTIVE'`,
        [hrId, relationship.id],
      );
      if (!hasGrant) {
        await client.query(
          `INSERT INTO placement_recruiter_college_grants
             (recruiter_user_id, company_relationship_id, granted_by_user_id, valid_until, capabilities, verification_status)
           VALUES ($1, $2, $3, now() + interval '365 days', ARRAY['DRIVES','APPLICANT_EXPORT','INTERVIEWS','MESSAGES'], 'VERIFIED')`,
          [hrId, relationship.id, adminActor.id],
        );
      }
    }

    // 4. contact swaps for personas with data
    const used = new Set<string>();
    for (const persona of PERSONAS) {
      const pick = await one<{ user_id: string }>(client, persona.sql, [college.id]);
      if (!pick || used.has(pick.user_id)) {
        console.log(`skip ${persona.label}: ${pick ? "same person as another persona" : "no matching person"}`);
        continue;
      }
      used.add(pick.user_id);
      const before = await one<{ phone_e164: string | null; email: string | null }>(client, `SELECT phone_e164, email FROM users WHERE id = $1`, [pick.user_id]);
      await client.query(`UPDATE users SET phone_e164 = $2, email = $3, updated_at = now() WHERE id = $1`, [pick.user_id, persona.phone, persona.email]);
      mapping.swapped.push({
        userId: pick.user_id,
        label: persona.label,
        originalPhone: before?.phone_e164 ?? null,
        originalEmail: before?.email ?? null,
        testPhone: persona.phone,
        testEmail: persona.email,
      });
    }

    console.log(`host ${HOST}; synthetic users ${mapping.createdUserIds.length}; swapped contacts ${mapping.swapped.length}`);
    if (apply) {
      writeFileSync(mappingPath!, JSON.stringify(mapping, null, 2), { mode: 0o600 });
      await client.query("COMMIT");
      console.log(`applied; private restore mapping written to the --mapping path`);
    } else {
      await client.query("ROLLBACK");
      console.log("dry run: rolled back");
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
