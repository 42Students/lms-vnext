#!/usr/bin/env node
// DB-017/DB09: disposable PostgreSQL acceptance for vetted additive
// placement_company_relationships.share_column_defaults migration 0043.
// All test writes occur inside one transaction that is always rolled back.
import {randomUUID} from "node:crypto";
import pg from "pg";
import {validateTarget} from "./db002-postgres-catalog-acceptance.mjs";

export async function main(){
 if(process.env.DB017_ISOLATED_TEST_DATABASE!=="1")
   throw Error("Explicit DB017_ISOLATED_TEST_DATABASE=1 required");
 const database=validateTarget(process.env.TEST_DATABASE_URL);
 if(process.env.DATABASE_URL!==process.env.TEST_DATABASE_URL)
   throw Error("DB017 integration requires identical disposable app/test DB target");
 const c=new pg.Client({connectionString:process.env.TEST_DATABASE_URL,connectionTimeoutMillis:10000,query_timeout:15000});
 await c.connect();
 let begun=false;
 try{
  await c.query("BEGIN");
  begun=true;
  const cols=(await c.query("SELECT id FROM colleges ORDER BY id LIMIT 2")).rows.map(x=>x.id);
  const users=(await c.query("SELECT id FROM users ORDER BY id LIMIT 1")).rows.map(x=>x.id);
  if(cols.length!==2||users.length!==1)throw Error("Expected two isolated seeded colleges and one test user");
  const co=(await c.query("INSERT INTO placement_companies(name,created_by_user_id) VALUES ($1,$2) RETURNING id",["db017-schema-witness-"+randomUUID(),users[0]])).rows[0].id;
  const id1=(await c.query("INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id,share_column_defaults) VALUES ($1,$2,$3,$4::jsonb) RETURNING id",[cols[0],co,users[0],JSON.stringify(["name","cgpa"])] )).rows[0].id;
  const id2=(await c.query("INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id,share_column_defaults) VALUES ($1,$2,$3,$4::jsonb) RETURNING id",[cols[1],co,users[0],JSON.stringify(["name","projects"])] )).rows[0].id;
  const invalidCases=[
   ["disallowed-field",JSON.stringify(["name","passwordHash"])],
   ["nonarray-payload",JSON.stringify({name:true})],
   ["jsonb-null-not-sql-null","null"],
  ];
  let negatives=0;
  for(const [label,payload] of invalidCases){
   await c.query("SAVEPOINT invalid_share_column");
   let rejected=false;
   try{await c.query("UPDATE placement_company_relationships SET share_column_defaults=$1::jsonb WHERE id=$2",[payload,id1]);}
   catch(e){if(e.code!=="23514")throw e;rejected=true;}
   await c.query("ROLLBACK TO SAVEPOINT invalid_share_column");
   await c.query("RELEASE SAVEPOINT invalid_share_column");
   if(!rejected)throw Error("Unsafe JSONB disclosure columns allowed: "+label);
   negatives++;
  }
  await c.query("UPDATE placement_company_relationships SET share_column_defaults=$1::jsonb WHERE id=$2",[JSON.stringify(["resume","projects","skillMatch"]),id1]);
  const values=(await c.query("SELECT college_id,share_column_defaults FROM placement_company_relationships WHERE id=ANY($1::uuid[]) ORDER BY college_id",[[id1,id2]])).rows;
  if(values.length!==2)throw Error("Expected one relationship per tenant");
  const first=values.find(x=>x.college_id===cols[0]),second=values.find(x=>x.college_id===cols[1]);
  if(JSON.stringify(first?.share_column_defaults)!==JSON.stringify(["resume","projects","skillMatch"]) ||
     JSON.stringify(second?.share_column_defaults)!==JSON.stringify(["name","projects"]))
   throw Error("Tenant-specific relationship preferences leaked across colleges");
  await c.query("UPDATE placement_company_relationships SET share_column_defaults=NULL WHERE id=$1",[id1]);
  const nullAllowed=(await c.query("SELECT share_column_defaults IS NULL AS allowed FROM placement_company_relationships WHERE id=$1",[id1])).rows[0]?.allowed===true;
  if(!nullAllowed)throw Error("Nullable default disclosure values unexpectedly rejected");
  console.log(JSON.stringify({type:"DB017_EXECUTED_POSTGRESQL_SHARE_DEFAULTS",gitSha:process.env.GITHUB_SHA??null,database,registeredMigration:"0043_db09_share_column_defaults",negativeCheckViolations:negatives,positiveWrites:4,twoCollegeIndependence:true,sqlNullAllowed:true,transactionRolledBack:true},null,2));
 }finally{
  if(begun){try{await c.query("ROLLBACK")}catch{}}
  await c.end();
 }
}
if(process.argv[1]?.endsWith("/db017-share-defaults-pg-acceptance.mjs"))
 main().catch(e=>{console.error(e);process.exitCode=1});
