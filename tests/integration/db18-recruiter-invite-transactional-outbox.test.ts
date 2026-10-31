import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createTpoLead } from "@/modules/placements/tpo-crm-service";
import { issueTpoRecruiterInvite } from "@/modules/placements/tpo-recruiter-invite-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB018_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL!, max: 3 }) : null;
const encryptionKey = Buffer.alloc(32, 81).toString("base64");
const globalKey = Buffer.alloc(32, 82).toString("base64");
const flags = {
  DB10_OUTBOUND_READY: "DB10_VERIFIED",
  DB10_OUTBOUND_ENCRYPTION_KEY_BASE64: encryptionKey,
  DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64: globalKey,
  APP_PUBLIC_URL: "https://invites.example.test",
};
const saved = Object.fromEntries(Object.keys(flags).map(key => [key, process.env[key]]));
const ownedMessageIds:string[] = [];
const tpo:RequestContext = {
  user: { id:SEED_IDS.facultyUser, identityUid:"db18-recruiter-outbox-tpo",
    platformStatus:"ACTIVE",systemRoles:[] },
  membership: { id:SEED_IDS.facultyCollegeAMembership, collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"] },
};

async function newLinkedLead() {
  if(!pool)throw new Error("Requires an isolated registered PG17 database");
  const id=randomUUID(), companyName="DB18 Invite "+id, email="db18-"+id+"@example.test";
  const company = await pool.query<{id:string}>(
    "insert into placement_companies(name,created_by_user_id) values($1,$2) returning id",
    [companyName,SEED_IDS.facultyUser],
  );
  const relationship = await pool.query<{id:string}>(
    "insert into placement_company_relationships(college_id,company_id,created_by_user_id) "+
    "values($1,$2,$3) returning id",
    [SEED_IDS.collegeA,company.rows[0]!.id,SEED_IDS.facultyUser],
  );
  const lead=await createTpoLead(tpo,{
    collegeId:SEED_IDS.collegeA,name:"Recruiter "+id,email,companyName,
  });
  await pool.query(
    "update placement_tpo_leads set company_relationship_id=$1 "+
    "where id=$2 and college_id=$3",
    [relationship.rows[0]!.id,lead.id,SEED_IDS.collegeA],
  );
  return {lead,email};
}

async function outboundFor(leadId:string) {
  if(!pool)throw new Error("Missing isolated PG pool");
  return pool.query<{
    id:string;source_event_id:string;status:string;channel:string;
    ciphertext_base64:string;request_digest:string;
  }>(
    "select o.id,o.source_event_id,o.status,o.channel,o.ciphertext_base64,o.request_digest "+
    "from outbound_messages o join activity_events e on e.id=o.source_event_id "+
    "where e.subject_type='placement_tpo_lead' and e.subject_id=$1 "+
    "and e.college_id=$2 and o.template_key='RECRUITER_INVITATION'",
    [leadId,SEED_IDS.collegeA],
  );
}

describe.skipIf(!enabled)("DB018 transactional recruiter invitation producer, registered PG17",()=>{
  beforeAll(async()=>{
    if(!pool)throw new Error("Missing registered PostgreSQL");
    for(const [key,value] of Object.entries(flags))process.env[key]=value;
    await pool.query(
      "insert into membership_roles(membership_id,role) values($1,'TPO') "+
      "on conflict (membership_id,role) do nothing",
      [SEED_IDS.facultyCollegeAMembership],
    );
  });
  afterAll(async()=>{
    if(pool){
      if(ownedMessageIds.length)await pool.query(
        "delete from outbound_messages where id=any($1::uuid[])",
        [ownedMessageIds],
      );
      await pool.end();
    }
    for(const [key,value] of Object.entries(saved)){
      if(value===undefined)delete process.env[key];
      else process.env[key]=value;
    }
    await closeDatabaseConnection();
  });

  it("commits invite credential and encrypted queue together; never calls the provider",async()=>{
    if(!pool)throw new Error("Missing PostgreSQL pool");
    const {lead,email}=await newLinkedLead();
    const provider=vi.fn(async()=>true);
    const result=await issueTpoRecruiterInvite(
      tpo,SEED_IDS.collegeA,lead.id,new Date(),
      {sendEmail:true,deliver:provider},
    );
    expect(result.queued).toBe(true);
    expect(result.emailed).toBe(false);
    expect(result.queueHandled).toBe(true);
    expect(provider).not.toHaveBeenCalled();

    const query=await outboundFor(lead.id);
    expect(query.rows).toHaveLength(1);
    ownedMessageIds.push(query.rows[0]!.id);
    expect(query.rows[0]).toMatchObject({
      status:"PENDING",channel:"EMAIL",source_event_id:expect.any(String),
    });
    expect(JSON.stringify(query.rows)).not.toContain(email);
    expect(JSON.stringify(query.rows)).not.toContain(result.token);
    const leadRow=await pool.query<{invite_token_hash:string}>(
      "select invite_token_hash from placement_tpo_leads where id=$1",
      [lead.id],
    );
    expect(leadRow.rows[0]?.invite_token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(leadRow.rows[0]?.invite_token_hash).not.toBe(result.token);
  });

  it("blocks token rotation while an older invitation is still queued",async()=>{
    const {lead}=await newLinkedLead();
    const provider=vi.fn(async()=>true);
    const first=await issueTpoRecruiterInvite(
      tpo,SEED_IDS.collegeA,lead.id,new Date(),{sendEmail:true,deliver:provider},
    );
    expect(first.queued).toBe(true);
    const before=await outboundFor(lead.id);
    expect(before.rows).toHaveLength(1);
    ownedMessageIds.push(before.rows[0]!.id);
    await expect(issueTpoRecruiterInvite(
      tpo,SEED_IDS.collegeA,lead.id,new Date(),{sendEmail:true,deliver:provider},
    )).rejects.toMatchObject({code:"TPO_RECRUITER_INVITE_NOT_ALLOWED"});
    const after=await outboundFor(lead.id);
    expect(after.rows).toHaveLength(1);
    expect(after.rows[0]?.request_digest).toBe(before.rows[0]?.request_digest);
    expect(provider).not.toHaveBeenCalled();
  });

  it("rolls back token rotation and activity if encryption keys are unfit",async()=>{
    if(!pool)throw new Error("Missing PostgreSQL pool");
    const {lead}=await newLinkedLead();
    const before=await pool.query<{invite_token_hash:string|null}>(
      "select invite_token_hash from placement_tpo_leads where id=$1",
      [lead.id],
    );
    process.env.DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64=encryptionKey;
    try {
      await expect(issueTpoRecruiterInvite(
        tpo,SEED_IDS.collegeA,lead.id,new Date(),
        {sendEmail:true,deliver:vi.fn(async()=>true)},
      )).rejects.toMatchObject({code:"OUTBOUND_KEY_UNAVAILABLE"});
    } finally {
      process.env.DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64=globalKey;
    }
    const after=await pool.query<{invite_token_hash:string|null}>(
      "select invite_token_hash from placement_tpo_leads where id=$1",
      [lead.id],
    );
    expect(after.rows[0]?.invite_token_hash).toBe(before.rows[0]?.invite_token_hash);
    expect((await outboundFor(lead.id)).rows).toHaveLength(0);
    const activities=await pool.query<{count:string}>(
      "select count(*)::text as count from activity_events "+
      "where subject_type='placement_tpo_lead' and subject_id=$1 "+
      "and event_type='RECRUITER_LEADS_INVITE_LINK_CREATED'",
      [lead.id],
    );
    expect(activities.rows[0]?.count).toBe("0");
  });
});
