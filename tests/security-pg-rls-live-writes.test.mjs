/**
 * Live positive/negative RLS *write* witnesses, only in a disposable local
 * PostgreSQL 17 database. All intentionally insecure tables are temporary
 * fixtures, never a migration nor advice to apply to a real tenant schema.
 */
import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { auditPostgresSecurity } from "../scripts/security/pg-rls-readonly-audit.mjs";

const url=process.env.TEST_DATABASE_URL;
const enabled=process.env.SECURITY_RLS_DISPOSABLE==="1"&&Boolean(url);
const role="lms_security_catalog_write_app";
const password="disposable-rls-writes-fixture";
const collegeA="11111111-1111-4111-8111-111111111111";
const collegeB="22222222-2222-4222-8222-222222222222";
const names=[
  "security_rls_w_insert",
  "security_rls_w_insert_restrict",
  "security_rls_w_update_old",
  "security_rls_w_update_move",
  "security_rls_w_update_both",
  "security_rls_w_delete",
  "security_rls_w_guarded",
  "security_rls_w_noop_restrict",
];
const scoped="(college_id = nullif(current_setting('app.college_id',true),'')::uuid)";

function requireLocalDisposable(){
  if(!enabled)throw new Error("RLS_WRITE_DISPOSABLE_REQUIRED");
  const target=new URL(url);
  if(!["127.0.0.1","localhost"].includes(target.hostname)||
     target.pathname!=="/lms_vnext_rls_test"||
     !["postgres:","postgresql:"].includes(target.protocol))
    throw new Error("RLS_WRITE_REFUSED_NON_LOCAL_DATABASE");
}

