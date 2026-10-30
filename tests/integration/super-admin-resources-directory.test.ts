import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listSuperAdminContentDirectory} from "@/modules/courses/super-admin-content-directory-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=!!process.env.TEST_DATABASE_URL&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"admin-resources",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
const ids={period:randomUUID(),program:randomUUID(),cohort:randomUUID(),course:randomUUID(),offering:randomUUID(),
 path:randomUUID(),lesson:randomUUID(),video:randomUUID(),resource:randomUUID()};
const name="admin-resource-"+ids.video.slice(0,8);
describe.skipIf(!enabled)("Super Admin resources directory disposable PostgreSQL",()=>{
 beforeAll(async()=>{
  await pool!.query("insert into academic_periods(id,college_id,name,code,start_date,end_date) values ($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",[ids.period,SEED_IDS.collegeA,name]);
  await pool!.query("insert into programs(id,department_id,name,code,duration_terms) values ($1,$2,$3::text,$3::text,8)",[ids.program,SEED_IDS.departmentA,name]);
  await pool!.query("insert into cohorts(id,program_id,name,code,start_period_id) values ($1,$2,$3::text,$3::text,$4)",[ids.cohort,ids.program,name,ids.period]);
  await pool!.query("insert into courses(id,department_id,name,code) values ($1,$2,$3::text,$3::text)",[ids.course,SEED_IDS.departmentA,name]);
  await pool!.query("insert into course_offerings(id,course_id,cohort_id,academic_period_id) values ($1,$2,$3,$4)",[ids.offering,ids.course,ids.cohort,ids.period]);
  await pool!.query("insert into course_learning_paths(id,offering_id,title) values ($1,$2,$3)",[ids.path,ids.offering,name]);
  await pool!.query("insert into course_lessons(id,learning_path_id,name,sequence) values ($1,$2,$3,0)",[ids.lesson,ids.path,name]);
  await pool!.query("insert into lesson_contents(id,lesson_id,content_type,title,sequence,storage_key,duration_seconds,created_by_user_id) values ($1,$2,'VIDEO',$3,0,$4,120,$5)",
   [ids.video,ids.lesson,"Video "+name,"vnext-dev/tests/"+name+".mp4",SEED_IDS.superAdminUser]);
  await pool!.query("insert into lesson_contents(id,lesson_id,content_type,title,sequence,notes,created_by_user_id) values ($1,$2,'RESOURCE',$3,1,'Read this',$4)",
   [ids.resource,ids.lesson,"Resource "+name,SEED_IDS.superAdminUser]);
 });
 afterAll(async()=>{try{if(pool){
  for(const [table,id] of [["lesson_contents",ids.video],["lesson_contents",ids.resource],["course_lessons",ids.lesson],
   ["course_learning_paths",ids.path],["course_offerings",ids.offering],["courses",ids.course],
   ["cohorts",ids.cohort],["programs",ids.program],["academic_periods",ids.period]] as const)
   {if(table==="courses") await pool.query("delete from program_term_courses where course_id=$1",[id]);
    await pool.query(`delete from ${table} where id=$1`,[id]);}
 }}finally{await pool?.end();await closeDatabaseConnection();}});
 it("returns only resources, hides other kinds and foreign-college content",async()=>{
  const videos=await listSuperAdminContentDirectory(admin,"RESOURCES",{q:name,offeringId:ids.offering});
  expect(videos.items.map(row=>row.id)).toEqual([ids.resource]);
  expect(videos.items[0]).not.toHaveProperty("storageKey");
  const foreign={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}};
  expect((await listSuperAdminContentDirectory(foreign,"RESOURCES",{q:name,offeringId:ids.offering})).items).toHaveLength(0);
 });
 it("rejects wrong-role and malformed query before a read",async()=>{
  await expect(listSuperAdminContentDirectory({...admin,user:{...admin.user,systemRoles:[]}},"RESOURCES",{}))
   .rejects.toBeInstanceOf(AuthorizationError);
  await expect(listSuperAdminContentDirectory(admin,"RESOURCES",{page:0})).rejects.toBeDefined();
 });
});
