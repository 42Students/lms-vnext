import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

/** Registered DB-004 physical persistence witness; external identity provider
 * synchronization remains a separate runtime acceptance boundary.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url)
  throw new Error("DB-004 name acceptance requires disposable matching database URLs");
const pool=new Pool({connectionString:url,max:2});
async function withUser(run:(id:string)=>Promise<void>){
 const id=randomUUID();
 await pool.query("INSERT INTO users (id,identity_uid,display_name) VALUES ($1,$2,$3)",
   [id,"db004-name-"+id,"Existing Name"]);
 try{await run(id);}finally{await pool.query("DELETE FROM users WHERE id=$1",[id]);}
}
afterAll(async()=>{await pool.end();});
describe("DB-004 canonical person names, real PostgreSQL",()=>{
 it("adds nullable first/last names without guessing existing display-name structure",async()=>{
  await withUser(async id=>{
   const q=await pool.query("SELECT given_name,family_name,identity_profile_version,display_name FROM users WHERE id=$1",[id]);
   expect(q.rows[0]).toEqual({given_name:null,family_name:null,identity_profile_version:1,display_name:"Existing Name"});
  });
 });
 it("rejects blank canonical names and zero profile version at SQL boundary",async()=>{
  await withUser(async id=>{
   for(const q of ["UPDATE users SET given_name='   ' WHERE id=$1",
      "UPDATE users SET family_name='   ' WHERE id=$1",
      "UPDATE users SET identity_profile_version=0 WHERE id=$1"]){
     await expect(pool.query(q,[id])).rejects.toMatchObject({code:"23514"});
   }
   const q=await pool.query("SELECT given_name,identity_profile_version FROM users WHERE id=$1",[id]);
   expect(q.rows[0]).toEqual({given_name:null,identity_profile_version:1});
  });
 });
 it("rejects a stale second name writer using an independent version",async()=>{
  await withUser(async id=>{
   const cas="UPDATE users SET given_name=$2,family_name=$3,display_name=$4,identity_profile_version=identity_profile_version+1 WHERE id=$1 AND identity_profile_version=$5 RETURNING identity_profile_version";
   const first=await pool.query(cas,[id,"Anita","Rao","Anita Rao",1]);
   const stale=await pool.query(cas,[id,"Different","Writer","Different Writer",1]);
   expect(first.rowCount).toBe(1);expect(stale.rowCount).toBe(0);
   const q=await pool.query("SELECT given_name,family_name,display_name,identity_profile_version FROM users WHERE id=$1",[id]);
   expect(q.rows[0]).toEqual({given_name:"Anita",family_name:"Rao",display_name:"Anita Rao",identity_profile_version:2});
  });
 });
});
