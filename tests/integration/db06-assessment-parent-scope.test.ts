import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { gradeAssignmentSubmission } from "@/modules/courses/assignment-submission-service";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

const url=process.env.TEST_DATABASE_URL;
const enabled=process.env.DB06_ISOLATED_TEST_DATABASE==="1"&&Boolean(url);
const pool=enabled?new Pool({connectionString:url,max:8}):null;
type Sql=Pool|PoolClient;
type Graph={program:string;period:string;cohort:string;section:string;section2:string;course:string;offering:string;delivery:string;delivery2:string;path:string;lesson:string};
const made={users:[] as string[],memberships:[] as string[],programs:[] as string[],periods:[] as string[],cohorts:[] as string[],sections:[] as string[],courses:[] as string[],offerings:[] as string[],deliveries:[] as string[],paths:[] as string[],lessons:[] as string[],quizzes:[] as string[],questions:[] as string[],attempts:[] as string[],assignments:[] as string[],submissions:[] as string[]};
let A:Graph,B:Graph,learnerEnrollment="",sectionEnrollment="";
function p(){if(!pool)throw new Error("DB06 requires TEST_DATABASE_URL + DB06_ISOLATED_TEST_DATABASE=1");return pool}
function keep<K extends keyof typeof made>(k:K,id:string){made[k].push(id);return id}
function clearMade(){for(const a of Object.values(made))a.length=0}

