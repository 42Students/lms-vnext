#!/usr/bin/env node
import pg from "pg";
import { assertSafeDb01TestTarget } from "./db01-test-database-guard.mjs";

const databaseUrl = process.env.TEST_DATABASE_URL;
assertSafeDb01TestTarget({ TEST_DATABASE_URL: databaseUrl });

const client = new pg.Client({ connectionString: databaseUrl });
const suffix = `${process.pid}-${Date.now()}`;

async function one(sql, params = []) {
  const result = await client.query(sql, params);
  if (result.rows.length !== 1) {
    throw new Error(`Expected one row, got ${result.rows.length}: ${sql}`);
  }
  return result.rows[0];
}

let savepointCounter = 0;
async function expect23514(label, fn) {
  const name = `db17_sp_${++savepointCounter}`;
  await client.query(`SAVEPOINT ${name}`);
  try {
    await fn();
    throw new Error(`${label}: expected PostgreSQL 23514`);
  } catch (error) {
    if (error?.code !== "23514") throw error;
  } finally {
    await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
    await client.query(`RELEASE SAVEPOINT ${name}`);
  }
}

await client.connect();
try {
  await client.query("BEGIN");

  const collegeA = await one(
    "select id from colleges where code='SEED-A'",
  );
  const collegeB = await one(
    "select id from colleges where code='SEED-B'",
  );
  const faculty = await one(
    "select id from users where email='faculty.seed@example.com'",
  );
  const learner = await one(
    "select id from users where email='learner.seed@example.com'",
  );
  const admin = await one(
    "select id from users where email='collegeadmin.seed@example.com'",
  );
  const facultyA = await one(
    `select cm.id
       from college_memberships cm
       join membership_roles mr on mr.membership_id=cm.id
      where cm.user_id=$1 and cm.college_id=$2 and mr.role='FACULTY'`,
    [faculty.id, collegeA.id],
  );
  const facultyB = await one(
    `select cm.id
       from college_memberships cm
       join membership_roles mr on mr.membership_id=cm.id
      where cm.user_id=$1 and cm.college_id=$2 and mr.role='FACULTY'`,
    [faculty.id, collegeB.id],
  );

  const companyA = await one(
    `insert into placement_companies
       (name,status,created_by_user_id)
     values ($1,'ACTIVE',$2)
     returning id`,
    [`DB17 Company A ${suffix}`, admin.id],
  );
  const companyOther = await one(
    `insert into placement_companies
       (name,status,created_by_user_id)
     values ($1,'ACTIVE',$2)
     returning id`,
    [`DB17 Company Other ${suffix}`, admin.id],
  );
  const relationshipA = await one(
    `insert into placement_company_relationships
       (college_id,company_id,status,is_trusted,owner_membership_id,created_by_user_id)
     values ($1,$2,'ACTIVE',false,$3,$4)
     returning id`,
    [collegeA.id, companyA.id, facultyA.id, admin.id],
  );
  const relationshipB = await one(
    `insert into placement_company_relationships
       (college_id,company_id,status,is_trusted,owner_membership_id,created_by_user_id)
     values ($1,$2,'ACTIVE',false,$3,$4)
     returning id`,
    [collegeB.id, companyA.id, facultyB.id, admin.id],
  );
  const otherRelationshipA = await one(
    `insert into placement_company_relationships
       (college_id,company_id,status,is_trusted,owner_membership_id,created_by_user_id)
     values ($1,$2,'ACTIVE',false,$3,$4)
     returning id`,
    [collegeA.id, companyOther.id, facultyA.id, admin.id],
  );

  const recruiter = await one(
    `insert into users
       (identity_uid,email,display_name,platform_status)
     values ($1,$2,$3,'ACTIVE')
     returning id`,
    [
      `db17-recruiter-${suffix}`,
      `db17-recruiter-${suffix}@example.com`,
      "DB17 Recruiter",
    ],
  );
  await client.query(
    `insert into placement_recruiter_profiles
       (user_id,company_id,status,created_by_user_id)
     values ($1,$2,'ACTIVE',$3)`,
    [recruiter.id, companyA.id, admin.id],
  );
  const grant = await one(
    `insert into placement_recruiter_college_grants
       (recruiter_user_id,company_relationship_id,status,granted_by_user_id)
     values ($1,$2,'ACTIVE',$3)
     returning id`,
    [recruiter.id, relationshipA.id, admin.id],
  );

  await expect23514("grant must bind recruiter and relationship to same company", () =>
    client.query(
      `insert into placement_recruiter_college_grants
         (recruiter_user_id,company_relationship_id,status,granted_by_user_id)
       values ($1,$2,'ACTIVE',$3)`,
      [recruiter.id, otherRelationshipA.id, admin.id],
    ),
  );
  await expect23514("recruiter company cannot move after grant history", () =>
    client.query(
      "update placement_recruiter_profiles set company_id=$2 where user_id=$1",
      [recruiter.id, companyOther.id],
    ),
  );
  await expect23514("relationship company cannot move after grant history", () =>
    client.query(
      "update placement_company_relationships set company_id=$2 where id=$1",
      [relationshipA.id, companyOther.id],
    ),
  );

  const lead = await one(
    `insert into placement_tpo_leads
       (college_id,company_relationship_id,name,email_norm,owner_membership_id,recruiter_user_id)
     values ($1,$2,$3,$4,$5,$6)
     returning id`,
    [
      collegeA.id,
      relationshipA.id,
      `DB17 Lead ${suffix}`,
      `db17-lead-${suffix}@example.com`,
      facultyA.id,
      recruiter.id,
    ],
  );

  await expect23514("cross-college lead owner", () =>
    client.query(
      `insert into placement_tpo_leads
         (college_id,name,email_norm,owner_membership_id)
       values ($1,$2,$3,$4)`,
      [
        collegeA.id,
        `DB17 bad owner ${suffix}`,
        `db17-bad-owner-${suffix}@example.com`,
        facultyB.id,
      ],
    ),
  );

  await expect23514("cross-college lead relationship", () =>
    client.query(
      `insert into placement_tpo_leads
         (college_id,company_relationship_id,name,email_norm,owner_membership_id)
       values ($1,$2,$3,$4,$5)`,
      [
        collegeA.id,
        relationshipB.id,
        `DB17 bad rel ${suffix}`,
        `db17-bad-rel-${suffix}@example.com`,
        facultyA.id,
      ],
    ),
  );

  await expect23514("recruiter relationship must match recruiter company", () =>
    client.query(
      `insert into placement_tpo_leads
         (college_id,company_relationship_id,name,email_norm,owner_membership_id,recruiter_user_id)
       values ($1,$2,$3,$4,$5,$6)`,
      [
        collegeA.id,
        otherRelationshipA.id,
        `DB17 bad company ${suffix}`,
        `db17-bad-company-${suffix}@example.com`,
        facultyA.id,
        recruiter.id,
      ],
    ),
  );

  const activity = await one(
    `insert into placement_tpo_lead_activities
       (college_id,lead_id,type,note,is_system,created_by_user_id)
     values ($1,$2,'NOTE','accepted actor',false,$3)
     returning id`,
    [collegeA.id, lead.id, faculty.id],
  );
  await client.query(
    `insert into placement_tpo_lead_activities
       (college_id,lead_id,type,note,is_system,created_by_user_id)
     values ($1,$2,'SYSTEM','accepted system actor',true,null)`,
    [collegeA.id, lead.id],
  );

  await expect23514("learner cannot forge placement activity actor", () =>
    client.query(
      `insert into placement_tpo_lead_activities
         (college_id,lead_id,type,note,is_system,created_by_user_id)
       values ($1,$2,'NOTE','bad actor',false,$3)`,
      [collegeA.id, lead.id, learner.id],
    ),
  );
  await expect23514("system activity cannot forge user actor", () =>
    client.query(
      `insert into placement_tpo_lead_activities
         (college_id,lead_id,type,note,is_system,created_by_user_id)
       values ($1,$2,'SYSTEM','bad system actor',true,$3)`,
      [collegeA.id, lead.id, faculty.id],
    ),
  );
  await expect23514("activity history is immutable on update", () =>
    client.query(
      "update placement_tpo_lead_activities set note='rewrite' where id=$1",
      [activity.id],
    ),
  );
  await expect23514("activity history is immutable on delete", () =>
    client.query(
      "delete from placement_tpo_lead_activities where id=$1",
      [activity.id],
    ),
  );

  const followup = await one(
    `insert into placement_tpo_followups
       (college_id,lead_id,due_at,owner_membership_id,note)
     values ($1,$2,now()+interval '1 day',$3,'accepted')
     returning id`,
    [collegeA.id, lead.id, facultyA.id],
  );
  await expect23514("followup owner must belong to lead college", () =>
    client.query(
      `insert into placement_tpo_followups
         (college_id,lead_id,due_at,owner_membership_id)
       values ($1,$2,now()+interval '2 days',$3)`,
      [collegeA.id, lead.id, facultyB.id],
    ),
  );
  await client.query(
    "update placement_tpo_followups set done_at=now() where id=$1",
    [followup.id],
  );
  await expect23514("completed followup cannot reopen", () =>
    client.query(
      "update placement_tpo_followups set done_at=null where id=$1",
      [followup.id],
    ),
  );
  await expect23514("completed followup cannot move due date", () =>
    client.query(
      "update placement_tpo_followups set due_at=due_at+interval '1 hour' where id=$1",
      [followup.id],
    ),
  );

  await client.query(
    `update placement_recruiter_college_grants
        set status='REVOKED',revoked_by_user_id=$2,revoked_at=now()
      where id=$1`,
    [grant.id, admin.id],
  );
  await expect23514("revoked recruiter grant cannot join a new lead", () =>
    client.query(
      `insert into placement_tpo_leads
         (college_id,name,email_norm,owner_membership_id,recruiter_user_id)
       values ($1,$2,$3,$4,$5)`,
      [
        collegeA.id,
        `DB17 revoked recruiter ${suffix}`,
        `db17-revoked-${suffix}@example.com`,
        facultyA.id,
        recruiter.id,
      ],
    ),
  );

  process.stdout.write(
    "DB017 DB09 CRM PostgreSQL acceptance PASS: same-company grants/parent immutability, scoped lead owners/relationships/recruiters, actor history, append-only activity and terminal followups.\n",
  );
} finally {
  try {
    await client.query("ROLLBACK");
  } finally {
    await client.end();
  }
}
