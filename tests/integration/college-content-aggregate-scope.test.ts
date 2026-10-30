import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listCollegeContentAggregate } from "@/modules/courses/college-content-aggregate-service";
import { updateCollegeContentStudentVisibility } from "@/modules/courses/college-content-visibility-service";
import { CoursesServiceError } from "@/modules/courses/errors";
import {exportCollegeContentMetadata} from "@/modules/courses/college-content-export-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const adminA: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "ca-contents-a",
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
const adminB: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "ca-contents-b",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};
const nonAdmin: RequestContext = {
  ...adminA,
  membership: { ...adminA.membership!, roles: ["LEARNER"] },
};
const ids = {
  period: randomUUID(),
  program: randomUUID(),
  cohort: randomUUID(),
  course: randomUUID(),
  offering: randomUUID(),
  path: randomUUID(),
  lesson: randomUUID(),
  resource: randomUUID(),
  video: randomUUID(),
  youtube: randomUUID(),
  live: randomUUID(),
};
const label = "W-CONTENT-" + ids.period.slice(0, 8);

describe.skipIf(!enabled)("College Admin content aggregates DB scope", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Disposable PostgreSQL required");
    const registered = await pool.query(
      "SELECT to_regclass('public.lesson_contents') AS contents, " +
      "to_regclass('public.course_learning_paths') AS paths",
    );
    if (Object.values(registered.rows[0] ?? {}).some((value) => !value)) {
      throw new Error("Registered course C2 tables required");
    }
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, label, label],
    );
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) " +
      "VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, label, label],
    );
    await pool.query(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, ids.program, label, label, ids.period],
    );
    await pool.query(
      "INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",
      [ids.course, SEED_IDS.departmentA, label, label],
    );
    await pool.query(
      "INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)",
      [ids.offering, ids.course, ids.cohort, ids.period],
    );
    await pool.query(
      "INSERT INTO course_learning_paths(id,offering_id,title) VALUES($1,$2,$3)",
      [ids.path, ids.offering, label],
    );
    await pool.query(
      "INSERT INTO course_lessons(id,learning_path_id,name,sequence) VALUES($1,$2,$3,0)",
      [ids.lesson, ids.path, label],
    );
    await pool.query(
      "INSERT INTO lesson_contents(id,lesson_id,content_type,title,notes,sequence,created_by_user_id,status) " +
      "VALUES($1,$2,'RESOURCE',$3,'test-only private notes',0,$4,'PUBLISHED')",
      [ids.resource, ids.lesson, label, SEED_IDS.collegeAdminUser],
    );
    await pool.query(
      "INSERT INTO lesson_contents(id,lesson_id,content_type,title,storage_key,duration_seconds,sequence,created_by_user_id) " +
      "VALUES($1,$2,'VIDEO',$3,'test-only-private-key',120,1,$4)",
      [ids.video, ids.lesson, label, SEED_IDS.collegeAdminUser],
    );
    await pool.query(
      "INSERT INTO lesson_contents(id,lesson_id,content_type,title,external_url,duration_seconds,sequence,created_by_user_id) " +
      "VALUES($1,$2,'YOUTUBE',$3,'https://www.youtube.com/watch?v=example',70,2,$4)",
      [ids.youtube, ids.lesson, label, SEED_IDS.collegeAdminUser],
    );
    await pool.query(
      "INSERT INTO lesson_contents(id,lesson_id,content_type,title,external_url,starts_at,ends_at,sequence,created_by_user_id,status) " +
      "VALUES($1,$2,'LIVE_CLASS',$3,'https://meet.example.test/private','2026-11-01T05:00:00Z','2026-11-01T06:00:00Z',3,$4,'PUBLISHED')",
      [ids.live,ids.lesson,label,SEED_IDS.collegeAdminUser],
    );
  });

  afterAll(async () => {
    try {
      if (pool) {
        const owned: ReadonlyArray<readonly [string, string]> = [
          ["lesson_contents", ids.live],
          ["lesson_contents", ids.youtube],
          ["lesson_contents", ids.video],
          ["lesson_contents", ids.resource],
          ["course_lessons", ids.lesson],
          ["course_learning_paths", ids.path],
          ["course_offerings", ids.offering],
          ["courses", ids.course],
          ["cohorts", ids.cohort],
          ["programs", ids.program],
          ["academic_periods", ids.period],
        ];
        for (const [table, id] of owned) {
          if(table==="courses") await pool.query("DELETE FROM program_term_courses WHERE course_id=$1",[id]);
          if(table==="programs") await pool.query("DELETE FROM program_terms WHERE program_id=$1",[id]);
          await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        }
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("shows video and resources independently, with no private storage fields", async () => {
    const [videos, resources] = await Promise.all([
      listCollegeContentAggregate(adminA, "VIDEO", { q: label }),
      listCollegeContentAggregate(adminA, "RESOURCE", { q: label }),
    ]);
    const [activeResources,archivedResources]=await Promise.all([
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,offeringStatus:"ACTIVE"}),
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,offeringStatus:"ARCHIVED"}),
    ]);
    expect(activeResources.items.map(row=>row.id)).toContain(ids.resource);
    expect(archivedResources.items).toEqual([]);
    expect((await exportCollegeContentMetadata(adminA,"RESOURCE",{q:label,offeringStatus:"ACTIVE"})).csv)
      .toContain(label);
    const resourceCsv=await exportCollegeContentMetadata(adminA,"RESOURCE",{q:label});
    expect(resourceCsv.csv).toContain(label);
    expect(resourceCsv.csv).not.toContain("test-only private notes");
    expect(resourceCsv.csv).not.toContain("test-only-private-key");
    const foreignResources=await exportCollegeContentMetadata(adminB,"RESOURCE",{q:label});
    expect(foreignResources.csv).not.toContain(label);
    await expect(exportCollegeContentMetadata(nonAdmin,"RESOURCE",{})).rejects.toBeInstanceOf(AuthorizationError);
    const exported=await exportCollegeContentMetadata(adminA,"VIDEO",{q:label});
    expect(exported.csv).toContain(label);
    expect(exported.csv).not.toContain("test-only-private-key");
    expect(exported.csv).not.toContain("youtube.com/watch");
    const foreignCsv=await exportCollegeContentMetadata(adminB,"VIDEO",{q:label});
    expect(foreignCsv.csv).not.toContain(label);
    await expect(exportCollegeContentMetadata(nonAdmin,"VIDEO",{})).rejects.toBeInstanceOf(AuthorizationError);
    expect(videos.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([ids.video, ids.youtube]),
    );
    expect(resources.items.map((item) => item.id)).toContain(ids.resource);
    const [shared,sectionOnly]=await Promise.all([
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,scope:"SHARED"}),
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,scope:"SECTION"}),
    ]);
    expect(shared.items.map(row=>row.id)).toContain(ids.resource);
    expect(sectionOnly.items).toEqual([]);
    const [scopedResource, absentCourse] = await Promise.all([
      listCollegeContentAggregate(adminA, "RESOURCE", { q: label, courseCode: label }),
      listCollegeContentAggregate(adminA, "RESOURCE", { q: label, courseCode: "UNKNOWN-COURSE" }),
    ]);
    expect(scopedResource.items.map((item) => item.id)).toContain(ids.resource);
    expect(absentCourse.items).toEqual([]);
    const [liveLesson,archivedLesson]=await Promise.all([
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,lessonStatus:"ACTIVE"}),
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,lessonStatus:"ARCHIVED"}),
    ]);
    expect(liveLesson.items.map(row=>row.id)).toContain(ids.resource);
    expect(archivedLesson.items).toEqual([]);
    const [coreContent,electiveContent]=await Promise.all([
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,offeringType:"CORE"}),
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,offeringType:"ELECTIVE"}),
    ]);
    expect(coreContent.items.map(row=>row.id)).toContain(ids.resource);
    expect(electiveContent.items).toEqual([]);
    const dep=await pool!.query<{name:string}>("SELECT name FROM departments WHERE id=$1",[SEED_IDS.departmentA]);
    const [sameDepartment,wrongDepartment]=await Promise.all([
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,departmentName:dep.rows[0]!.name}),
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,departmentName:"NO-SUCH-DEPARTMENT"}),
    ]);
    expect(sameDepartment.items.map(row=>row.id)).toContain(ids.resource);
    expect(wrongDepartment.items).toEqual([]);
    const [draftPath, publishedPath]=await Promise.all([
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,pathStatus:"DRAFT"}),
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,pathStatus:"PUBLISHED"}),
    ]);
    expect(draftPath.items.map(row=>row.id)).toContain(ids.resource);
    expect(publishedPath.items).toEqual([]);
    const [matchingPeriod,absentPeriod]=await Promise.all([
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,periodCode:label}),
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,periodCode:"NO-SUCH-PERIOD"}),
    ]);
    expect(matchingPeriod.items.map(item=>item.id)).toContain(ids.resource);
    expect(absentPeriod.items).toEqual([]);
    expect((await exportCollegeContentMetadata(adminA,"RESOURCE",{q:label,periodCode:"NO-SUCH-PERIOD"})).csv).not.toContain(label);
    const [sameBatch,missingBatch]=await Promise.all([
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,cohortCode:label}),
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,cohortCode:"not-this-batch"}),
    ]);
    expect(sameBatch.items.map(item=>item.id)).toContain(ids.resource);
    expect(missingBatch.items).toEqual([]);
    expect((await exportCollegeContentMetadata(adminA,"RESOURCE",{q:label,cohortCode:"not-this-batch"})).csv).not.toContain(label);
    const [storedOnly, youtubeOnly] = await Promise.all([
      listCollegeContentAggregate(adminA, "VIDEO", { q: label, format: "VIDEO" }),
      listCollegeContentAggregate(adminA, "VIDEO", { q: label, format: "YOUTUBE" }),
    ]);
    expect(storedOnly.items.map((item) => item.id)).toContain(ids.video);
    expect(storedOnly.items.map((item) => item.id)).not.toContain(ids.youtube);
    expect(youtubeOnly.items.map((item) => item.id)).toContain(ids.youtube);
    expect(youtubeOnly.items.map((item) => item.id)).not.toContain(ids.video);
    expect(videos.items.find((item) => item.id === ids.video)).toMatchObject({
      title: label, lessonName: label, learningPathTitle: label,
      deliveryId: null,
      courseName: label, cohortName: label, periodName: label, offeringId: ids.offering,
    });
    expect(resources.items.find((item) => item.id === ids.resource)).toMatchObject({
      title: label, courseName: label, offeringId: ids.offering,
    });
    expect(videos.items.some((item) => item.id === ids.resource)).toBe(false);
    expect(resources.items.some((item) => item.id === ids.video)).toBe(false);
    const serialized = JSON.stringify({ videos, resources });
    expect(serialized).not.toContain("test-only-private-key");
    expect(serialized).not.toContain("test-only private notes");
    expect(serialized).not.toContain("youtube.com/watch");
  });

  it("shows owned live-class schedule without private meeting URLs",async()=>{
    const [mine,theirs]=await Promise.all([
      listCollegeContentAggregate(adminA,"LIVE_CLASS",{q:label}),
      listCollegeContentAggregate(adminB,"LIVE_CLASS",{q:label}),
    ]);
    expect(mine.items.find(r=>r.id===ids.live)).toMatchObject({
      title:label,courseName:label,offeringId:ids.offering,status:"PUBLISHED",
    });
    expect(mine.items.find(r=>r.id===ids.live)?.startsAt).toBeInstanceOf(Date);
    const dated=await listCollegeContentAggregate(adminA,"LIVE_CLASS",{q:label,from:"2026-11-01",to:"2026-11-01"});
    const otherDay=await listCollegeContentAggregate(adminA,"LIVE_CLASS",{q:label,from:"2026-11-02",to:"2026-11-02"});
    expect(dated.items.map(r=>r.id)).toContain(ids.live);
    expect(otherDay.items).toEqual([]);
    const exact=await listCollegeContentAggregate(adminA,"LIVE_CLASS",{courseCode:label});
    const unknown=await listCollegeContentAggregate(adminA,"LIVE_CLASS",{courseCode:"NEVER-MATCH"});
    expect(exact.items.map(r=>r.id)).toContain(ids.live);
    expect(unknown.items).toEqual([]);
    const [sharedSessions,sectionSessions]=await Promise.all([
      listCollegeContentAggregate(adminA,"LIVE_CLASS",{q:label,scope:"SHARED"}),
      listCollegeContentAggregate(adminA,"LIVE_CLASS",{q:label,scope:"SECTION"}),
    ]);
    expect(sharedSessions.items.map(row=>row.id)).toContain(ids.live);
    expect(sectionSessions.items).toEqual([]);
    const sectionCsv=await exportCollegeContentMetadata(adminA,"LIVE_CLASS",{q:label,scope:"SECTION"});
    expect(sectionCsv.csv).not.toContain(label);
    const liveCsv=await exportCollegeContentMetadata(adminA,"LIVE_CLASS",{q:label});
    expect(liveCsv.csv).toContain(label);
    expect(liveCsv.csv).toContain("Starts at (UTC)");
    expect(liveCsv.csv).not.toContain("meet.example.test");
    const datedCsv=await exportCollegeContentMetadata(adminA,"LIVE_CLASS",{q:label,from:"2026-11-01",to:"2026-11-01"});
    const wrongDayCsv=await exportCollegeContentMetadata(adminA,"LIVE_CLASS",{q:label,from:"2026-11-02",to:"2026-11-02"});
    expect(datedCsv.csv).toContain(label);
    expect(wrongDayCsv.csv).not.toContain(label);
    const historicalCsv=await exportCollegeContentMetadata(adminA,"LIVE_CLASS",{q:label,view:"PAST"});
    const futureCsv=await exportCollegeContentMetadata(adminA,"LIVE_CLASS",{q:label,view:"UPCOMING"});
    const wasPast = Date.now() >= Date.parse("2026-11-01T06:00:00Z");
    expect(historicalCsv.csv.includes(label)).toBe(wasPast);
    expect(futureCsv.csv.includes(label)).toBe(!wasPast);
    const foreignLiveCsv=await exportCollegeContentMetadata(adminB,"LIVE_CLASS",{q:label});
    expect(foreignLiveCsv.csv).not.toContain(label);
    await expect(exportCollegeContentMetadata(nonAdmin,"LIVE_CLASS",{})).rejects.toBeInstanceOf(AuthorizationError);
    const past=await listCollegeContentAggregate(adminA,"LIVE_CLASS",{q:label,view:"PAST"});
    expect(past.items.some(r=>r.id===ids.live)).toBe(wasPast);
    const upcoming=await listCollegeContentAggregate(adminA,"LIVE_CLASS",{q:label,view:"UPCOMING"});
    expect(upcoming.items.some(r=>r.id===ids.live)).toBe(!wasPast);
    expect(theirs.items).toEqual([]);
    expect(JSON.stringify(mine)).not.toContain("meet.example.test");
    await expect(listCollegeContentAggregate(nonAdmin,"LIVE_CLASS",{}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeContentAggregate(adminA,"LIVE_CLASS",{collegeId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
  });
  it("commits administrator-only visibility decisions, auditing and rejecting stale or foreign writes",async()=>{
    const row=await pool!.query<{updated_at:Date}>(
      "select updated_at from lesson_contents where id=$1",[ids.resource]);
    const version=row.rows[0]!.updated_at.toISOString();
    const command={lessonContentId:ids.resource,visibleToStudents:false,
      expectedUpdatedAt:version,confirmed:true};
    await expect(updateCollegeContentStudentVisibility(nonAdmin,command))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(updateCollegeContentStudentVisibility(adminB,command))
      .rejects.toMatchObject({code:"LESSON_CONTENT_NOT_FOUND"});
    const hidden=await updateCollegeContentStudentVisibility(adminA,command);
    expect(hidden.visibleToStudents).toBe(false);
    await expect(updateCollegeContentStudentVisibility(adminA,command))
      .rejects.toBeInstanceOf(CoursesServiceError);
    const [hiddenRows,visibleRows]=await Promise.all([
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,visibility:"HIDDEN"}),
      listCollegeContentAggregate(adminA,"RESOURCE",{q:label,visibility:"VISIBLE"}),
    ]);
    expect(hiddenRows.items.map(r=>r.id)).toContain(ids.resource);
    expect(visibleRows.items.map(r=>r.id)).not.toContain(ids.resource);
    const audit=await pool!.query<{event_type:string}>(
      "select event_type from activity_events where subject_id=$1 and event_type=$2",
      [ids.resource,"courses.lesson_content.visibility_changed"]);
    expect(audit.rows.length).toBeGreaterThan(0);
    const restored=await updateCollegeContentStudentVisibility(adminA,{
      ...command,visibleToStudents:true,expectedUpdatedAt:hidden.updatedAt.toISOString(),
    });
    expect(restored.visibleToStudents).toBe(true);
  });

  it("enforces tenant and role denials for both kinds", async () => {
    for (const kind of ["VIDEO", "RESOURCE"] as const) {
      const other = await listCollegeContentAggregate(adminB, kind, { q: label });
      expect(other.items).toEqual([]);
      await expect(listCollegeContentAggregate(nonAdmin, kind, {}))
        .rejects.toBeInstanceOf(AuthorizationError);
      await expect(listCollegeContentAggregate(adminA, kind, {
        collegeId: SEED_IDS.collegeB,
      })).rejects.toBeDefined();
    }
  });
});
