import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  createCourseLesson, moveCollegeCourseLesson, updateCourseLesson,
  archiveCourseLesson, restoreCourseLesson,
} from "@/modules/courses/lesson-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if(enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL }) : null;
const admin: RequestContext = {
  user: {id:SEED_IDS.collegeAdminUser,identityUid:"lesson-reorder-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership: {id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const foreign: RequestContext = {
  user: {...admin.user,id:SEED_IDS.facultyUser},
  membership: {id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const ids={ period:randomUUID(),program:randomUUID(),cohort:randomUUID(),
  course:randomUUID(),offering:randomUUID(),path:randomUUID() };
const prefix="w-lessons-"+ids.path.slice(0,8);
const lessonIds:string[]=[];

describe.skipIf(!enabled)("College Admin lesson create/edit/move PostgreSQL",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("isolated PG required");
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",[ids.period,SEED_IDS.collegeA,prefix,prefix]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",[ids.program,SEED_IDS.departmentA,prefix,prefix]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",[ids.cohort,ids.program,prefix,prefix,ids.period]);
    await pool.query("INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",[ids.course,SEED_IDS.departmentA,prefix,prefix]);
    await pool.query("INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)",[ids.offering,ids.course,ids.cohort,ids.period]);
    await pool.query("INSERT INTO course_learning_paths(id,offering_id,title) VALUES($1,$2,$3)",[ids.path,ids.offering,prefix]);
  });
  afterAll(async()=>{
    try{
      if(pool){
        // Activity events are append-only: never delete those audit rows.
        for(const id of lessonIds) await pool.query("DELETE FROM course_lessons WHERE id=$1",[id]);
        for(const [table,id] of [
          ["course_learning_paths",ids.path],["course_offerings",ids.offering],
          ["courses",ids.course],["cohorts",ids.cohort],
          ["programs",ids.program],["academic_periods",ids.period],
        ] as const) {
          if(table==="courses") await pool.query("DELETE FROM program_term_courses WHERE course_id=$1",[id]);
          if(table==="programs") await pool.query("DELETE FROM program_terms WHERE program_id=$1",[id]);
          await pool.query(`DELETE FROM ${table} WHERE id=$1`,[id]);
        }
      }
    }finally{await pool?.end();await closeDatabaseConnection();}
  });
  it("creates, edits, moves with immutable audit, and rejects foreign college",async()=>{
    const first=await createCourseLesson(admin,{learningPathId:ids.path,name:prefix+" 1",sequence:0});
    lessonIds.push(first.id);
    const second=await createCourseLesson(admin,{learningPathId:ids.path,name:prefix+" 2",sequence:1});
    lessonIds.push(second.id);
    const edited=await updateCourseLesson(admin,second.id,{
      name:prefix+" revised",expectedUpdatedAt:second.updatedAt.toISOString(),
    });
    expect(edited.name).toContain("revised");
    await expect(moveCollegeCourseLesson(foreign,{learningPathId:ids.path,lessonId:second.id,expectedSequence:1,direction:"UP"}))
      .rejects.toBeInstanceOf(AuthorizationError);
    const moved=await moveCollegeCourseLesson(admin,{learningPathId:ids.path,lessonId:second.id,expectedSequence:1,direction:"UP"});
    expect(moved.sequence).toBe(0);
    const rows=await pool!.query("SELECT id,sequence FROM course_lessons WHERE id=ANY($1::uuid[]) ORDER BY sequence",[lessonIds]);
    expect(rows.rows.map(row=>row.id)).toEqual([second.id,first.id]);
    await expect(moveCollegeCourseLesson(admin,{learningPathId:ids.path,lessonId:second.id,expectedSequence:1,direction:"UP"})).rejects.toBeDefined();
    const audit=await pool!.query("SELECT event_type FROM activity_events WHERE subject_type='course_lesson' AND subject_id=$1 ORDER BY occurred_at",[second.id]);
    expect(audit.rows.map(row=>row.event_type)).toEqual(expect.arrayContaining([
      "courses.lesson.created","courses.lesson.updated","courses.lesson.reordered",
    ]));
  });
  it("COL-course-tabs-15 restores archived lessons while keeping historical records",async()=>{
    const created=await createCourseLesson(admin,{
      learningPathId:ids.path,name:prefix+" recovered",sequence:7,
    });
    lessonIds.push(created.id);
    const archived=await archiveCourseLesson(admin,created.id);
    expect(archived.status).toBe("ARCHIVED");
    await expect(restoreCourseLesson(foreign,created.id)).rejects.toBeInstanceOf(AuthorizationError);
    const restored=await restoreCourseLesson(admin,created.id);
    expect(restored.status).toBe("ACTIVE");
    const [persisted]= (await pool!.query("SELECT status FROM course_lessons WHERE id=$1",[created.id])).rows;
    expect(persisted?.status).toBe("ACTIVE");
    const events=await pool!.query("SELECT summary FROM activity_events WHERE subject_type='course_lesson' AND subject_id=$1",[created.id]);
    expect(events.rows.map(row=>row.summary)).toContain("Restored lesson");
  });

  it("COL-course-tabs-15 never overwrites a newer active lesson with the same name",async()=>{
    const name=prefix+" conflict";
    const original=await createCourseLesson(admin,{learningPathId:ids.path,name,sequence:11});
    lessonIds.push(original.id);
    await archiveCourseLesson(admin,original.id);
    const replacement=await createCourseLesson(admin,{learningPathId:ids.path,name,sequence:12});
    lessonIds.push(replacement.id);
    await expect(restoreCourseLesson(admin,original.id))
      .rejects.toMatchObject({code:"LESSON_NAME_CONFLICT"});
    const rows=await pool!.query("SELECT id,status FROM course_lessons WHERE id=ANY($1::uuid[])",[[original.id,replacement.id]]);
    expect(rows.rows.find(row=>row.id===original.id)?.status).toBe("ARCHIVED");
    expect(rows.rows.find(row=>row.id===replacement.id)?.status).toBe("ACTIVE");
  });
  it("COL-course-tabs-15 does not generate extra audit events for an already active lesson",async()=>{
    const created=await createCourseLesson(admin,{learningPathId:ids.path,name:prefix+" idempotent",sequence:15});
    lessonIds.push(created.id);
    await archiveCourseLesson(admin,created.id);
    await restoreCourseLesson(admin,created.id);
    const before=await pool!.query("SELECT count(*)::int AS n FROM activity_events WHERE subject_type='course_lesson' AND subject_id=$1 AND summary='Restored lesson'",[created.id]);
    await expect(restoreCourseLesson(admin,created.id)).rejects.toMatchObject({code:"LESSON_NOT_FOUND"});
    const after=await pool!.query("SELECT count(*)::int AS n FROM activity_events WHERE subject_type='course_lesson' AND subject_id=$1 AND summary='Restored lesson'",[created.id]);
    expect(after.rows[0]?.n).toBe(before.rows[0]?.n);
  });

});
