import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {SEED_IDS} from "../../scripts/db-seed-data";
import type {RequestContext} from "@/modules/identity/context";
import {
 createDepartment,renameDepartment,listDepartments,archiveDepartment,
} from "@/modules/departments/service";

/** DB-004 legacy Department mapped to registered departments: the six fields
 * preserve college scope and archived-at semantics without allowing raw
 * legacy numeric identifiers to become tenant/role authority.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||url!==process.env.DATABASE_URL)
 throw new Error("DB004 departments require disposable matching PostgreSQL URL");
const pool=new Pool({connectionString:url,max:2});
const superAdmin:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"seed-superadmin",
 platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("DB-004 department field and archive semantics",()=>{
 it("round-trips every active legacy department field and hides archived scope",async()=>{
  const suffix=randomUUID();
  let id:string|null=null;
  try{
   const name="DB004 Initial "+suffix;
   const created=await createDepartment(superAdmin,{
    collegeId:SEED_IDS.collegeA,name,
   });
   expect(created).toMatchObject({collegeId:SEED_IDS.collegeA,name});
   id=created.id;
   const initial=await pool.query<{
    id:string;college_id:string;name:string;
    created_at:Date;updated_at:Date;archived_at:Date|null;
   }>("select * from departments where id=$1",[id]);
   expect(initial.rows[0]).toMatchObject({
    id,college_id:SEED_IDS.collegeA,name,archived_at:null,
   });
   expect(initial.rows[0]?.created_at).toBeInstanceOf(Date);
   expect(initial.rows[0]?.updated_at).toBeInstanceOf(Date);
   const newName="DB004 Renamed "+suffix;
   await renameDepartment(superAdmin,id,newName);
   const updated=await pool.query<{name:string;updated_at:Date}>(
    "select name,updated_at from departments where id=$1",[id]);
   expect(updated.rows[0]?.name).toBe(newName);
   expect(updated.rows[0]?.updated_at.getTime()).toBeGreaterThanOrEqual(
    initial.rows[0]!.updated_at.getTime());
   expect(await listDepartments(superAdmin,SEED_IDS.collegeA))
    .toEqual(expect.arrayContaining([expect.objectContaining({
      id,collegeId:SEED_IDS.collegeA,name:newName,
    })]));
   expect(await listDepartments(superAdmin,SEED_IDS.collegeB))
    .not.toEqual(expect.arrayContaining([expect.objectContaining({id})]));
   await archiveDepartment(superAdmin,id);
   const archived=await pool.query<{archived_at:Date;updated_at:Date}>(
    "select archived_at,updated_at from departments where id=$1",[id]);
   expect(archived.rows[0]?.archived_at).toBeInstanceOf(Date);
   expect(archived.rows[0]?.updated_at.getTime()).toBeGreaterThanOrEqual(
    initial.rows[0]!.updated_at.getTime());
   expect(await listDepartments(superAdmin,SEED_IDS.collegeA))
    .not.toEqual(expect.arrayContaining([expect.objectContaining({id})]));
  }finally{
   if(id){
    await pool.query(
     "delete from in_app_notifications where event_id in (select id from activity_events where subject_id=$1)",[id]);
    await pool.query("delete from activity_events where subject_id=$1",[id]);
    await pool.query("delete from departments where id=$1",[id]);
   }
  }
 });
});
