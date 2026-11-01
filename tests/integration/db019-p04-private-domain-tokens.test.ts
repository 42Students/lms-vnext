import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {AuthorizationError} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
import {
 createTenantDomain,listTenantDomains,ensureTenantDomainVerificationToken,
 editTenantDomainHost,
} from "@/modules/tenant-domains/service";
import {drizzleTenantDomainRepository as repository} from "@/modules/tenant-domains/repository";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=Boolean(process.env.TEST_DATABASE_URL &&
 process.env.DB03_ISOLATED_TEST_DATABASE==="1");
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL}):null;
const privileged:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"p04-real-superadmin",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
const stale:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"p04-stale-global",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
afterAll(async()=>{await pool?.end();await closeDatabaseConnection();});
describe.skipIf(!enabled)("DB19-P04 live authorization before disclosing DNS tokens",()=>{
 it("rejects stale SUPER_ADMIN listing, idempotent creation, token ensure and no-op edit",async()=>{
  const host="db019-p04-"+randomUUID()+".example.test";
  const created=await createTenantDomain(privileged,{
   collegeId:SEED_IDS.collegeA,host,
  },repository,()=>"real-p04-private-proof");
  try{
   expect(created.verificationToken).toBe("real-p04-private-proof");
   await expect(listTenantDomains(stale,SEED_IDS.collegeA,repository))
    .rejects.toBeInstanceOf(AuthorizationError);
   await expect(createTenantDomain(stale,{
    collegeId:SEED_IDS.collegeA,host,
   },repository,()=>"stale-do-not-issue"))
    .rejects.toBeInstanceOf(AuthorizationError);
   await expect(ensureTenantDomainVerificationToken(stale,created.id,repository,
    ()=> "stale-do-not-issue"))
    .rejects.toBeInstanceOf(AuthorizationError);
   await expect(editTenantDomainHost(stale,created.id,{
    expectedHost:host,host,
   },repository,()=> "stale-do-not-issue"))
    .rejects.toBeInstanceOf(AuthorizationError);
   const stored=await pool!.query<{host:string;verification_token:string|null}>(
    "select host,verification_token from tenant_domains where id=$1",[created.id]);
   expect(stored.rows[0]).toEqual({host,verification_token:"real-p04-private-proof"});
   const owner=await listTenantDomains(privileged,SEED_IDS.collegeA,repository);
   expect(owner).toContainEqual(expect.objectContaining({
    id:created.id,verificationToken:"real-p04-private-proof",
   }));
  }finally{
   await pool!.query("delete from in_app_notifications where event_id in (select id from activity_events where subject_id=$1)",[created.id]);
   await pool!.query("delete from activity_events where subject_id=$1",[created.id]);
   await pool!.query("delete from tenant_domains where id=$1",[created.id]);
  }
 });
});
