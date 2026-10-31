import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
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
import { submitAssignmentWithFiles } from "@/modules/courses/assignment-submission-file-service";
import { submitCourseAssignment } from "@/modules/courses/assignment-submission-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

// Companion to the required staged DB053 receipt test; NOT a replacement.
// This covers the separately registered DB016/0080 storage file producer and
// one-shot learner submission. The new receipt table still needs reconciliation.
const databaseUrl=process.env.TEST_DATABASE_URL;
const enabled=Boolean(databaseUrl) &&
  databaseUrl===process.env.DATABASE_URL &&
  process.env.DB018_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:databaseUrl!,max:4}):null;
const tag=randomUUID().replaceAll("-","").slice(0,10);
const userId=randomUUID(), memberId=randomUUID(), fileId=randomUUID(), secondFileId=randomUUID();
const objectKey="private/"+SEED_IDS.collegeA+"/"+memberId+"/assignment-submission/"+fileId;
const secondObjectKey="private/"+SEED_IDS.collegeA+"/"+memberId+"/assignment-submission/"+secondFileId;
const sha256="c".repeat(64), tokenHash="d".repeat(64);
const admin:RequestContext={
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const learner:RequestContext={
  user:{id:userId,identityUid:"db18-live-file-"+userId,platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:memberId,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
    status:"ACTIVE",roles:["LEARNER"]},
};
let assignmentId="", deliveryId="";
function pg():Pool{
  if(!pool)throw new Error("Requires matching disposable registered PostgreSQL17");
  return pool;
}

beforeAll(async()=>{
  if(!enabled)return;
  const catalog=await pg().query<{files:string|null; oldCol:boolean; newCol:boolean}>(
    "select to_regclass('public.assignment_submission_files')::text as files, "+
    "exists(select 1 from information_schema.columns where table_schema='public' "+
    "and table_name='assignment_submission_files' and column_name='submission_id') as \"oldCol\", "+
    "exists(select 1 from information_schema.columns where table_schema='public' "+
    "and table_name='assignment_submission_files' and column_name='assignment_submission_id') as \"newCol\"",
  );
  expect(catalog.rows[0]?.files).toBe("assignment_submission_files");
  expect(catalog.rows[0]?.oldCol).toBe(true);
  // The separate candidate's conflicting relation MUST NOT be silently
  // treated as registered. This test runs only against today's live schema.
  expect(catalog.rows[0]?.newCol).toBe(false);
  await pg().query(
    "insert into users(id,identity_uid,display_name,email,platform_status) "+
    "values($1,$2,'DB18 registered file learner',$3,'ACTIVE')",
    [userId,learner.user.identityUid,"db18-file-"+userId+"@example.test"],
  );
  await pg().query(
    "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
    [memberId,userId,SEED_IDS.collegeA],
  );
  await pg().query("insert into membership_roles(membership_id,role) values($1,'LEARNER')",[memberId]);
  const program=await createProgram(admin,{
    departmentId:SEED_IDS.departmentA,name:"DB18 LIVE program "+tag,code:"R13-LP-"+tag,durationTerms:8,
  });
  const period=await createAcademicPeriod(admin,{
    collegeId:SEED_IDS.collegeA,name:"DB18 LIVE period "+tag,code:"R13-LT-"+tag,
    startDate:"2026-07-01",endDate:"2027-12-31",
  });
  const cohort=await createCohort(admin,{
    programId:program.id,name:"DB18 LIVE cohort "+tag,code:"R13-LC-"+tag,startPeriodId:period.id,
  });
  const section=await createSection(admin,{
    cohortId:cohort.id,academicPeriodId:period.id,name:"DB18 LIVE section "+tag,
    code:"R13-LS-"+tag,capacity:10,
  });
  const course=await createCourse(admin,{
    departmentId:SEED_IDS.departmentA,name:"DB18 LIVE course "+tag,code:"R13-LD-"+tag,
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
  const path=await createLearningPath(admin,{offeringId:offering.id,title:"DB18 LIVE path"});
  const lesson=await createCourseLesson(admin,{
    learningPathId:path.id,name:"DB18 LIVE lesson",sequence:0,
  });
  await transitionLearningPath(admin,path.id,{action:"PUBLISH"});
  const assignment=await createCourseAssignment(admin,{
    lessonId:lesson.id,title:"DB18 registered FILE one-shot",
    allowedMethods:["PDF_UPLOAD"],
    dueAt:"2027-12-01T12:00:00.000Z",maxPoints:10,sequence:0,
  });
  await transitionCourseAssignment(admin,assignment.id,{action:"PUBLISH"});
  assignmentId=assignment.id;
  deliveryId=delivery.id;

  // READY/CLEAN is a privileged scanner fixture in an isolated test DB.
  // Actual upload scanning remains a separate production provider concern.
  await pg().query(
    "insert into assignment_submission_files "+
    "(id,college_id,assignment_id,delivery_id,owner_membership_id,object_key,"+
    "upload_token_hash,upload_expires_at,original_name,declared_content_type,"+
    "declared_size_bytes,status,object_generation,verified_content_type,"+
    "verified_size_bytes,sha256_hex,scan_status,scan_attested_by,scan_attested_at,"+
    "completed_at,created_by_user_id) "+
    "values($1,$2,$3,$4,$5,$6,$7,now()+interval '10 minutes','race.pdf',"+
    "'application/pdf',128,'READY','1720000000000','application/pdf',128,$8,"+
    "'CLEAN','lms-vnext-privileged-scanner',now(),now(),$9)",
    [fileId,SEED_IDS.collegeA,assignmentId,deliveryId,memberId,
      objectKey,tokenHash,sha256,userId],
  );
  // A second independently attested CLEAN file lets the race exercise
  // opposite client order without weakening the single-submission invariant.
  await pg().query(
    "insert into assignment_submission_files "+
    "(id,college_id,assignment_id,delivery_id,owner_membership_id,object_key,"+
    "upload_token_hash,upload_expires_at,original_name,declared_content_type,"+
    "declared_size_bytes,status,object_generation,verified_content_type,"+
    "verified_size_bytes,sha256_hex,scan_status,scan_attested_by,scan_attested_at,"+
    "completed_at,created_by_user_id) "+
    "values($1,$2,$3,$4,$5,$6,$7,now()+interval '10 minutes','race-second.pdf',"+
    "'application/pdf',128,'READY','1720000000000','application/pdf',128,$8,"+
    "'CLEAN','lms-vnext-privileged-scanner',now(),now(),$9)",
    [secondFileId,SEED_IDS.collegeA,assignmentId,deliveryId,memberId,
      secondObjectKey,tokenHash,sha256,userId],
  );
},30_000);

afterAll(async()=>{
  if(!pool)return;
  // The test database is discarded after the registered PostgreSQL workflow.
  // Keep append-only storage and activity events intact rather than editing
  // evidence tables during cleanup; identities are random per invocation.
  await pool.end();
  await closeDatabaseConnection();
});

describe.skipIf(!enabled)("DB018 registered one-shot private file producer",()=>{
  it("P5-R13 registered modern and legacy FILE paths share one atomic one-shot writer",async()=>{
    expect(assignmentId).toMatch(/^[0-9a-f-]{36}$/);
    const holder=await pg().connect();
    let began=false;
    try{
      await holder.query("BEGIN");
      began=true;
      const forward=[fileId,secondFileId];
      const reversed=[secondFileId,fileId];
      // Both writers must contend on the first canonical lock even when
      // the learner's requested sequence is exactly reversed.
      await holder.query(
        "select id from assignment_submission_files where id=$1 for update",
        [[...forward].sort()[0]],
      );
      const legacy=submitCourseAssignment(learner,assignmentId,{
        deliveryId,submissionType:"FILE",uploadReceiptIds:forward,
      });
      const modern=submitAssignmentWithFiles(learner,assignmentId,{
        deliveryId,fileIds:reversed,
      });
      const pending=[legacy,modern].map(p=>p.then(
        value=>({ok:true as const,value}),
        (error:unknown)=>({ok:false as const,error}),
      ));
      let waiting=0;
      const deadline=Date.now()+15_000;
      while(Date.now()<deadline){
        const result=await pg().query<{count:string}>(
          "select count(*)::text as count from pg_stat_activity "+
          "where datname=current_database() and pid<>pg_backend_pid() "+
          "and wait_event_type='Lock' and query ilike '%assignment_submission_files%'",
        );
        waiting=Number(result.rows[0]?.count??0);
        if(waiting>=2)break;
        await new Promise(resolve=>setTimeout(resolve,25));
      }
      await holder.query("COMMIT");
      began=false;
      const outcomes=await Promise.all(pending);
      expect(waiting,"Both real FILE writers must contend on the registered row").toBeGreaterThanOrEqual(2);
      expect(outcomes.filter(x=>x.ok)).toHaveLength(1);
      expect(outcomes.filter(x=>!x.ok)).toHaveLength(1);
      expect(outcomes.find(x=>!x.ok))
        .toMatchObject({ok:false,error:{code:"STORAGE_FILE_NOT_READY"}});
      const winnerOrder=outcomes[0]?.ok?forward:reversed;
      if(outcomes[0]?.ok) {
        // Legacy response preserves the old FILE summary shape, while the
        // same DB016 transaction persists both ordered scoped file links.
        expect(outcomes[0].value).toMatchObject({
          id:expect.any(String),
          files:[
            {originalName:"race.pdf",mimeType:"application/pdf",sizeBytes:128},
            {originalName:"race-second.pdf",mimeType:"application/pdf",sizeBytes:128},
          ],
        });
      }
      const submissions=await pg().query<{id:string}>(
        "select id from assignment_submissions where assignment_id=$1 and membership_id=$2",
        [assignmentId,memberId],
      );
      expect(submissions.rows).toHaveLength(1);
      const files=await pg().query<{id:string;submission_id:string;sequence:number;
          status:string;scan_status:string;scan_attested_by:string}>(
        "select id,submission_id,sequence,status,scan_status,scan_attested_by "+
        "from assignment_submission_files where id in ($1,$2) order by sequence",
        [fileId,secondFileId],
      );
      expect(files.rows).toEqual(winnerOrder.map((id,sequence)=>({
        id,submission_id:submissions.rows[0]!.id,sequence,
        status:"READY",scan_status:"CLEAN",
        scan_attested_by:"lms-vnext-privileged-scanner",
      })));
      const filesForSubmission=await pg().query<{id:string}>(
        "select id from assignment_submission_files where submission_id=$1",
        [submissions.rows[0]!.id],
      );
      expect(filesForSubmission.rows).toHaveLength(2);
      const events=await pg().query<{id:string}>(
        "select id from activity_events where dedupe_key=$1",
        ["assignment-submission:"+submissions.rows[0]!.id+":submitted"],
      );
      expect(events.rows).toHaveLength(1);
      const storageAudit=await pg().query<{id:string}>(
        "select id from storage_file_events where subject_id in ($1,$2) and event_type='SUBMITTED'",
        [fileId,secondFileId],
      );
      expect(storageAudit.rows).toHaveLength(2);
    }finally{
      if(began)await holder.query("ROLLBACK").catch(()=>undefined);
      holder.release();
    }
  },40_000);
});
