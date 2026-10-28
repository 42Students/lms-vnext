import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

/**
 * DB-004 source → registered-PostgreSQL physical field witness.
 *
 * This verifies existence of exact active target mappings, not equivalence
 * of every legacy field's writer/reader semantics, nor third-party delivery.
 * Historical staged handoff fields are deliberately NOT live credentials.
 */
const dbUrl=process.env.TEST_DATABASE_URL;
if(!dbUrl || process.env.DATABASE_URL !== dbUrl)
  throw new Error("DB-004 field witness requires identical disposable DATABASE_URL and TEST_DATABASE_URL");
const pool=new Pool({connectionString:dbUrl,max:1});

type CrosswalkRow={
  legacyField:string;ownerTask:string;decisionStatus:string;target:string|null;
};
const ledger=JSON.parse(readFileSync("docs/planning/db01-chat05-final-field-disposition.json","utf8")) as {
  rows:CrosswalkRow[];
};
const db004=ledger.rows.filter(r=>r.ownerTask==="DB-004");
const current=JSON.parse(readFileSync("docs/planning/db004-current-owner-evidence.json","utf8")) as {
 rows:{legacyField:string;proposedPhysicalTarget:string|null;physicalVerified:boolean;
 evidenceStatus:string;runtimeSemanticsVerified:boolean;runtimeEvidence?:{suite:string}}[];
};
const exact=db004.filter(r=>r.decisionStatus==="PROPOSED_TARGET_UNVERIFIED"
  && /^[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*$/.test(r.target??""));
const retired=exact.filter(r=>r.target?.startsWith("identity_auth_handoffs."));
const live=exact.filter(r=>!r.target?.startsWith("identity_auth_handoffs."));

afterAll(async()=>{await pool.end();});

describe("DB-004 registered source → target physical catalog",()=>{
  it("audits every exact DB-004 target against the registered migrated database",async()=>{
    expect(db004).toHaveLength(195);
    expect(retired).toHaveLength(6);
    expect(live.length).toBeGreaterThanOrEqual(100);
    const missing:string[]=[];
    for(const row of live){
      const [table,column]=row.target!.split(".");
      const result=await pool.query<{present:boolean}>(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
           WHERE table_schema='public' AND table_name=$1 AND column_name=$2
        ) AS present`,[table,column]);
      if(!result.rows[0]?.present)missing.push(row.legacyField+" → "+row.target);
    }
    expect(missing).toEqual([]);
  });

  it("physically witnesses 22 accepted registered replacements without claiming legacy semantic parity",async()=>{
    const replacements=current.rows.filter(row=>row.physicalVerified &&
      row.evidenceStatus!=="EXACT_REGISTERED_FIELD_PG_WITNESS");
    expect(replacements).toHaveLength(25);
    const missing:string[]=[];
    for(const row of replacements){
      if(row.runtimeSemanticsVerified){
        const suite=row.legacyField.startsWith("tenant_domain.")
          ?"tests/integration/tenant-domains.test.ts"
          :row.legacyField.startsWith("college_branding.")
          ?"tests/integration/chat11-super-admin-branding-cas.test.ts"
          :row.legacyField.startsWith("recruiter.")
          ?"tests/integration/db01-recruiter-identity-field-semantics.test.ts"
          :row.legacyField.startsWith("college.")
          ?"tests/integration/db01-college-leadership-field-semantics.test.ts"
          :"tests/integration/db01-learner-faculty-field-semantics.test.ts";
        expect(row.runtimeEvidence?.suite).toBe(suite);
      }else{
        expect(row.runtimeEvidence).toBeUndefined();
      }
      const target=row.proposedPhysicalTarget;
      expect(target).toMatch(/^[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*$/);
      const [table,column]=target!.split(".");
      const result=await pool.query<{present:boolean}>(`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name=$1 AND column_name=$2
        ) AS present
      `,[table,column]);
      if(!result.rows[0]?.present)missing.push(row.legacyField+" → "+target);
    }
    expect(missing).toEqual([]);
  });

  it("does not resurrect the legacy raw-credential cross-host handoff table",async()=>{
    const present=await pool.query<{table_name:string|null}>(
      "select to_regclass('public.identity_auth_handoffs')::text as table_name");
    expect(present.rows[0]?.table_name).toBeNull();
    // The first-party redesign requires reauthentication at the destination.
    const route=readFileSync("src/app/auth/handoff/page.tsx","utf8");
    expect(route).toContain('redirect("/login?auth=handoff-retired"');
    expect(route).not.toContain("identity_auth_handoffs");
    expect(retired.every(r=>r.target?.startsWith("identity_auth_handoffs."))).toBe(true);
  });
});