async function graph(db:Sql,department:string,college:string,label:string):Promise<Graph>{
 const program=keep("programs",randomUUID()),period=keep("periods",randomUUID()),cohort=keep("cohorts",randomUUID());
 const section=keep("sections",randomUUID()),section2=keep("sections",randomUUID()),course=keep("courses",randomUUID());
 const offering=keep("offerings",randomUUID()),delivery=keep("deliveries",randomUUID()),delivery2=keep("deliveries",randomUUID());
 const path=keep("paths",randomUUID()),lesson=keep("lessons",randomUUID());
 await db.query("INSERT INTO programs(id,department_id,name,code,duration_terms,status) VALUES($1,$2,$3,$4,8,'ACTIVE')",[program,department,`DB06 ${label} program`,`DB06-${label}-P-${program}`]);
 await db.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date,status) VALUES($1,$2,$3,$4,'2026-07-01','2027-06-30','ACTIVE')",[period,college,`DB06 ${label} period`,`DB06-${label}-T-${period}`]);
 await db.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id,status) VALUES($1,$2,$3,$4,$5,'ACTIVE')",[cohort,program,`DB06 ${label} cohort`,`DB06-${label}-C-${cohort}`,period]);
 for(const [id,suffix] of [[section,"A"],[section2,"B"]] as const) await db.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code,status) VALUES($1,$2,$3,$4,$5,'ACTIVE')",[id,cohort,period,`DB06 ${label} section ${suffix}`,`DB06-${label}-S-${suffix}-${id}`]);
 await db.query("INSERT INTO courses(id,department_id,name,code,status) VALUES($1,$2,$3,$4,'ACTIVE')",[course,department,`DB06 ${label} course`,`DB06-${label}-COURSE-${course}`]);
 await db.query("INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id,type,credits,display_order,status) VALUES($1,$2,$3,$4,'CORE',4,0,'ACTIVE')",[offering,course,cohort,period]);
 await db.query("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3),($4,$2,$5)",[delivery,offering,section,delivery2,section2]);
 await db.query("INSERT INTO course_learning_paths(id,offering_id,title,status) VALUES($1,$2,$3,'PUBLISHED')",[path,offering,`DB06 ${label} path`]);
 await db.query("INSERT INTO course_lessons(id,learning_path_id,name,sequence,status) VALUES($1,$2,$3,0,'ACTIVE')",[lesson,path,`DB06 ${label} lesson`]);
 return{program,period,cohort,section,section2,course,offering,delivery,delivery2,path,lesson};
}
async function enroll(db:Sql,membership:string,g:Graph){
 const le=randomUUID(),se=randomUUID();
 await db.query("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')",[le,membership,g.program,g.cohort]);
 await db.query("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id,status) VALUES($1,$2,$3,$4,'ACTIVE')",[se,le,g.section,g.period]);
 return{le,se};
}
async function learner(db:Sql,college:string){
 const user=keep("users",randomUUID()),membership=keep("memberships",randomUUID());
 await db.query("INSERT INTO users(id,identity_uid,display_name,platform_status) VALUES($1,$2,'DB06 learner','ACTIVE')",[user,`db06-${user}`]);
 await db.query("INSERT INTO college_memberships(id,user_id,college_id,status) VALUES($1,$2,$3,'ACTIVE')",[membership,user,college]);
 await db.query("INSERT INTO membership_roles(membership_id,role) VALUES($1,'LEARNER')",[membership]);
 return{user,membership};
}
async function quiz(db:Sql,lesson:string,delivery:string|null=null){const id=keep("quizzes",randomUUID());await db.query("INSERT INTO course_quizzes(id,lesson_id,delivery_id,title,max_attempts,total_points,sequence,status,created_by_user_id) VALUES($1,$2,$3,$4,3,10,0,'PUBLISHED',$5)",[id,lesson,delivery,`DB06 quiz ${id}`,SEED_IDS.collegeAdminUser]);return id}
async function question(db:Sql,q:string){const id=keep("questions",randomUUID());await db.query("INSERT INTO quiz_questions(id,quiz_id,question_type,prompt,points,sequence) VALUES($1,$2,'SINGLE_CHOICE',$3,10,0)",[id,q,`DB06 question ${id}`]);return id}
async function attempt(db:Sql,q:string,d:string,m=SEED_IDS.learnerCollegeAMembership){const id=keep("attempts",randomUUID());await db.query("INSERT INTO quiz_attempts(id,quiz_id,delivery_id,membership_id,attempt_number,score,max_score) VALUES($1,$2,$3,$4,1,10,10)",[id,q,d,m]);return id}
async function answer(db:Sql,a:string,q:string){await db.query("INSERT INTO quiz_attempt_answers(attempt_id,question_id,question_type,prompt_snapshot,points_possible,selected_option_ids,options_snapshot,correct,points_awarded) VALUES($1,$2,'SINGLE_CHOICE','snapshot',10,'[]'::jsonb,'[]'::jsonb,true,10)",[a,q])}
async function assignment(db:Sql,lesson:string,delivery:string|null=null){const id=keep("assignments",randomUUID());await db.query("INSERT INTO course_assignments(id,lesson_id,delivery_id,title,max_points,sequence,status,created_by_user_id) VALUES($1,$2,$3,$4,100,0,'PUBLISHED',$5)",[id,lesson,delivery,`DB06 assignment ${id}`,SEED_IDS.collegeAdminUser]);return id}
async function submission(db:Sql,a:string,d:string,m=SEED_IDS.learnerCollegeAMembership){const id=keep("submissions",randomUUID());await db.query("INSERT INTO assignment_submissions(id,assignment_id,delivery_id,membership_id,submission_type,text_content) VALUES($1,$2,$3,$4,'TEXT','DB06 answer')",[id,a,d,m]);return id}
async function alternateOffering(db:Sql,g:Graph){const c=keep("courses",randomUUID()),o=keep("offerings",randomUUID());await db.query("INSERT INTO courses(id,department_id,name,code,status) SELECT $1,department_id,$2,$3,'ACTIVE' FROM courses WHERE id=$4",[c,`DB06 alternate ${c}`,`DB06-ALT-${c}`,g.course]);await db.query("INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id,type,credits,display_order,status) VALUES($1,$2,$3,$4,'CORE',4,1,'ACTIVE')",[o,c,g.cohort,g.period]);return o}

