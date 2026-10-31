import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import * as privateStorage from "@/modules/storage/private-object-storage";
import { createProgram } from "@/modules/academics/program-service";
import { createAcademicPeriod } from "@/modules/academics/period-service";
import { createCohort } from "@/modules/academics/cohort-service";
import { createSection } from "@/modules/academics/section-service";
import { createLearnerProgramEnrollment } from "@/modules/academics/enrollment-service";
import { assignLearnerToSection } from "@/modules/academics/roster-service";
import { createCourse } from "@/modules/courses/course-service";
import { createCourseOffering } from "@/modules/courses/offering-service";
import { createCourseSectionDelivery } from "@/modules/courses/delivery-service";
import { createLearningPath, transitionLearningPath } from "@/modules/courses/learning-path-service";
import { createCourseLesson } from "@/modules/courses/lesson-service";
import { createCourseAssignment, transitionCourseAssignment } from "@/modules/courses/assignment-service";
import { submitCourseAssignment } from "@/modules/courses/assignment-submission-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl=process.env.TEST_DATABASE_URL;
const enabled=Boolean(databaseUrl) &&
    databaseUrl===process.env.DATABASE_URL &&
    process.env.DB018_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
// A required R13 workflow always supplies the exact disposable flags and
// must FAIL on a missing registered receipt catalog. Other source/unit runs
// must not accidentally open an application DB just by importing this file.
const pool=enabled?new Pool({connectionString:databaseUrl!,max:4}):null as unknown as Pool;
const admin:RequestContext={
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const userId=randomUUID(),memberId=randomUUID(),tag=randomUUID().replaceAll("-","").slice(0,8);
const learner:RequestContext={
  user:{id:userId,identityUid:"db18-r13-"+userId,platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:memberId,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};
const objectId=randomUUID();
const objectKey="private/"+SEED_IDS.collegeA+"/"+memberId+"/assignment-submission/"+objectId;
const receiptId=randomUUID();
const sha256="b".repeat(64);
const tokenHash="a".repeat(64);
const generation="1720000000000";
let grantRestore: (()=>void)|null=null;
let fixture:{
  programId:string;periodId:string;cohortId:string;sectionId:string;
  enrollmentId:string;courseId:string;offeringId:string;deliveryId:string;
  pathId:string;lessonId:string;assignmentId:string;
}|null=null;

beforeAll(async()=>{
  if(!enabled)return;
  // R13 is a required registered producer/consumer witness, NOT a staged
  // acceptance exception. Refuse to create misleading fixtures if DB053's
  // receipts table or its FK-compatible file relation is still unregistered.
  const catalog=await pool.query<{
    receipts:string|null;submission_files:string|null;
    files_fk_shape:boolean;
  }>(
    "select to_regclass('public.course_upload_receipts')::text as receipts, "+
    "to_regclass('public.assignment_submission_files')::text as submission_files, "+
    "exists (select 1 from information_schema.columns "+
    "where table_schema='public' and table_name='assignment_submission_files' "+
    "and column_name='assignment_submission_id') as files_fk_shape",
  );
  if(!catalog.rows[0]?.receipts||!catalog.rows[0]?.submission_files||
      !catalog.rows[0]?.files_fk_shape) {
    throw new Error(
      "P5-R13_REGISTERED_RECEIPT_SCHEMA_MISSING: registered PostgreSQL17 "+
      "must include course_upload_receipts and the assignment_submission_files "+
      "assignment_submission_id FK shape. The DB053/DB016 candidate is staged "+
      "and conflicts with the current registered relation; reconcile forward-only "+
      "DDL and producer/read cutover before this acceptance witness can run.",
    );
  }

  // This suite exercises the real DB producer/receipt transaction but fakes
  // ONLY the external R2 HEAD response, using a fixed CLEAN scanner verdict.
  // No real provider, storage credentials, upload or scanner is claimed.
  vi.stubEnv("R2_ACCOUNT_ID","db018-r13-disposable");
  vi.stubEnv("R2_ACCESS_KEY","db018-r13-disposable");
  vi.stubEnv("R2_SECRET_KEY","db018-r13-disposable");
  vi.stubEnv("R2_PRIVATE_BUCKET","db018-r13-disposable");
  const headSpy=vi.spyOn(privateStorage,"readPrivateObjectAttestation")
    .mockImplementation(async(key, expected)=>{
      if (key!==objectKey || expected.collegeId!==SEED_IDS.collegeA ||
          expected.ownerMembershipId!==memberId ||
          expected.uploadTokenHash!==tokenHash) {
        throw new privateStorage.PrivateObjectStorageError("PRIVATE_STORAGE_INVALID_SCOPE");
      }
      return {
        objectKey:key,generation,sizeBytes:128,
        contentType:"application/pdf",sha256Hex:sha256,
        scanStatus:"CLEAN" as const,scanner:"lms-vnext-privileged-scanner",
      };
    });
  grantRestore=()=>headSpy.mockRestore();

  await pool.query(
    "insert into users(id,identity_uid,display_name,email,platform_status) "+
    "values($1,$2,'DB18 R13 Learner',$3,'ACTIVE')",
    [userId,"db18-r13-"+userId,"r13-"+userId+"@example.test"],
  );
  await pool.query(
    "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
    [memberId,userId,SEED_IDS.collegeA],
  );
  await pool.query(
    "insert into membership_roles(membership_id,role) values($1,'LEARNER')",
    [memberId],
  );

  const program=await createProgram(admin,{
    departmentId:SEED_IDS.departmentA,name:"DB18 R13 program "+tag,code:"R13-P-"+tag,durationTerms:8,
  });
  const period=await createAcademicPeriod(admin,{
    collegeId:SEED_IDS.collegeA,name:"DB18 R13 period "+tag,code:"R13-T-"+tag,
    startDate:"2026-07-01",endDate:"2027-12-31",
  });
  const cohort=await createCohort(admin,{
    programId:program.id,name:"DB18 R13 cohort "+tag,code:"R13-C-"+tag,startPeriodId:period.id,
  });
  const section=await createSection(admin,{
    cohortId:cohort.id,academicPeriodId:period.id,name:"DB18 R13 section "+tag,
    code:"R13-S-"+tag,capacity:10,
  });
  const course=await createCourse(admin,{
    departmentId:SEED_IDS.departmentA,name:"DB18 R13 course "+tag,code:"R13-D-"+tag,
  });
  const offering=await createCourseOffering(admin,{
    courseId:course.id,cohortId:cohort.id,academicPeriodId:period.id,
    type:"CORE",credits:4,displayOrder:0,
  });
  const delivery=await createCourseSectionDelivery(admin,{
    offeringId:offering.id,sectionId:section.id,
  });
  const enrollment=await createLearnerProgramEnrollment(admin,{
    membershipId:memberId,programId:program.id,cohortId:cohort.id,
  });
  await assignLearnerToSection(admin,{
    learnerEnrollmentId:enrollment.id,sectionId:section.id,
  });
  const path=await createLearningPath(admin,{offeringId:offering.id,title:"DB18 R13 path"});
  const lesson=await createCourseLesson(admin,{
    learningPathId:path.id,name:"DB18 R13 lesson",sequence:0,
  });
  await transitionLearningPath(admin,path.id,{action:"PUBLISH"});
  const assignment=await createCourseAssignment(admin,{
    lessonId:lesson.id,title:"DB18 R13 FILE receipt contention",
    allowedMethods:["PDF_UPLOAD"],
    dueAt:"2027-12-01T12:00:00.000Z",maxPoints:10,sequence:0,
  });
  await transitionCourseAssignment(admin,assignment.id,{action:"PUBLISH"});
  fixture={
    programId:program.id,periodId:period.id,cohortId:cohort.id,sectionId:section.id,
    enrollmentId:enrollment.id,courseId:course.id,offeringId:offering.id,
    deliveryId:delivery.id,pathId:path.id,lessonId:lesson.id,assignmentId:assignment.id,
  };

  // Construct a SCANNED, exact-scope fixture. The real transactional FILE
  // producer must still acquire FOR UPDATE, re-check and consume it atomically.
  await pool.query(
    "insert into course_upload_receipts "+
    "(id,college_id,owner_membership_id,purpose,assignment_id,delivery_id,object_key,"+
    "upload_token_hash,original_name,declared_content_type,declared_size_bytes,expires_at,"+
    "attested_generation,actual_content_type,actual_size_bytes,sha256_hex,"+
    "scan_status,scan_attested_by,scan_attested_at,retention_until,created_by_user_id) "+
    "values($1,$2,$3,'ASSIGNMENT_SUBMISSION',$4,$5,$6,$7,'race.pdf',"+
    "'application/pdf',128,now()+interval '10 minutes',$8,"+
    "'application/pdf',128,$9,'CLEAN','lms-vnext-privileged-scanner',"+
    "now(),now()+interval '30 days',$10)",
    [receiptId,SEED_IDS.collegeA,memberId,assignment.id,delivery.id,
      objectKey,tokenHash,generation,sha256,userId],
  );
},30_000);

afterAll(async()=>{
  if(!enabled)return;
  grantRestore?.();
  vi.unstubAllEnvs();
  if(fixture){
    const {assignmentId,lessonId,pathId,deliveryId,offeringId,courseId,
      sectionId,cohortId,periodId,programId,enrollmentId}=fixture;
    // Remove only this disposable R13 fixture in FK order; never disable or
    // weaken the registered receipt/storage constraints.
    await pool.query(
      "delete from assignment_submission_files where assignment_submission_id in "+
      "(select id from assignment_submissions where assignment_id=$1)",[assignmentId]);
    await pool.query(
      "update course_upload_receipts set consumed_at=null,consumed_by_submission_id=null "+
      "where assignment_id=$1",[assignmentId]);
    await pool.query("delete from assignment_submissions where assignment_id=$1",[assignmentId]);
    await pool.query("delete from course_upload_receipts where assignment_id=$1",[assignmentId]);
    await pool.query("delete from course_assignments where id=$1",[assignmentId]);
    await pool.query("delete from course_lessons where id=$1",[lessonId]);
    await pool.query("delete from course_learning_paths where id=$1",[pathId]);
    await pool.query("delete from course_section_deliveries where id=$1",[deliveryId]);
    await pool.query("delete from course_offerings where id=$1",[offeringId]);
    await pool.query("delete from courses where id=$1",[courseId]);
    await pool.query("delete from section_enrollments where learner_enrollment_id=$1",[enrollmentId]);
    await pool.query("delete from learner_program_enrollments where id=$1",[enrollmentId]);
    await pool.query("delete from sections where id=$1",[sectionId]);
    await pool.query("delete from cohorts where id=$1",[cohortId]);
    await pool.query("delete from academic_periods where id=$1",[periodId]);
    await pool.query("delete from programs where id=$1",[programId]);
  }
  // Keep immutable activity sender identities as the existing academic
  // fixture suites do; this DB is destroyed after the isolated workflow.
  await pool.end();
  await closeDatabaseConnection();
});

describe.skipIf(!enabled)("DB018 P5-R13 real FILE submission and receipt race",()=>{
  it("P5-R13 allows only one FILE submission and exactly one consumed scanned receipt",async()=>{
    if(!fixture)throw new Error("R13 fixture missing");
    const holder=await pool.connect();
    let began=false;
    try{
      await holder.query("BEGIN");
      began=true;
      await holder.query(
        "select id from course_upload_receipts where id=$1 for update",
        [receiptId],
      );
      const make=()=>submitCourseAssignment(learner,fixture!.assignmentId,{
        deliveryId:fixture!.deliveryId,submissionType:"FILE",uploadReceiptId:receiptId,
      });
      const pending=[make(),make()].map(p=>p.then(
        value=>({ok:true as const,value}),
        (error:unknown)=>({ok:false as const,error}),
      ));
      let waiting=0;
      const deadline=Date.now()+15_000;
      while(Date.now()<deadline){
        const result=await pool.query<{n:string}>(
          "select count(*)::text as n from pg_stat_activity "+
          "where datname=current_database() and pid<>pg_backend_pid() "+
          "and wait_event_type='Lock' and query ilike '%course_upload_receipts%'",
        );
        waiting=Number(result.rows[0]?.n??0);
        if(waiting>=2)break;
        await new Promise(resolve=>setTimeout(resolve,25));
      }
      await holder.query("COMMIT");
      began=false;
      const outcomes=await Promise.all(pending);
      expect(waiting,"Both FILE service writers must block on one real receipt").toBeGreaterThanOrEqual(2);
      expect(outcomes.filter(o=>o.ok)).toHaveLength(1);
      const loser=outcomes.find(o=>!o.ok);
      expect(loser).toMatchObject({
        ok:false,error:{code:"ASSIGNMENT_UPLOAD_RECEIPT_INVALID"},
      });
      const rows=await pool.query<{id:string}>(
        "select id from assignment_submissions where assignment_id=$1 and membership_id=$2",
        [fixture.assignmentId,memberId],
      );
      expect(rows.rows).toHaveLength(1);
      const files=await pool.query<{assignment_submission_id:string;upload_receipt_id:string;object_key:string}>(
        "select assignment_submission_id,upload_receipt_id,object_key from assignment_submission_files "+
        "where upload_receipt_id=$1",[receiptId],
      );
      expect(files.rows).toEqual([{
        assignment_submission_id:rows.rows[0]!.id,upload_receipt_id:receiptId,object_key:objectKey,
      }]);
      const consumed=await pool.query<{consumed_by_submission_id:string;consumed_at:Date}>(
        "select consumed_by_submission_id,consumed_at from course_upload_receipts where id=$1",
        [receiptId],
      );
      expect(consumed.rows).toHaveLength(1);
      expect(consumed.rows[0]!.consumed_by_submission_id).toBe(rows.rows[0]!.id);
      expect(consumed.rows[0]!.consumed_at).toBeInstanceOf(Date);
      const events=await pool.query<{id:string}>(
        "select id from activity_events where dedupe_key=$1",
        ["assignment-submission:"+rows.rows[0]!.id+":submitted"],
      );
      expect(events.rows).toHaveLength(1);
    }finally{
      if(began)await holder.query("ROLLBACK").catch(()=>undefined);
      holder.release();
    }
  },40_000);
});
