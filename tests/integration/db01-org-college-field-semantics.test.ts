import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
 createOrganization,renameOrganization,listOrganizations,archiveOrganization,
} from "@/modules/organizations/service";
import {
 createCollege,updateCollege,listColleges,archiveCollege,listArchivedColleges,
} from "@/modules/colleges/service";
import { SEED_IDS } from "../../scripts/db-seed-data";

/** Field semantics are verified against real, registered PostgreSQL and
 * authorized platform admin operations, not by copying historical IDs.
 * Archive is deliberately logical, never a hard DELETE of live tenants.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url)
 throw new Error("DB-004 organization/college fields require the same disposable database URL");
const pool=new Pool({connectionString:url,max:2});
const admin:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"seed-superadmin",
 platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("DB-004 organization and college source-field behavior",()=>{
 it("round-trips active organization and college fields, then archives both without cross-tenant visibility",async()=>{
  let orgId:string|null=null,collegeId:string|null=null;
  const key=randomUUID(),name="DB004 Org "+key;
  try{
   const org=await createOrganization(admin,{name});
   orgId=org.id;
   const orgStored=await pool.query<{
    id:string;name:string;status:string;created_at:Date;updated_at:Date;
   }>("select * from organizations where id=$1",[orgId]);
   expect(orgStored.rows[0]).toMatchObject({id:orgId,name,status:"ACTIVE"});
   expect(orgStored.rows[0]?.created_at).toBeInstanceOf(Date);
   expect(orgStored.rows[0]?.updated_at).toBeInstanceOf(Date);
   const renamed="DB004 Verified Org "+key;
   await renameOrganization(admin,orgId,{name:renamed});
   const listed=await listOrganizations(admin);
   expect(listed).toEqual(expect.arrayContaining([
    expect.objectContaining({id:orgId,name:renamed}),
   ]));
   const code="db004-"+key.slice(0,8);
   const college=await createCollege(admin,{
    organizationId:orgId,name:"DB004 Test College",code,
    addressLine1:"First Lane",addressLine2:"Second Lane",
    landmark:"Library",city:"Vijayawada",state:"Andhra Pradesh",
    country:"India",postalCode:"520001",
   });
   collegeId=college.id;
   const logo="branding/"+collegeId+"/college-logo.webp";
   await updateCollege(admin,collegeId,{name:"DB004 Updated College",logoObjectPath:logo,
    addressLine1:"First Lane Updated",addressLine2:"Second Lane Updated",
    landmark:"Library Updated",city:"Guntur",state:"Andhra Pradesh",
    country:"India",postalCode:"522001"});
   const db=await pool.query<{
    id:string;organization_id:string;name:string;code:string;
    logo_object_path:string;address_line1:string;address_line2:string;
    landmark:string;city:string;state:string;country:string;postal_code:string;
    status:string;created_at:Date;updated_at:Date;
   }>("select * from colleges where id=$1",[collegeId]);
   expect(db.rows[0]).toMatchObject({
    id:collegeId,organization_id:orgId,name:"DB004 Updated College",code,
    logo_object_path:logo,address_line1:"First Lane Updated",
    address_line2:"Second Lane Updated",landmark:"Library Updated",
    city:"Guntur",state:"Andhra Pradesh",country:"India",postal_code:"522001",
    status:"ACTIVE",
   });
   expect(db.rows[0]?.created_at).toBeInstanceOf(Date);
   expect(db.rows[0]?.updated_at).toBeInstanceOf(Date);
   expect(await listColleges(admin,orgId)).toEqual(expect.arrayContaining([
    expect.objectContaining({
     id:collegeId,organizationId:orgId,name:"DB004 Updated College",
     code,logoObjectPath:logo,city:"Guntur",postalCode:"522001",
    }),
   ]));
   await archiveCollege(admin,collegeId);
   const archived=await pool.query<{status:string}>(
    "select status from colleges where id=$1",[collegeId]);
   expect(archived.rows[0]?.status).toBe("ARCHIVED");
   expect(await listColleges(admin,orgId)).not.toEqual(
    expect.arrayContaining([expect.objectContaining({id:collegeId})]));
   expect(await listArchivedColleges(admin)).toEqual(expect.arrayContaining([
    expect.objectContaining({id:collegeId,status:"ARCHIVED"}),
   ]));
   await archiveOrganization(admin,orgId);
   const archivedOrg=await pool.query<{status:string}>(
    "select status from organizations where id=$1",[orgId]);
   expect(archivedOrg.rows[0]?.status).toBe("ARCHIVED");
   expect(await listOrganizations(admin)).not.toEqual(
    expect.arrayContaining([expect.objectContaining({id:orgId})]));
  }finally{
   if(collegeId){
    await pool.query("delete from in_app_notifications where event_id in (select id from activity_events where college_id=$1)",[collegeId]);
    await pool.query("delete from activity_events where college_id=$1",[collegeId]);
    await pool.query("delete from colleges where id=$1",[collegeId]);
   }
   if(orgId){
    await pool.query("delete from in_app_notifications where event_id in (select id from activity_events where organization_id=$1)",[orgId]);
    await pool.query("delete from activity_events where organization_id=$1",[orgId]);
    await pool.query("delete from organizations where id=$1",[orgId]);
   }
  }
 });
});
