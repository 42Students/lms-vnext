import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listCollegeRoleDirectory } from "@/modules/people/college-role-directory-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled =
  Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB09_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });

const profilePool = enabled ? new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}) : null;
const collegeAdmin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "college-directory-admin",
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

const facultyInCollegeB: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "college-directory-foreign",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY"],
  },
};

describe.skipIf(!enabled)("College Admin role directory PostgreSQL tenant/denial checks", () => {
  afterAll(async () => {
    await profilePool?.end();
    await closeDatabaseConnection();
  });

  it("lists only the current college and never merges same-user faculty memberships across colleges", async () => {
    const faculty = await listCollegeRoleDirectory(collegeAdmin, "FACULTY", {});
    const students = await listCollegeRoleDirectory(collegeAdmin, "LEARNER", {});
    expect(faculty.items.map((row) => row.membershipId))
      .toContain(SEED_IDS.facultyCollegeAMembership);
    expect(faculty.items.map((row) => row.membershipId))
      .not.toContain(SEED_IDS.facultyCollegeBMembership);
    expect(students.items.map((row) => row.membershipId))
      .toContain(SEED_IDS.learnerCollegeAMembership);
    expect(students.items.map((row) => row.membershipId))
      .not.toContain(SEED_IDS.facultyCollegeBMembership);
  });

  it("finds roll and registration numbers only inside this college", async () => {
    if (!profilePool) throw Error("Disposable PG required");
    const userId=randomUUID(),memberId=randomUUID(),roleId=randomUUID();
    const uid="directory-roll-"+userId;
    const roll="ROLL"+userId.slice(0,10).toUpperCase();
    try {
      await profilePool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1::uuid,$2::text,$3::text)",[userId,uid,"Roll Fixture"]);
      await profilePool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1::uuid,$2::uuid,$3::uuid)",[memberId,userId,SEED_IDS.collegeA]);
      await profilePool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1::uuid,$2::uuid,'LEARNER')",[roleId,memberId]);
      await profilePool.query("INSERT INTO learner_profiles(membership_id,roll_number,registration_number) VALUES($1::uuid,$2::text,$3::text)",[memberId,roll,"REG"+roll]);
      const own=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{q:roll});
      expect(own.items.map(r=>r.membershipId)).toContain(memberId);
      const faculty=await listCollegeRoleDirectory(collegeAdmin,"FACULTY",{q:roll});
      expect(faculty.items.map(r=>r.membershipId)).not.toContain(memberId);
      await expect(listCollegeRoleDirectory(facultyInCollegeB,"LEARNER",{q:roll})).rejects.toBeInstanceOf(AuthorizationError);
    } finally {
      await profilePool.query("DELETE FROM learner_profiles WHERE membership_id=$1::uuid",[memberId]);
      await profilePool.query("DELETE FROM membership_roles WHERE id=$1::uuid",[roleId]);
      await profilePool.query("DELETE FROM college_memberships WHERE id=$1::uuid",[memberId]);
      await profilePool.query("DELETE FROM users WHERE id=$1::uuid",[userId]);
    }
  });
  it("finds Faculty by registered academic title, employment type and college-owned department",async()=>{
    if (!profilePool) throw Error("Disposable PG required");
    const userId=randomUUID(),memberId=randomUUID(),roleId=randomUUID(),deptId=randomUUID();
    const token="Prof"+userId.slice(0,10);
    try {
      await profilePool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1::uuid,$2::text,$3::text)",[userId,"faculty-search-"+userId,"Metadata Fixture"]);
      await profilePool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1::uuid,$2::uuid,$3::uuid)",[memberId,userId,SEED_IDS.collegeA]);
      await profilePool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1::uuid,$2::uuid,'FACULTY')",[roleId,memberId]);
      await profilePool.query("INSERT INTO departments(id,college_id,name) VALUES($1::uuid,$2::uuid,$3::text)",[deptId,SEED_IDS.collegeA,token+" Dept"]);
      await profilePool.query("INSERT INTO faculty_profiles(membership_id,primary_department_id,academic_title,employment_type) VALUES($1::uuid,$2::uuid,$3::text,$4::text)",[memberId,deptId,token+" Title",token+" Employee"]);
      for(const q of [token+" Title",token+" Dept",token+" Employee"]){
        const own=await listCollegeRoleDirectory(collegeAdmin,"FACULTY",{q});
        expect(own.items.map(r=>r.membershipId)).toContain(memberId);
        await expect(listCollegeRoleDirectory(facultyInCollegeB,"FACULTY",{q})).rejects.toBeInstanceOf(AuthorizationError);
      }
      const learner=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{q:token+" Title"});
      expect(learner.items.map(r=>r.membershipId)).not.toContain(memberId);
    } finally {
      await profilePool.query("DELETE FROM faculty_profiles WHERE membership_id=$1::uuid",[memberId]);
      await profilePool.query("DELETE FROM departments WHERE id=$1::uuid",[deptId]);
      await profilePool.query("DELETE FROM membership_roles WHERE id=$1::uuid",[roleId]);
      await profilePool.query("DELETE FROM college_memberships WHERE id=$1::uuid",[memberId]);
      await profilePool.query("DELETE FROM users WHERE id=$1::uuid",[userId]);
    }
  });
  it("searches registered own-college active program/batch names without returning foreign learners",async()=>{
    if(!profilePool)throw Error("Disposable PG required");
    const rows=await profilePool.query<{name:string}>(
      "SELECT p.name AS name FROM learner_program_enrollments e "+
      "JOIN programs p ON p.id=e.program_id JOIN departments d ON d.id=p.department_id "+
      "WHERE e.membership_id=$1::uuid AND e.status='ACTIVE' AND d.college_id=$2::uuid LIMIT 1",
      [SEED_IDS.learnerCollegeAMembership,SEED_IDS.collegeA]);
    if(rows.rows[0]){
      const results=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{q:rows.rows[0].name});
      expect(results.items.map(row=>row.membershipId)).toContain(SEED_IDS.learnerCollegeAMembership);
    }
    const absent=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{q:"never-program-"+SEED_IDS.collegeB});
    expect(absent.items).toHaveLength(0);
    await expect(listCollegeRoleDirectory(facultyInCollegeB,"LEARNER",{q:"program"}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("rejects a forged admin role on an existing non-admin membership", async () => {
    const forged: RequestContext = {
      ...collegeAdmin,
      membership: {...collegeAdmin.membership!, id:SEED_IDS.facultyCollegeAMembership},
    };
    for (const kind of ["FACULTY","LEARNER"] as const) {
      await expect(listCollegeRoleDirectory(forged,kind,{})).rejects.toBeInstanceOf(AuthorizationError);
    }
  });
  it("denies a non-admin in another college before any directory read", async () => {
    for (const kind of ["FACULTY", "LEARNER"] as const) {
      await expect(listCollegeRoleDirectory(facultyInCollegeB, kind, {}))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });

  it("filters account lifecycle in both role directories without changing tenant scope", async () => {
    for (const kind of ["FACULTY", "LEARNER"] as const) {
      const active = await listCollegeRoleDirectory(collegeAdmin, kind, {accountStatus:"ACTIVE"});
      expect(active.items.every(row => row.userStatus === "ACTIVE")).toBe(true);
      expect(active.items.every(row => row.membershipId !== SEED_IDS.facultyCollegeBMembership)).toBe(true);
      const disabled = await listCollegeRoleDirectory(collegeAdmin, kind, {accountStatus:"DISABLED"});
      expect(disabled.items.every(row => row.userStatus === "DISABLED")).toBe(true);
      await expect(listCollegeRoleDirectory(facultyInCollegeB, kind, {accountStatus:"ACTIVE"}))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });
  it("partitions college learners by persisted active enrollment without mixing foreign memberships", async () => {
    const all = await listCollegeRoleDirectory(collegeAdmin, "LEARNER", {});
    const active = await listCollegeRoleDirectory(collegeAdmin, "LEARNER", {enrollment:"ACTIVE"});
    const none = await listCollegeRoleDirectory(collegeAdmin, "LEARNER", {enrollment:"NONE"});
    expect(active.total + none.total).toBe(all.total);
    expect(active.items.every(row => row.membershipId !== SEED_IDS.facultyCollegeBMembership)).toBe(true);
    await expect(listCollegeRoleDirectory(facultyInCollegeB, "LEARNER", {enrollment:"ACTIVE"}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeRoleDirectory(collegeAdmin, "FACULTY", {enrollment:"NONE"}))
      .rejects.toThrow("FACULTY_ENROLLMENT_FILTER_UNSUPPORTED");
  });
  it("partitions Faculty memberships by persisted active teaching in their own college", async () => {
    const all = await listCollegeRoleDirectory(collegeAdmin, "FACULTY", {});
    const assigned = await listCollegeRoleDirectory(collegeAdmin, "FACULTY", {teaching:"ASSIGNED"});
    const none = await listCollegeRoleDirectory(collegeAdmin, "FACULTY", {teaching:"NONE"});
    expect(assigned.total + none.total).toBe(all.total);
    expect(assigned.items.every(row => row.activeTeachingAssignments > 0)).toBe(true);
    expect(none.items.every(row => row.activeTeachingAssignments === 0)).toBe(true);
    await expect(listCollegeRoleDirectory(facultyInCollegeB, "FACULTY", {teaching:"ASSIGNED"}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeRoleDirectory(collegeAdmin, "LEARNER", {teaching:"ASSIGNED"}))
      .rejects.toThrow("LEARNER_TEACHING_FILTER_UNSUPPORTED");
  });
  it("sorts both role directories at SQL level before pagination with stable membership ID tie breaks",async()=>{
    for(const kind of ["LEARNER","FACULTY"] as const){
      const newest=await listCollegeRoleDirectory(collegeAdmin,kind,{sort:"NEWEST"});
      const oldest=await listCollegeRoleDirectory(collegeAdmin,kind,{sort:"OLDEST"});
      for(const [rows,reverse] of [[newest.items,true],[oldest.items,false]] as const)
        for(let i=1;i<rows.length;i++)
          expect(reverse ? rows[i-1].joinedAt.getTime() >= rows[i].joinedAt.getTime() :
            rows[i-1].joinedAt.getTime() <= rows[i].joinedAt.getTime()).toBe(true);
      expect(newest.items.every(x=>x.membershipId!==SEED_IDS.facultyCollegeBMembership || kind==="FACULTY")).toBe(true);
      await expect(listCollegeRoleDirectory(facultyInCollegeB,kind,{sort:"NEWEST"}))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });
  it("restricts exact Faculty-department selection to the own college and does not apply to Learners",async()=>{
    const directory=await listCollegeRoleDirectory(collegeAdmin,"FACULTY",{});
    for(const dept of directory.departmentOptions.slice(0,2)){
      const filtered=await listCollegeRoleDirectory(collegeAdmin,"FACULTY",{facultyDepartmentId:dept.id});
      expect(filtered.items.every(row=>row.membershipId!==SEED_IDS.facultyCollegeBMembership)).toBe(true);
    }
    const foreignId=SEED_IDS.collegeB;
    const foreignFilter=await listCollegeRoleDirectory(collegeAdmin,"FACULTY",{facultyDepartmentId:foreignId});
    expect(foreignFilter.items).toHaveLength(0);
    await expect(listCollegeRoleDirectory(collegeAdmin,"LEARNER",{facultyDepartmentId:foreignId}))
      .rejects.toThrow("LEARNER_FACULTY_DEPARTMENT_FILTER_UNSUPPORTED");
    await expect(listCollegeRoleDirectory(facultyInCollegeB,"FACULTY",{facultyDepartmentId:foreignId}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("partitions college learners by live class placement before pagination", async () => {
    const all=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{});
    const assigned=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{classPresence:"ASSIGNED"});
    const none=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{classPresence:"NONE"});
    expect(assigned.total+none.total).toBe(all.total);
    expect(assigned.items.every(row=>row.sections.length>0)).toBe(true);
    expect(none.items.every(row=>row.sections.length===0)).toBe(true);
    await expect(listCollegeRoleDirectory(collegeAdmin,"FACULTY",{classPresence:"ASSIGNED"}))
      .rejects.toThrow("FACULTY_CLASS_FILTER_UNSUPPORTED");
    await expect(listCollegeRoleDirectory(facultyInCollegeB,"LEARNER",{classPresence:"NONE"}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("filters registered live teaching by exact role within the college", async () => {
    const any=await listCollegeRoleDirectory(collegeAdmin,"FACULTY",{teaching:"ASSIGNED"});
    const role=await listCollegeRoleDirectory(collegeAdmin,"FACULTY",{teachingRole:"PRIMARY"});
    expect(role.total).toBeLessThanOrEqual(any.total);
    expect(role.items.every(row=>row.membershipId!==SEED_IDS.facultyCollegeBMembership)).toBe(true);
    await expect(listCollegeRoleDirectory(collegeAdmin,"LEARNER",{teachingRole:"PRIMARY"}))
      .rejects.toThrow("LEARNER_TEACHING_ROLE_UNSUPPORTED");
    await expect(listCollegeRoleDirectory(facultyInCollegeB,"FACULTY",{teachingRole:"TA"}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("filters exact current-college learner programs before pagination",async()=>{
    const all=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{});
    for(const program of all.programOptions.slice(0,2)){
      const subset=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{programId:program.id});
      expect(subset.total).toBeLessThanOrEqual(all.total);
    }
    expect((await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{programId:SEED_IDS.collegeB})).total).toBe(0);
    await expect(listCollegeRoleDirectory(collegeAdmin,"FACULTY",{programId:SEED_IDS.collegeB})).rejects.toThrow("FACULTY_PROGRAM_FILTER_UNSUPPORTED");
    await expect(listCollegeRoleDirectory(facultyInCollegeB,"LEARNER",{programId:SEED_IDS.collegeB})).rejects.toBeInstanceOf(AuthorizationError);
  });
  it("filters current Student class placement only from the active own-college section",async()=>{
    const all=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{});
    for(const section of all.sectionOptions.slice(0,2)){
      const subset=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{sectionId:section.id});
      expect(subset.total).toBeLessThanOrEqual(all.total);
    }
    expect((await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{sectionId:SEED_IDS.collegeB})).total).toBe(0);
    await expect(listCollegeRoleDirectory(collegeAdmin,"FACULTY",{sectionId:SEED_IDS.collegeB})).rejects.toThrow("FACULTY_SECTION_FILTER_UNSUPPORTED");
    await expect(listCollegeRoleDirectory(facultyInCollegeB,"LEARNER",{sectionId:SEED_IDS.collegeB})).rejects.toBeInstanceOf(AuthorizationError);
  });
  it("filters active student batch membership under own-college ancestry",async()=>{
    const unfiltered=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{});
    for(const option of unfiltered.cohortOptions.slice(0,3)){
      const result=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{cohortId:option.id});
      expect(result.total).toBeLessThanOrEqual(unfiltered.total);
      expect(result.items.every(person=>person.membershipId!==SEED_IDS.facultyCollegeBMembership)).toBe(true);
    }
    const missing=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{cohortId:SEED_IDS.collegeB});
    expect(missing.total).toBe(0);
    await expect(listCollegeRoleDirectory(collegeAdmin,"FACULTY",{cohortId:SEED_IDS.collegeB}))
      .rejects.toThrow("FACULTY_COHORT_FILTER_UNSUPPORTED");
    await expect(listCollegeRoleDirectory(facultyInCollegeB,"LEARNER",{cohortId:SEED_IDS.collegeB}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("filters own-college Faculty by persisted exact employment type",async()=>{
    const all=await listCollegeRoleDirectory(collegeAdmin,"FACULTY",{});
    for(const employmentType of all.employmentOptions.slice(0,3)){
      const result=await listCollegeRoleDirectory(collegeAdmin,"FACULTY",{employmentType});
      expect(result.total).toBeLessThanOrEqual(all.total);
      expect(result.items.every(row=>row.membershipId!==SEED_IDS.facultyCollegeBMembership)).toBe(true);
    }
    const missing=await listCollegeRoleDirectory(collegeAdmin,"FACULTY",{employmentType:"NO-SUCH-TYPE-987"});
    expect(missing.total).toBe(0);
    await expect(listCollegeRoleDirectory(collegeAdmin,"LEARNER",{employmentType:"VISITING"}))
      .rejects.toThrow("LEARNER_EMPLOYMENT_FILTER_UNSUPPORTED");
    await expect(listCollegeRoleDirectory(facultyInCollegeB,"FACULTY",{employmentType:"VISITING"}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("partitions own-college Learners by recorded roll number before pagination", async () => {
    const all = await listCollegeRoleDirectory(collegeAdmin, "LEARNER", {});
    const present = await listCollegeRoleDirectory(collegeAdmin, "LEARNER", {rollPresence:"PRESENT"});
    const missing = await listCollegeRoleDirectory(collegeAdmin, "LEARNER", {rollPresence:"MISSING"});
    expect(present.total + missing.total).toBe(all.total);
    expect(present.items.every(row => row.membershipId !== SEED_IDS.facultyCollegeBMembership)).toBe(true);
    await expect(listCollegeRoleDirectory(collegeAdmin, "FACULTY", {rollPresence:"MISSING"}))
      .rejects.toThrow("FACULTY_ROLL_FILTER_UNSUPPORTED");
    await expect(listCollegeRoleDirectory(facultyInCollegeB, "LEARNER", {rollPresence:"MISSING"}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("partitions college Learners by registration-number coverage without losing tenant scope", async () => {
    const all=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{});
    const present=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{registrationPresence:"PRESENT"});
    const missing=await listCollegeRoleDirectory(collegeAdmin,"LEARNER",{registrationPresence:"MISSING"});
    expect(present.total+missing.total).toBe(all.total);
    expect(missing.items.every(row=>row.membershipId!==SEED_IDS.facultyCollegeBMembership)).toBe(true);
    await expect(listCollegeRoleDirectory(collegeAdmin,"FACULTY",{registrationPresence:"PRESENT"}))
      .rejects.toThrow("FACULTY_REGISTRATION_FILTER_UNSUPPORTED");
    await expect(listCollegeRoleDirectory(facultyInCollegeB,"LEARNER",{registrationPresence:"MISSING"}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("partitions Faculty academic title coverage without mixing other colleges", async () => {
    const all = await listCollegeRoleDirectory(collegeAdmin, "FACULTY", {});
    const present = await listCollegeRoleDirectory(collegeAdmin, "FACULTY", {titlePresence:"PRESENT"});
    const missing = await listCollegeRoleDirectory(collegeAdmin, "FACULTY", {titlePresence:"MISSING"});
    expect(present.total + missing.total).toBe(all.total);
    expect(present.items.every(person => person.membershipId!==SEED_IDS.facultyCollegeBMembership)).toBe(true);
    await expect(listCollegeRoleDirectory(collegeAdmin, "LEARNER", {titlePresence:"MISSING"}))
      .rejects.toThrow("LEARNER_ACADEMIC_TITLE_FILTER_UNSUPPORTED");
    await expect(listCollegeRoleDirectory(facultyInCollegeB, "FACULTY", {titlePresence:"MISSING"}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("triages missing primary department only for Faculty in the acting college", async () => {
    const all=await listCollegeRoleDirectory(collegeAdmin,"FACULTY",{});
    const assigned=await listCollegeRoleDirectory(collegeAdmin,"FACULTY",{departmentPresence:"ASSIGNED"});
    const missing=await listCollegeRoleDirectory(collegeAdmin,"FACULTY",{departmentPresence:"MISSING"});
    expect(assigned.total+missing.total).toBe(all.total);
    expect(assigned.items.every(row=>row.membershipId!==SEED_IDS.facultyCollegeBMembership)).toBe(true);
    await expect(listCollegeRoleDirectory(collegeAdmin,"LEARNER",{departmentPresence:"ASSIGNED"}))
      .rejects.toThrow("LEARNER_PRIMARY_DEPARTMENT_FILTER_UNSUPPORTED");
    await expect(listCollegeRoleDirectory(facultyInCollegeB,"FACULTY",{departmentPresence:"MISSING"}))
      .rejects.toBeInstanceOf(AuthorizationError);
  });
  it("rejects forged college selection and out-of-bound page filters", async () => {
    for (const kind of ["FACULTY", "LEARNER"] as const) {
      await expect(listCollegeRoleDirectory(collegeAdmin, kind, {
        collegeId: SEED_IDS.collegeB,
      })).rejects.toBeDefined();
      await expect(listCollegeRoleDirectory(collegeAdmin, kind, {
        page: "999999",
      })).rejects.toBeDefined();
    }
  });

  it("returns an honest empty page without fabricated academic associations", async () => {
    const result = await listCollegeRoleDirectory(collegeAdmin, "LEARNER", {
      q: "no-such-student-w42-directory",
    });
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });
});

// Filtered role CSV reuses the same scoped reader, rather than a generic unfiltered people export.
