import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {exportCollegeLessons} from "@/modules/courses/college-lessons-export-service";
import {exportCollegeCourseProgress} from "@/modules/courses/college-progress-export-service";
import {
  listCollegeCourseProgress,
  listCollegeLessons,
} from "@/modules/courses/college-learning-directory-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB09_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const own: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "college-learning-observability",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};
const otherCollege: RequestContext = {
  user: { ...own.user, id: SEED_IDS.facultyUser },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};
const nonAdmin: RequestContext = {
  ...own,
  membership: { ...own.membership!, roles: ["FACULTY"] },
};

const ids = {
  period: randomUUID(),
  program: randomUUID(),
  cohort: randomUUID(),
  course: randomUUID(),
  offering: randomUUID(),
  path: randomUUID(),
  lesson: randomUUID(),
  content: randomUUID(),
};
const name = "W-Learning-" + ids.period.slice(0, 8);

describe.skipIf(!enabled)("College learning directories use disposable PostgreSQL scope", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Isolated PostgreSQL is required");
    const tableState = await pool.query(
      "SELECT to_regclass('public.course_lessons') AS lessons, " +
      "to_regclass('public.lesson_contents') AS content, " +
      "to_regclass('public.learner_content_progress') AS progress",
    );
    for (const value of Object.values(tableState.rows[0] ?? {})) {
      if (!value) throw new Error("Registered course C2/C3 migrations required");
    }
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, name, name],
    );
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, name, name],
    );
    await pool.query(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, ids.program, name, name, ids.period],
    );
    await pool.query(
      "INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",
      [ids.course, SEED_IDS.departmentA, name, name],
    );
    await pool.query(
      "INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)",
      [ids.offering, ids.course, ids.cohort, ids.period],
    );
    await pool.query(
      "INSERT INTO course_learning_paths(id,offering_id,title) VALUES($1,$2,$3)",
      [ids.path, ids.offering, name],
    );
    await pool.query(
      "INSERT INTO course_lessons(id,learning_path_id,name,sequence) VALUES($1,$2,$3,0)",
      [ids.lesson, ids.path, name],
    );
    await pool.query(
      "INSERT INTO lesson_contents(id,lesson_id,content_type,title,external_url,duration_seconds,sequence,created_by_user_id,status) " +
      "VALUES($1,$2,'YOUTUBE',$3,'https://www.youtube.com/watch?v=example',60,0,$4,'PUBLISHED')",
      [ids.content, ids.lesson, name, SEED_IDS.collegeAdminUser],
    );
  });

  afterAll(async () => {
    try {
      if (pool) {
        for (const [table, id] of [
          ["lesson_contents", ids.content],
          ["course_lessons", ids.lesson],
          ["course_learning_paths", ids.path],
          ["course_offerings", ids.offering],
          ["courses", ids.course],
          ["cohorts", ids.cohort],
          ["programs", ids.program],
          ["academic_periods", ids.period],
        ] as const) {
          await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        }
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("shows a persisted lesson and no fabricated completion on the own college", async () => {
    const [lessonPage, progressPage] = await Promise.all([
      listCollegeLessons(own, { q: name }),
      listCollegeCourseProgress(own, { q: name }),
    ]);
    const contentTypeMatches=await listCollegeLessons(own,{q:name,contentType:"YOUTUBE"});
    const contentTypeMisses=await listCollegeLessons(own,{q:name,contentType:"VIDEO"});
    expect(contentTypeMatches.items.map(row=>row.id)).toContain(ids.lesson);
    expect(contentTypeMisses.items).toEqual([]);
    expect((await exportCollegeLessons(own,{q:name,contentType:"VIDEO"})).rows).toEqual([]);
    const contentLifecycleYes=await listCollegeLessons(own,{q:name,contentLifecycle:"PUBLISHED"});
    const contentLifecycleNo=await listCollegeLessons(own,{q:name,contentLifecycle:"DRAFT"});
    expect(contentLifecycleYes.items.map(row=>row.id)).toContain(ids.lesson);
    expect(contentLifecycleNo.items).toEqual([]);
    expect((await exportCollegeLessons(own,{q:name,contentLifecycle:"DRAFT"})).rows).toEqual([]);
    expect((await listCollegeLessons(own,{q:name,sequenceFrom:1})).items.map(row=>row.id)).toContain(ids.lesson);
    expect((await listCollegeLessons(own,{q:name,sequenceFrom:2})).items).toEqual([]);
    expect((await exportCollegeLessons(own,{q:name,sequenceFrom:2})).rows).toEqual([]);
    expect((await listCollegeLessons(own,{q:name,sequenceThrough:1})).items.map(row=>row.id)).toContain(ids.lesson);
    expect((await listCollegeLessons(own,{q:name,sequenceFrom:2,sequenceThrough:2})).items).toEqual([]);
    expect((await exportCollegeLessons(own,{q:name,sequenceFrom:2,sequenceThrough:2})).rows).toEqual([]);
    expect((await listCollegeLessons(own,{lessonName:name})).items.map(row=>row.id)).toContain(ids.lesson);
    expect((await listCollegeLessons(own,{lessonName:"Missing exact title"})).items).toEqual([]);
    expect((await exportCollegeLessons(own,{lessonName:"Missing exact title"})).rows).toEqual([]);
    expect((await listCollegeLessons(own,{q:name,contentAudience:"SHARED"})).items.map(r=>r.id)).toContain(ids.lesson);
    expect((await listCollegeLessons(own,{q:name,contentAudience:"SECTION"})).items).toEqual([]);
    expect((await exportCollegeLessons(own,{q:name,contentAudience:"SECTION"})).rows).toEqual([]);
    expect((await listCollegeLessons(own,{q:name,hiddenPublished:"NO_HIDDEN"})).items.map(r=>r.id)).toContain(ids.lesson);
    expect((await listCollegeLessons(own,{q:name,hiddenPublished:"HAS_HIDDEN"})).items).toEqual([]);
    expect((await exportCollegeLessons(own,{q:name,hiddenPublished:"HAS_HIDDEN"})).rows).toEqual([]);
    expect((await listCollegeLessons(own,{q:name,videoEvidence:"HAS_VIDEO"})).items.map(r=>r.id)).toContain(ids.lesson);
    expect((await listCollegeLessons(own,{q:name,videoEvidence:"NO_VIDEO"})).items).toEqual([]);
    expect((await exportCollegeLessons(own,{q:name,videoEvidence:"NO_VIDEO"})).rows).toEqual([]);
    expect((await listCollegeLessons(own,{q:name,resourceEvidence:"NO_RESOURCE"})).items.map(r=>r.id)).toContain(ids.lesson);
    expect((await listCollegeLessons(own,{q:name,resourceEvidence:"HAS_RESOURCE"})).items).toEqual([]);
    expect((await exportCollegeLessons(own,{q:name,resourceEvidence:"HAS_RESOURCE"})).rows).toEqual([]);
    expect((await listCollegeLessons(own,{q:name,liveEvidence:"NO_LIVE"})).items.map(r=>r.id)).toContain(ids.lesson);
    expect((await listCollegeLessons(own,{q:name,liveEvidence:"HAS_LIVE"})).items).toEqual([]);
    expect((await exportCollegeLessons(own,{q:name,liveEvidence:"HAS_LIVE"})).rows).toEqual([]);
    const exact=await listCollegeLessons(own,{courseCode:name});
    const unknown=await listCollegeLessons(own,{courseCode:"MISSING-CODE"});
    expect(exact.items.map(row=>row.id)).toContain(ids.lesson);
    expect(unknown.items).toEqual([]);
    expect((await listCollegeCourseProgress(own,{q:name,lessonPresence:"HAS_LESSONS"})).items.map(row=>row.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(own,{q:name,lessonPresence:"NO_LESSONS"})).items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{q:name,lessonPresence:"NO_LESSONS"})).rows).toEqual([]);
    expect((await listCollegeCourseProgress(own,{q:name,assignmentPresence:"NO_ASSIGNMENTS"})).items.map(r=>r.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(own,{q:name,assignmentPresence:"HAS_ASSIGNMENTS"})).items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{q:name,assignmentPresence:"HAS_ASSIGNMENTS"})).rows).toEqual([]);
    expect((await listCollegeCourseProgress(own,{q:name,quizPresence:"NO_QUIZZES"})).items.map(r=>r.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(own,{q:name,quizPresence:"HAS_QUIZZES"})).items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{q:name,quizPresence:"HAS_QUIZZES"})).rows).toEqual([]);
    expect((await listCollegeCourseProgress(own,{q:name,resourcePresence:"NO_RESOURCES"})).items.map(r=>r.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(own,{q:name,resourcePresence:"HAS_RESOURCES"})).items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{q:name,resourcePresence:"HAS_RESOURCES"})).rows).toEqual([]);
    expect((await listCollegeCourseProgress(own,{q:name,liveClassPresence:"NO_LIVE"})).items.map(r=>r.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(own,{q:name,liveClassPresence:"HAS_LIVE"})).items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{q:name,liveClassPresence:"HAS_LIVE"})).rows).toEqual([]);
    expect((await listCollegeCourseProgress(own,{q:name,videoContentState:"HAS_VIDEO"})).items.map(r=>r.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(own,{q:name,videoContentState:"NO_VIDEO"})).items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{q:name,videoContentState:"NO_VIDEO"})).rows).toEqual([]);
    expect((await listCollegeCourseProgress(own,{q:name,publishedContentState:"HAS_PUBLISHED"})).items.map(r=>r.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(own,{q:name,publishedContentState:"NO_PUBLISHED"})).items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{q:name,publishedContentState:"NO_PUBLISHED"})).rows).toEqual([]);
    expect((await listCollegeCourseProgress(own,{q:name,hiddenContentState:"NO_HIDDEN"})).items.map(r=>r.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(own,{q:name,hiddenContentState:"HAS_HIDDEN"})).items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{q:name,hiddenContentState:"HAS_HIDDEN"})).rows).toEqual([]);
    expect((await listCollegeCourseProgress(own,{q:name,sharedContentState:"HAS_SHARED"})).items.map(r=>r.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(own,{q:name,sharedContentState:"NO_SHARED"})).items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{q:name,sharedContentState:"NO_SHARED"})).rows).toEqual([]);
    expect((await listCollegeCourseProgress(own,{q:name,sectionContentState:"NO_SECTION"})).items.map(r=>r.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(own,{q:name,sectionContentState:"HAS_SECTION"})).items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{q:name,sectionContentState:"HAS_SECTION"})).rows).toEqual([]);
    const [publishedPath,noPublishedPath]=await Promise.all([
      listCollegeCourseProgress(own,{q:name,publishedPathPresence:"HAS_PUBLISHED_PATH"}),
      listCollegeCourseProgress(own,{q:name,publishedPathPresence:"NO_PUBLISHED_PATH"}),
    ]);
    expect(publishedPath.items).toEqual([]);
    expect(noPublishedPath.items.map(row=>row.offeringId)).toContain(ids.offering);
    const [hasSharedPath,missingSharedPath]=await Promise.all([
      listCollegeCourseProgress(own,{q:name,learningPathPresence:"HAS_PATH"}),
      listCollegeCourseProgress(own,{q:name,learningPathPresence:"NO_PATH"}),
    ]);
    expect(hasSharedPath.items.map(row=>row.offeringId)).toContain(ids.offering);
    expect(missingSharedPath.items).toEqual([]);
    const [hasQuiz,noQuiz]=await Promise.all([
      listCollegeLessons(own,{q:name,quizPresence:"HAS_QUIZZES"}),
      listCollegeLessons(own,{q:name,quizPresence:"NO_QUIZZES"}),
    ]);
    expect(hasQuiz.items).toEqual([]);
    expect(noQuiz.items.map(row=>row.id)).toContain(ids.lesson);
    const [hasAssignment,noAssignment]=await Promise.all([
      listCollegeLessons(own,{q:name,assignmentPresence:"HAS_ASSIGNMENTS"}),
      listCollegeLessons(own,{q:name,assignmentPresence:"NO_ASSIGNMENTS"}),
    ]);
    expect(hasAssignment.items).toEqual([]);
    expect(noAssignment.items.map(row=>row.id)).toContain(ids.lesson);
    const currentVisibility=await pool!.query<{visible:boolean}>("SELECT visible_to_students AS visible FROM lesson_contents WHERE id=$1",[ids.content]);
    const [flagged,notFlagged]=await Promise.all([
      listCollegeLessons(own,{q:name,flaggedVisibility:"HAS_FLAGGED"}),
      listCollegeLessons(own,{q:name,flaggedVisibility:"NONE_FLAGGED"}),
    ]);
    expect(flagged.items.map(row=>row.id).includes(ids.lesson)).toBe(currentVisibility.rows[0]!.visible);
    expect(notFlagged.items.map(row=>row.id).includes(ids.lesson)).toBe(!currentVisibility.rows[0]!.visible);
    const [publishedLessons,unpublishedLessons]=await Promise.all([
      listCollegeLessons(own,{q:name,publishedContent:"HAS_PUBLISHED"}),
      listCollegeLessons(own,{q:name,publishedContent:"NONE_PUBLISHED"}),
    ]);
    expect(publishedLessons.items.map(row=>row.id)).toContain(ids.lesson);
    expect(unpublishedLessons.items).toEqual([]);
    const [hasComplete,noComplete]=await Promise.all([
      listCollegeCourseProgress(own,{q:name,completionEvidence:"COMPLETED_CONTENT"}),
      listCollegeCourseProgress(own,{q:name,completionEvidence:"NO_COMPLETED_CONTENT"}),
    ]);
    expect(hasComplete.items).toEqual([]);
    expect(noComplete.items.map(row=>row.offeringId)).toContain(ids.offering);
    const [noActivity,hasActivity]=await Promise.all([
      listCollegeCourseProgress(own,{q:name,activityState:"UNRECORDED"}),
      listCollegeCourseProgress(own,{q:name,activityState:"RECORDED"}),
    ]);
    expect(noActivity.items.map(row=>row.offeringId)).toContain(ids.offering);
    expect(hasActivity.items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{q:name,activityState:"RECORDED"})).rows.length).toBe(0);
    const depProgress=await pool!.query<{name:string}>("SELECT name FROM departments WHERE id=$1",[SEED_IDS.departmentA]);
    const [matchingDepartment,unrelatedDepartment]=await Promise.all([
      listCollegeCourseProgress(own,{q:name,departmentName:depProgress.rows[0]!.name}),
      listCollegeCourseProgress(own,{q:name,departmentName:"NO-SUCH-DEPT"}),
    ]);
    expect(matchingDepartment.items.map(row=>row.offeringId)).toContain(ids.offering);
    expect(unrelatedDepartment.items).toEqual([]);
    const [core,elec]=await Promise.all([listCollegeCourseProgress(own,{q:name,offeringType:"CORE"}),listCollegeCourseProgress(own,{q:name,offeringType:"ELECTIVE"})]);
    expect(core.items.map(row=>row.offeringId)).toContain(ids.offering);
    expect(elec.items).toEqual([]);
    const [authored,emptyLessons]=await Promise.all([
      listCollegeLessons(own,{q:name,contentPresence:"HAS_CONTENT"}),
      listCollegeLessons(own,{q:name,contentPresence:"EMPTY"}),
    ]);
    expect(authored.items.map(row=>row.id)).toContain(ids.lesson);
    expect(emptyLessons.items).toEqual([]);
    const dep=await pool!.query<{name:string}>("SELECT name FROM departments WHERE id=$1",[SEED_IDS.departmentA]);
    const [departmentLessons,otherDepartment]=await Promise.all([
      listCollegeLessons(own,{q:name,departmentName:dep.rows[0]!.name}),
      listCollegeLessons(own,{q:name,departmentName:"NONEXISTENT-DEPARTMENT"}),
    ]);
    expect(departmentLessons.items.map(row=>row.id)).toContain(ids.lesson);
    expect(otherDepartment.items).toEqual([]);
    const [coreLessons,electiveLessons]=await Promise.all([
      listCollegeLessons(own,{q:name,offeringType:"CORE"}),
      listCollegeLessons(own,{q:name,offeringType:"ELECTIVE"}),
    ]);
    expect(coreLessons.items.map(row=>row.id)).toContain(ids.lesson);
    expect(electiveLessons.items).toEqual([]);
    const [batchLessons,wrongBatchLessons]=await Promise.all([
      listCollegeLessons(own,{cohortCode:name}),
      listCollegeLessons(own,{cohortCode:"never-that-batch"}),
    ]);
    expect(batchLessons.items.map(row=>row.id)).toContain(ids.lesson);
    expect(wrongBatchLessons.items).toEqual([]);
    const [programLesson,wrongProgramLesson]=await Promise.all([
      listCollegeLessons(own,{programCode:name}),
      listCollegeLessons(own,{programCode:"ANOTHER-PROGRAM"}),
    ]);
    expect(programLesson.items.map(row=>row.id)).toContain(ids.lesson);
    expect(wrongProgramLesson.items).toEqual([]);
    expect((await exportCollegeLessons(own,{programCode:name})).csv).toContain(name);
    const [lessonsInPeriod,lessonsOutOfPeriod]=await Promise.all([
      listCollegeLessons(own,{periodCode:name}),
      listCollegeLessons(own,{periodCode:"PERIOD-NOT-FOUND"}),
    ]);
    expect(lessonsInPeriod.items.map(row=>row.id)).toContain(ids.lesson);
    expect(lessonsOutOfPeriod.items).toEqual([]);
    expect((await exportCollegeLessons(own,{periodCode:name})).csv).toContain(name);
    const [draftPathLesson,archivedPathLesson]=await Promise.all([
      listCollegeLessons(own,{q:name,pathStatus:"DRAFT"}),
      listCollegeLessons(own,{q:name,pathStatus:"ARCHIVED"}),
    ]);
    expect(draftPathLesson.items.map(row=>row.id)).toContain(ids.lesson);
    expect(archivedPathLesson.items).toEqual([]);
    expect((await exportCollegeLessons(own,{q:name,pathStatus:"DRAFT"})).csv).toContain(name);
    expect((await listCollegeLessons(own,{lessonId:ids.lesson})).items.map(row=>row.id)).toContain(ids.lesson);
    expect((await listCollegeLessons(own,{lessonId:randomUUID()})).items).toEqual([]);
    expect((await exportCollegeLessons(otherCollege,{lessonId:ids.lesson})).rows).toEqual([]);
    expect((await listCollegeLessons(own,{offeringId:ids.offering})).items.map(row=>row.id)).toContain(ids.lesson);
    expect((await listCollegeLessons(own,{offeringId:randomUUID()})).items).toEqual([]);
    expect((await exportCollegeLessons(otherCollege,{offeringId:ids.offering})).rows).toEqual([]);
    expect((await listCollegeLessons(own,{pathId:ids.path})).items.map(row=>row.id)).toContain(ids.lesson);
    expect((await listCollegeLessons(own,{pathId:randomUUID()})).items).toEqual([]);
    expect((await exportCollegeLessons(otherCollege,{pathId:ids.path})).rows).toEqual([]);
    expect((await listCollegeLessons(own,{q:name,minContentCount:1})).items.map(row=>row.id)).toContain(ids.lesson);
    expect((await listCollegeLessons(own,{q:name,minContentCount:2})).items).toEqual([]);
    expect((await exportCollegeLessons(own,{q:name,minContentCount:2})).rows).toEqual([]);
    expect((await listCollegeLessons(own,{q:name,maxContentCount:1})).items.map(row=>row.id)).toContain(ids.lesson);
    expect((await listCollegeLessons(own,{q:name,maxContentCount:0})).items).toEqual([]);
    expect((await exportCollegeLessons(own,{q:name,maxContentCount:0})).rows).toEqual([]);
    const lesson = lessonPage.items.find(row => row.id === ids.lesson);
    const sameCode=await listCollegeCourseProgress(own,{courseCode:name});
    const missingCode=await listCollegeCourseProgress(own,{courseCode:"NOT-THIS-CODE"});
    expect(sameCode.items.map(row=>row.offeringId)).toContain(ids.offering);
    expect(missingCode.items).toEqual([]);
    const [programMatch,programMiss]=await Promise.all([
      listCollegeCourseProgress(own,{programCode:name}),
      listCollegeCourseProgress(own,{programCode:"PROGRAM-ABSENT"}),
    ]);
    expect(programMatch.items.some(row=>row.offeringId===ids.offering)).toBe(true);
    expect(programMiss.items).toEqual([]);
    const programCsv=await exportCollegeCourseProgress(own,{programCode:name});
    expect(programCsv.csv).toContain(name);
    const [matchingPeriod,absentPeriod]=await Promise.all([
      listCollegeCourseProgress(own,{periodCode:name}),
      listCollegeCourseProgress(own,{periodCode:"OTHER-PERIOD"}),
    ]);
    expect(matchingPeriod.items.some(row=>row.offeringId===ids.offering)).toBe(true);
    expect(absentPeriod.items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{periodCode:name})).csv).toContain(name);
    const [cohortMatch,cohortAbsent]=await Promise.all([
      listCollegeCourseProgress(own,{cohortCode:name}),
      listCollegeCourseProgress(own,{cohortCode:"COHORT-ABSENT"}),
    ]);
    expect(cohortMatch.items.some(row=>row.offeringId===ids.offering)).toBe(true);
    expect(cohortAbsent.items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{cohortCode:name})).csv).toContain(name);
    expect((await listCollegeCourseProgress(own,{offeringId:ids.offering})).items.map(row=>row.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(own,{offeringId:randomUUID()})).items).toEqual([]);
    expect((await exportCollegeCourseProgress(otherCollege,{offeringId:ids.offering})).rows).toEqual([]);
    expect((await listCollegeCourseProgress(own,{q:name,draftContentState:"NO_DRAFT"})).items.map(row=>row.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(own,{q:name,draftContentState:"HAS_DRAFT"})).items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{q:name,draftContentState:"HAS_DRAFT"})).rows).toEqual([]);
    expect((await listCollegeCourseProgress(own,{q:name,archivedContentState:"NO_ARCHIVED"})).items.map(row=>row.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(own,{q:name,archivedContentState:"HAS_ARCHIVED"})).items).toEqual([]);
    expect((await exportCollegeCourseProgress(own,{q:name,archivedContentState:"HAS_ARCHIVED"})).rows).toEqual([]);
    expect((await listCollegeCourseProgress(own,{offeringId:ids.offering,status:"ALL"})).items.map(row=>row.offeringId)).toContain(ids.offering);
    expect((await listCollegeCourseProgress(otherCollege,{offeringId:ids.offering,status:"ALL"})).items).toEqual([]);
    const progress = progressPage.items.find(row => row.offeringId === ids.offering);
    expect(lesson).toMatchObject({ contentCount: 1, publishedContentCount: 1 });
    const [active, archived] = await Promise.all([
      listCollegeLessons(own, { q: name, offeringStatus: "ACTIVE" }),
      listCollegeLessons(own, { q: name, offeringStatus: "ARCHIVED" }),
    ]);
    expect(active.items.map(row => row.id)).toContain(ids.lesson);
    expect(archived.items).toEqual([]);
    expect(progress).toMatchObject({ recordedRows: 0, completedRows: 0, learnersWithRecords: 0 });
  });

  it("exports only own-college authored/published lesson counts",async()=>{
    const ours=await exportCollegeLessons(own,{q:name});
    const theirs=await exportCollegeLessons(otherCollege,{q:name});
    expect(ours.csv).toContain(name);
    expect(ours.csv).toContain("Published content");
    expect(theirs.csv).not.toContain(name);
    await expect(exportCollegeLessons(nonAdmin,{})).rejects.toBeInstanceOf(AuthorizationError);
  });
  it("exports observed progress counts only under the current college",async()=>{
    const ours=await exportCollegeCourseProgress(own,{q:name});
    const theirs=await exportCollegeCourseProgress(otherCollege,{q:name});
    expect(ours.csv).toContain(name);
    expect(ours.csv).toContain("Recorded content rows");
    expect(ours.csv).toContain("0");
    expect(theirs.csv).not.toContain(name);
    await expect(exportCollegeCourseProgress(nonAdmin,{})).rejects.toBeInstanceOf(AuthorizationError);
  });
  it("does not reveal the seeded course or lesson to an admin from another college", async () => {
    const [lessons, progress] = await Promise.all([
      listCollegeLessons(otherCollege, { q: name }),
      listCollegeCourseProgress(otherCollege, { q: name }),
    ]);
    expect(lessons.items).toEqual([]);
    expect(progress.items).toEqual([]);
  });

  it("rejects non-admin membership, caller-chosen college and invalid filters", async () => {
    await expect(listCollegeLessons(nonAdmin, {})).rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeCourseProgress(nonAdmin, {})).rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeLessons(own, { collegeId: SEED_IDS.collegeB })).rejects.toBeDefined();
    await expect(listCollegeCourseProgress(own, { collegeId: SEED_IDS.collegeB })).rejects.toBeDefined();
    await expect(listCollegeCourseProgress(own, { page: 1001 })).rejects.toBeDefined();
  });
  it("lessons programStatus filters persisted same-college parent rows",async()=>{
    const [yes,no,foreign]=await Promise.all([
      listCollegeLessons(own,{q:name,programStatus:"ACTIVE"}),
      listCollegeLessons(own,{q:name,programStatus:"ARCHIVED"}),
      listCollegeLessons(otherCollege,{q:name,programStatus:"ACTIVE"}),
    ]);
    expect(yes.items.map(row=>row.id)).toContain(ids.lesson);
    expect(no.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("lessons cohortStatus filters persisted same-college parent rows",async()=>{
    const [yes,no,foreign]=await Promise.all([
      listCollegeLessons(own,{q:name,cohortStatus:"PLANNED"}),
      listCollegeLessons(own,{q:name,cohortStatus:"COMPLETED"}),
      listCollegeLessons(otherCollege,{q:name,cohortStatus:"PLANNED"}),
    ]);
    expect(yes.items.map(row=>row.id)).toContain(ids.lesson);
    expect(no.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("lessons periodStatus narrows persisted tenant-owned parent rows",async()=>{
    const [yes,no,foreign]=await Promise.all([
      listCollegeLessons(own,{q:name,periodStatus:"PLANNED"}),
      listCollegeLessons(own,{q:name,periodStatus:"CLOSED"}),
      listCollegeLessons(otherCollege,{q:name,periodStatus:"PLANNED"}),
    ]);
    expect(yes.items.map(row=>row.id)).toContain(ids.lesson);
    expect(no.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("lessons courseStatus narrows persisted tenant-owned parent rows",async()=>{
    const [yes,no,foreign]=await Promise.all([
      listCollegeLessons(own,{q:name,courseStatus:"ACTIVE"}),
      listCollegeLessons(own,{q:name,courseStatus:"ARCHIVED"}),
      listCollegeLessons(otherCollege,{q:name,courseStatus:"ACTIVE"}),
    ]);
    expect(yes.items.map(row=>row.id)).toContain(ids.lesson);
    expect(no.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("lessons departmentCode matches only the registered owning course department",async()=>{
    const result=await pool!.query<{code:string}>("SELECT name AS code FROM departments WHERE id=$1",[SEED_IDS.departmentA]);
    const code=result.rows[0]!.code;
    const [yes,no,foreign]=await Promise.all([
      listCollegeLessons(own,{q:name,departmentCode:code}),
      listCollegeLessons(own,{q:name,departmentCode:"NO-EXISTENT-DEPT"}),
      listCollegeLessons(otherCollege,{q:name,departmentCode:code}),
    ]);
    expect(yes.items.map(row=>row.id)).toContain(ids.lesson);
    expect(no.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("course progress programStatus is derived from same-college parent state",async()=>{
    const [yes,no,foreign]=await Promise.all([
      listCollegeCourseProgress(own,{q:name,programStatus:"ACTIVE"}),
      listCollegeCourseProgress(own,{q:name,programStatus:"ARCHIVED"}),
      listCollegeCourseProgress(otherCollege,{q:name,programStatus:"ACTIVE"}),
    ]);
    expect(yes.items.map(row=>row.offeringId)).toContain(ids.offering);
    expect(no.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("course progress cohortStatus is derived from same-college parent state",async()=>{
    const [yes,no,foreign]=await Promise.all([
      listCollegeCourseProgress(own,{q:name,cohortStatus:"PLANNED"}),
      listCollegeCourseProgress(own,{q:name,cohortStatus:"COMPLETED"}),
      listCollegeCourseProgress(otherCollege,{q:name,cohortStatus:"PLANNED"}),
    ]);
    expect(yes.items.map(row=>row.offeringId)).toContain(ids.offering);
    expect(no.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("progress periodStatus filters persisted college-owned offering parents",async()=>{
    const [yes,no,foreign]=await Promise.all([
      listCollegeCourseProgress(own,{q:name,periodStatus:"PLANNED"}),
      listCollegeCourseProgress(own,{q:name,periodStatus:"CLOSED"}),
      listCollegeCourseProgress(otherCollege,{q:name,periodStatus:"PLANNED"}),
    ]);
    expect(yes.items.map(row=>row.offeringId)).toContain(ids.offering);
    expect(no.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("progress courseStatus filters persisted college-owned offering parents",async()=>{
    const [yes,no,foreign]=await Promise.all([
      listCollegeCourseProgress(own,{q:name,courseStatus:"ACTIVE"}),
      listCollegeCourseProgress(own,{q:name,courseStatus:"ARCHIVED"}),
      listCollegeCourseProgress(otherCollege,{q:name,courseStatus:"ACTIVE"}),
    ]);
    expect(yes.items.map(row=>row.offeringId)).toContain(ids.offering);
    expect(no.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

  it("progress departmentCode only matches owning college course department",async()=>{
    const data=await pool!.query<{code:string}>("SELECT name AS code FROM departments WHERE id=$1",[SEED_IDS.departmentA]);
    const code=data.rows[0]!.code;
    const [yes,no,foreign]=await Promise.all([
      listCollegeCourseProgress(own,{q:name,departmentCode:code}),
      listCollegeCourseProgress(own,{q:name,departmentCode:"NONEXISTENT-DEPT"}),
      listCollegeCourseProgress(otherCollege,{q:name,departmentCode:code}),
    ]);
    expect(yes.items.map(row=>row.offeringId)).toContain(ids.offering);
    expect(no.items).toEqual([]);
    expect(foreign.items).toEqual([]);
  });

});