async function cleanup(){
 if(!pool)return;
 if(made.attempts.length){await pool.query("DELETE FROM quiz_attempt_answers WHERE attempt_id=ANY($1::uuid[])",[made.attempts]);await pool.query("DELETE FROM quiz_attempts WHERE id=ANY($1::uuid[])",[made.attempts])}
 if(made.submissions.length)await pool.query("DELETE FROM assignment_submissions WHERE id=ANY($1::uuid[])",[made.submissions]);
 if(made.questions.length){await pool.query("DELETE FROM quiz_options WHERE question_id=ANY($1::uuid[])",[made.questions]);await pool.query("DELETE FROM quiz_questions WHERE id=ANY($1::uuid[])",[made.questions])}
 if(made.quizzes.length)await pool.query("DELETE FROM course_quizzes WHERE id=ANY($1::uuid[])",[made.quizzes]);
 if(made.assignments.length)await pool.query("DELETE FROM course_assignments WHERE id=ANY($1::uuid[])",[made.assignments]);
 if(sectionEnrollment)await pool.query("DELETE FROM section_enrollments WHERE id=$1",[sectionEnrollment]);
 if(learnerEnrollment)await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1",[learnerEnrollment]);
 if(made.memberships.length){await pool.query("DELETE FROM section_enrollments WHERE learner_enrollment_id IN(SELECT id FROM learner_program_enrollments WHERE membership_id=ANY($1::uuid[]))",[made.memberships]);await pool.query("DELETE FROM learner_program_enrollments WHERE membership_id=ANY($1::uuid[])",[made.memberships])}
 for(const [table,key] of [["course_section_deliveries","deliveries"],["course_lessons","lessons"],["course_learning_paths","paths"],["course_offerings","offerings"],["sections","sections"],["cohorts","cohorts"],["academic_periods","periods"],["courses","courses"],["programs","programs"]] as const)if(made[key].length)await pool.query(`DELETE FROM ${table} WHERE id=ANY($1::uuid[])`,[made[key]]);
 if(made.memberships.length){await pool.query("DELETE FROM membership_roles WHERE membership_id=ANY($1::uuid[])",[made.memberships]);await pool.query("DELETE FROM college_memberships WHERE id=ANY($1::uuid[])",[made.memberships])}
 if(made.users.length)await pool.query("DELETE FROM users WHERE id=ANY($1::uuid[])",[made.users]);
 learnerEnrollment="";sectionEnrollment="";clearMade();
}

beforeEach(async()=>{if(!enabled)return;clearMade();A=await graph(p(),SEED_IDS.departmentA,SEED_IDS.collegeA,"A");B=await graph(p(),SEED_IDS.departmentB,SEED_IDS.collegeB,"B");const e=await enroll(p(),SEED_IDS.learnerCollegeAMembership,A);learnerEnrollment=e.le;sectionEnrollment=e.se});
afterEach(async()=>{if(enabled)await cleanup()});
afterAll(async()=>{await pool?.end();await closeDatabaseConnection()});