test("restricted app SQL proves unsafe INSERT, UPDATE old/new and DELETE policy bypasses",{
  skip:!enabled,
},async()=>{
  requireLocalDisposable();
  const admin=new pg.Client({connectionString:url});
  await admin.connect();
  let app;
  try{
    await admin.query("CREATE ROLE "+role+
      " LOGIN PASSWORD '"+password+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION");
    await admin.query("GRANT USAGE ON SCHEMA public TO "+role);
    for(const table of names){
      await admin.query("CREATE TABLE public."+table+
        " (id integer PRIMARY KEY, college_id uuid NOT NULL, note text NOT NULL)");
      await admin.query("INSERT INTO public."+table+
        " (id,college_id,note) VALUES (1,$1,'college-a'),(2,$2,'college-b')",[collegeA,collegeB]);
      await admin.query("ALTER TABLE public."+table+" ENABLE ROW LEVEL SECURITY");
      await admin.query("ALTER TABLE public."+table+" FORCE ROW LEVEL SECURITY");
    }
    const t=name=>"public.security_rls_w_"+name;
    for(const table of ["insert","insert_restrict","noop_restrict"])
      await admin.query("GRANT INSERT ON "+t(table)+" TO "+role);
    for(const table of ["update_old","update_move","update_both"])
      await admin.query("GRANT SELECT, UPDATE ON "+t(table)+" TO "+role);
    await admin.query("GRANT SELECT, DELETE ON "+t("delete")+" TO "+role);
    // TRUNCATE ignores RLS, even on FORCE RLS tables. Expose this grant
    // only in the disposable fixture and prove the audit catches it.
    await admin.query("GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON "+t("guarded")+" TO "+role);

    await admin.query("CREATE POLICY insert_open ON "+t("insert")+
      " FOR INSERT TO PUBLIC WITH CHECK (true)");
    await admin.query("CREATE POLICY insert_broad ON "+t("insert_restrict")+
      " FOR INSERT TO PUBLIC WITH CHECK (true)");
    await admin.query("CREATE POLICY insert_restrict ON "+t("insert_restrict")+
      " AS RESTRICTIVE FOR INSERT TO "+role+" WITH CHECK "+scoped);
    await admin.query("CREATE POLICY insert_broad ON "+t("noop_restrict")+
      " FOR INSERT TO PUBLIC WITH CHECK (true)");
    await admin.query("CREATE POLICY insert_noop ON "+t("noop_restrict")+
      " AS RESTRICTIVE FOR INSERT TO "+role+" WITH CHECK (true)");

    for(const table of ["update_old","update_both","delete"])
      await admin.query("CREATE POLICY read_all ON "+t(table)+
        " FOR SELECT TO PUBLIC USING (true)");
    await admin.query("CREATE POLICY read_own ON "+t("update_move")+
      " FOR SELECT TO "+role+" USING (true)");
    await admin.query("CREATE POLICY update_others ON "+t("update_old")+
      " FOR UPDATE TO "+role+" USING (true) WITH CHECK "+scoped);
    await admin.query("CREATE POLICY update_move ON "+t("update_move")+
      " FOR UPDATE TO "+role+" USING "+scoped+" WITH CHECK (true)");
    await admin.query("CREATE POLICY update_all ON "+t("update_both")+
      " FOR UPDATE TO PUBLIC USING (true) WITH CHECK (true)");
    await admin.query("CREATE POLICY delete_all ON "+t("delete")+
      " FOR DELETE TO PUBLIC USING (true)");
    await admin.query("CREATE POLICY guarded_all ON "+t("guarded")+
      " FOR ALL TO "+role+" USING "+scoped+" WITH CHECK "+scoped);

    const appUrl=new URL(url);
    appUrl.username=role;
    appUrl.password=password;
    const report=await auditPostgresSecurity(appUrl.toString());
    assert.equal(report.principal.runtime_user,role);
    assert.equal(report.principal.is_superuser,false);
    assert.equal(report.principal.can_bypass_rls,false);
    const relevant=report.tables.filter(row=>names.includes(row.table_name));
    assert.equal(relevant.length,names.length);
    assert(relevant.every(row=>row.rls_enabled&&row.rls_forced));
    const writeFindings=report.findings.filter(f=>f.code.startsWith("APP_UNSCOPED_PERMISSIVE_")
      && f.code!=="APP_UNSCOPED_PERMISSIVE_SELECT")
      .filter(f=>names.some(name=>f.table==="public."+name));
    assert.deepEqual(writeFindings.map(f=>[f.code,f.table]),[
      ["APP_UNSCOPED_PERMISSIVE_DELETE","public.security_rls_w_delete"],
      ["APP_UNSCOPED_PERMISSIVE_INSERT","public.security_rls_w_insert"],
      ["APP_UNSCOPED_PERMISSIVE_INSERT","public.security_rls_w_noop_restrict"],
      ["APP_UNSCOPED_PERMISSIVE_UPDATE_USING","public.security_rls_w_update_both"],
      ["APP_UNSCOPED_PERMISSIVE_UPDATE_CHECK","public.security_rls_w_update_both"],
      ["APP_UNSCOPED_PERMISSIVE_UPDATE_CHECK","public.security_rls_w_update_move"],
      ["APP_UNSCOPED_PERMISSIVE_UPDATE_USING","public.security_rls_w_update_old"],
    ]);
    for(const table of ["security_rls_w_insert_restrict","security_rls_w_guarded"])
      assert.equal(writeFindings.some(f=>f.table==="public."+table),false);
    assert(report.findings.some(f=>f.code==="APP_CAN_TRUNCATE_TENANT_TABLE" &&
      f.table==="public.security_rls_w_guarded"));

    app=new pg.Client({connectionString:appUrl.toString()});
    await app.connect();
    await app.query("BEGIN");
    await app.query("SELECT set_config('app.college_id',$1,true)",[collegeA]);
    try{
      // The deliberately unsafe policies accept inserts for college B even
      // though the authenticated app principal is acting for college A.
      for(const table of ["insert","noop_restrict"]){
        const result=await app.query("INSERT INTO "+t(table)+
          " (id,college_id,note) VALUES (3,$1,'cross-tenant insert')",[collegeB]);
        assert.equal(result.rowCount,1);
      }
      await app.query("SAVEPOINT insert_restrict_denial");
      await assert.rejects(
        app.query("INSERT INTO "+t("insert_restrict")+
          " (id,college_id,note) VALUES (3,$1,'blocked')",[collegeB]),
        error=>error.code==="42501");
      await app.query("ROLLBACK TO SAVEPOINT insert_restrict_denial");

      // WITH CHECK scopes the NEW row but unscoped USING lets an actor
      // overwrite a different college's ORIGINAL row.
      const otherUpdated=await app.query("UPDATE "+t("update_old")+
        " SET note='illicit other-college edit', college_id=$1 WHERE id=2",[collegeA]);
      assert.equal(otherUpdated.rowCount,1);
      // USING scopes the OLD row but an unrestricted WITH CHECK lets it
      // be reassigned to another college.
      const moved=await app.query("UPDATE "+t("update_move")+
        " SET college_id=$1 WHERE id=1",[collegeB]);
      assert.equal(moved.rowCount,1);
      const both=await app.query("UPDATE "+t("update_both")+
        " SET note='illicit edit' WHERE id=2");
      assert.equal(both.rowCount,1);
      const erased=await app.query("DELETE FROM "+t("delete")+" WHERE id=2");
      assert.equal(erased.rowCount,1);

      // An ordinary correctly-scoped ALL policy blocks each cross-tenant
      // mutation (not merely cross-tenant SELECT).
      assert.deepEqual((await app.query("SELECT id FROM "+t("guarded")+
        " ORDER BY id")).rows.map(x=>x.id),[1]);
      const deniedUpdate=await app.query("UPDATE "+t("guarded")+
        " SET note='blocked' WHERE id=2");
      assert.equal(deniedUpdate.rowCount,0);
      const deniedDelete=await app.query("DELETE FROM "+t("guarded")+" WHERE id=2");
      assert.equal(deniedDelete.rowCount,0);
      await app.query("SAVEPOINT guarded_insert_denial");
      await assert.rejects(
        app.query("INSERT INTO "+t("guarded")+
          " (id,college_id,note) VALUES (3,$1,'blocked')",[collegeB]),
        error=>error.code==="42501");
      await app.query("ROLLBACK TO SAVEPOINT guarded_insert_denial");
      assert.equal((await app.query("INSERT INTO "+t("guarded")+
        " (id,college_id,note) VALUES (3,$1,'allowed')",[collegeA])).rowCount,1);
      // This is why the app runtime must NEVER have TRUNCATE on tenant tables:
      // even a correct RLS policy cannot stop destruction of college B data.
      await app.query("TRUNCATE TABLE "+t("guarded"));
      assert.equal((await app.query("SELECT count(*) AS count FROM "+t("guarded")))
        .rows[0].count,"0");
    } finally {
      // Never persist intentionally malicious fixture writes.
      await app.query("ROLLBACK");
    }
  } finally {
    if(app)await app.end();
    try{
      for(const table of [...names].reverse())
        await admin.query("DROP TABLE IF EXISTS public."+table+" CASCADE");
      await admin.query("REVOKE USAGE ON SCHEMA public FROM "+role);
      await admin.query("DROP ROLE IF EXISTS "+role);
    } finally {
      await admin.end();
    }
  }
});