describe.skipIf(!enabled)("DB06 assessment parent-scope PostgreSQL acceptance",()=>{
 it("PG01/02 deny cross-offering fixed quiz and assignment definitions",async()=>{await expect(quiz(p(),A.lesson,B.delivery)).rejects.toMatchObject({code:"23514"});await expect(assignment(p(),A.lesson,B.delivery)).rejects.toMatchObject({code:"23514"})});
 it("PG03 denies attempt through delivery from another offering",async()=>{const q=await quiz(p(),A.lesson);await expect(attempt(p(),q,B.delivery)).rejects.toMatchObject({code:"23514"})});
 it("PG04 denies a fixed-delivery quiz in another section delivery",async()=>{const q=await quiz(p(),A.lesson,A.delivery);await expect(attempt(p(),q,A.delivery2)).rejects.toMatchObject({code:"23514"})});
 it("PG05 denies an active learner membership from another college",async()=>{const x=await learner(p(),SEED_IDS.collegeB),q=await quiz(p(),A.lesson);await expect(attempt(p(),q,A.delivery,x.membership)).rejects.toMatchObject({code:"23514"})});
 it("PG06 denies same-college learner outside the target section",async()=>{const q=await quiz(p(),A.lesson);await expect(attempt(p(),q,A.delivery2)).rejects.toMatchObject({code:"23514"})});
 it("PG07 denies revoked LEARNER role and disabled platform user",async()=>{const x=await learner(p(),SEED_IDS.collegeA);await enroll(p(),x.membership,A);const q=await quiz(p(),A.lesson);await p().query("DELETE FROM membership_roles WHERE membership_id=$1 AND role='LEARNER'",[x.membership]);await expect(attempt(p(),q,A.delivery,x.membership)).rejects.toMatchObject({code:"23514"});await p().query("INSERT INTO membership_roles(membership_id,role) VALUES($1,'LEARNER')",[x.membership]);await p().query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",[x.user]);await expect(attempt(p(),q,A.delivery,x.membership)).rejects.toMatchObject({code:"23514"})});
 it("PG08 denies assignment submission through wrong delivery",async()=>{const a=await assignment(p(),A.lesson);await expect(submission(p(),a,B.delivery)).rejects.toMatchObject({code:"23514"})});
 it("PG09 denies grade above assignment maximum",async()=>{const a=await assignment(p(),A.lesson),s=await submission(p(),a,A.delivery);await expect(p().query("UPDATE assignment_submissions SET points_awarded=101,grading_status='GRADED',graded_by_user_id=$2,graded_at=now() WHERE id=$1",[s,SEED_IDS.facultyUser])).rejects.toMatchObject({code:"23514"})});
 it("PG10 denies answer question from a different quiz",async()=>{const q=await quiz(p(),A.lesson),q2=await quiz(p(),A.lesson),fq=await question(p(),q2),a=await attempt(p(),q,A.delivery);await expect(answer(p(),a,fq)).rejects.toMatchObject({code:"23514"})});
 it("PG11 accepts valid quiz answer and assignment grading path",async()=>{const q=await quiz(p(),A.lesson,A.delivery),qq=await question(p(),q),at=await attempt(p(),q,A.delivery);await answer(p(),at,qq);const as=await assignment(p(),A.lesson,A.delivery),s=await submission(p(),as,A.delivery);const g=await p().query("UPDATE assignment_submissions SET points_awarded=90,grading_status='GRADED',graded_by_user_id=$2,graded_at=now() WHERE id=$1 RETURNING points_awarded",[s,SEED_IDS.facultyUser]);expect(g.rows[0].points_awarded).toBe(90)});
 it("PG12 permits grade-only correction after enrollment becomes historical",async()=>{const a=await assignment(p(),A.lesson),s=await submission(p(),a,A.delivery);await p().query("UPDATE section_enrollments SET status='WITHDRAWN',ended_at=now() WHERE id=$1",[sectionEnrollment]);await p().query("UPDATE learner_program_enrollments SET status='WITHDRAWN',withdrawn_at=now() WHERE id=$1",[learnerEnrollment]);const g=await p().query("UPDATE assignment_submissions SET points_awarded=80,grading_status='GRADED',graded_by_user_id=$2,graded_at=now(),version=version+1 WHERE id=$1 RETURNING version",[s,SEED_IDS.facultyUser]);expect(g.rows[0].version).toBe(1)});
 it("PG13 serializes committed enrollment revocation ahead of attempt insert",async()=>{const q=await quiz(p(),A.lesson),c1=await p().connect(),c2=await p().connect();try{await c1.query("BEGIN");await c2.query("BEGIN");await c1.query("UPDATE section_enrollments SET status='WITHDRAWN',ended_at=now() WHERE id=$1",[sectionEnrollment]);const id=keep("attempts",randomUUID());const pending=c2.query("INSERT INTO quiz_attempts(id,quiz_id,delivery_id,membership_id,attempt_number,score,max_score) VALUES($1,$2,$3,$4,1,10,10)",[id,q,A.delivery,SEED_IDS.learnerCollegeAMembership]);await new Promise(r=>setTimeout(r,75));await c1.query("COMMIT");await expect(pending).rejects.toMatchObject({code:"23514"});await c2.query("ROLLBACK")}finally{try{await c1.query("ROLLBACK")}catch{}try{await c2.query("ROLLBACK")}catch{}c1.release();c2.release()}});
 it("PG14A parent move commits first; concurrent child validates committed new offering",async()=>{const q=await quiz(p(),A.lesson),alt=await alternateOffering(p(),A),c1=await p().connect(),c2=await p().connect();try{await c1.query("BEGIN");await c2.query("BEGIN");await c1.query("UPDATE course_learning_paths SET offering_id=$1 WHERE id=$2",[alt,A.path]);const id=keep("attempts",randomUUID());const pending=c2.query("INSERT INTO quiz_attempts(id,quiz_id,delivery_id,membership_id,attempt_number,score,max_score) VALUES($1,$2,$3,$4,1,10,10)",[id,q,A.delivery,SEED_IDS.learnerCollegeAMembership]);await new Promise(r=>setTimeout(r,75));await c1.query("COMMIT");await expect(pending).rejects.toMatchObject({code:"23514"});await c2.query("ROLLBACK")}finally{try{await c1.query("ROLLBACK")}catch{}try{await c2.query("ROLLBACK")}catch{}c1.release();c2.release()}});
 it("PG14B child commits first; later parent move is rejected by history guard",async()=>{const q=await quiz(p(),A.lesson),alt=await alternateOffering(p(),A),c1=await p().connect(),c2=await p().connect();try{await c1.query("BEGIN");await c2.query("BEGIN");const id=keep("attempts",randomUUID());await c1.query("INSERT INTO quiz_attempts(id,quiz_id,delivery_id,membership_id,attempt_number,score,max_score) VALUES($1,$2,$3,$4,1,10,10)",[id,q,A.delivery,SEED_IDS.learnerCollegeAMembership]);const pending=c2.query("UPDATE course_learning_paths SET offering_id=$1 WHERE id=$2",[alt,A.path]);await new Promise(r=>setTimeout(r,75));await c1.query("COMMIT");await expect(pending).rejects.toMatchObject({code:"23514"});await c2.query("ROLLBACK")}finally{try{await c1.query("ROLLBACK")}catch{}try{await c2.query("ROLLBACK")}catch{}c1.release();c2.release()}});
 it("PG14C refuses question reparent after attempt history",async()=>{const q=await quiz(p(),A.lesson),q2=await quiz(p(),A.lesson),qq=await question(p(),q);await attempt(p(),q,A.delivery);await expect(p().query("UPDATE quiz_questions SET quiz_id=$1 WHERE id=$2",[q2,qq])).rejects.toMatchObject({code:"23514"})});
 it("PG15 rejects cross-college faculty grading through service authorization",async()=>{const a=await assignment(p(),A.lesson),s=await submission(p(),a,A.delivery);const ctx:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"seed-shared-faculty",platformStatus:"ACTIVE",systemRoles:[]},membership:{id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["FACULTY"]}};await expect(gradeAssignmentSubmission(ctx,s,{pointsAwarded:50,feedback:"cross-college",expectedVersion:0})).rejects.toBeDefined();const row=await p().query("SELECT grading_status,points_awarded,graded_by_user_id FROM assignment_submissions WHERE id=$1",[s]);expect(row.rows[0]).toMatchObject({grading_status:"NOT_GRADED",points_awarded:null,graded_by_user_id:null})});
 it("PG16 preflight reports poisoned rows and rollback preserves no poison",async()=>{const sql=readFileSync("drizzle/0041_db06_assessment_parent_scope.sql","utf8"),start=sql.indexOf("DO $db06_preflight$"),end=sql.indexOf("--> statement-breakpoint",start),preflight=sql.slice(start,end).trim(),client=await p().connect(),id=keep("quizzes",randomUUID());try{await client.query("BEGIN");await client.query("ALTER TABLE course_quizzes DISABLE TRIGGER db06_course_quiz_parent_guard");await client.query("INSERT INTO course_quizzes(id,lesson_id,delivery_id,title,max_attempts,total_points,sequence,status,created_by_user_id) VALUES($1,$2,$3,$4,1,10,0,'PUBLISHED',$5)",[id,A.lesson,B.delivery,`DB06 poison ${id}`,SEED_IDS.collegeAdminUser]);await client.query("ALTER TABLE course_quizzes ENABLE TRIGGER db06_course_quiz_parent_guard");await expect(client.query(preflight)).rejects.toMatchObject({code:"23514"});await client.query("ROLLBACK")}finally{try{await client.query("ROLLBACK")}catch{}client.release()}const persisted=await p().query("SELECT count(*)::integer AS n FROM course_quizzes WHERE id=$1",[id]);expect(persisted.rows[0].n).toBe(0)});
});
