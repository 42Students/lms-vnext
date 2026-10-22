import "server-only";

import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  organizations, colleges, departments, academicPeriods, programs, cohorts,
  sections, users, collegeMemberships, membershipRoles, courses, courseOfferings,
  courseSectionDeliveries, courseLearningPaths, courseLessons, lessonContents,
  courseAssignments, lectureHalls,
} from "@/db/schema";
import {
  buildE2EFixtureManifest, deterministicE2EFixtureId,
} from "./e2e-fixture-manifest";

/**
 * The reproducible relational base of the test fixture. This is deliberately
 * NOT a route or a replacement for authorization. Its caller must have
 * checked an actual Super Admin session, not merely an E2E identity override.
 *
 * File/video media, placements and projects have their own module-owned
 * writers and are NOT reported as persisted by this function.
 */
export function assertIsolatedE2EWriter(operatorAuthorized: boolean): void {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.APP_ENV !== "test" ||
    process.env.E2E_SEED_ENABLED !== "true" ||
    process.env.E2E_ISOLATED_DATABASE !== "true" ||
    !operatorAuthorized
  ) {
    throw new Error("E2E_SEED_DISABLED");
  }
}

function derivedUuid(namespace: string, label: string) {
  const hex = createHash("sha256")
    .update("vnext-e2e-2026-10-v1:" + namespace + ":" + label)
    .digest("hex");
  return [
    hex.slice(0, 8), hex.slice(8, 12), "4" + hex.slice(13, 16),
    "8" + hex.slice(17, 20), hex.slice(20, 32),
  ].join("-");
}

type E2EPersona = "facultyA" | "facultyB" | "adminA" | "learnerA" | "learnerB";

/**
 * Stable FK order: org -> college -> department -> academic period ->
 * program -> cohort -> section -> person -> membership -> role ->
 * course -> offering -> delivery -> learning path -> lesson -> content.
 *
 * Every INSERT is conflict-safe by its deterministic UUID, then the selected
 * row is checked against its expected tenant. A conflicting natural unique
 * key cannot silently reuse a different college or identity. Everything
 * rolls back together on any failure; rerunning with the same namespace
 * preserves IDs and existing user/session state.
 */
export async function persistIsolatedE2EAcademicGraph(input: {
  namespace: string;
  operatorAuthorized: boolean;
}) {
  assertIsolatedE2EWriter(input.operatorAuthorized);
  const manifest = buildE2EFixtureManifest(input.namespace);
  const ids = manifest.ids;
  const suffix = createHash("sha256").update(manifest.namespace).digest("hex").slice(0, 10);
  const periodA = derivedUuid(manifest.namespace, "academic-period-A");
  const periodB = derivedUuid(manifest.namespace, "academic-period-B");
  const offeringA = derivedUuid(manifest.namespace, "offering-A");
  const offeringB = derivedUuid(manifest.namespace, "offering-B");
  const deliveryA = derivedUuid(manifest.namespace, "delivery-A");
  const deliveryB = derivedUuid(manifest.namespace, "delivery-B");
  const pathA = derivedUuid(manifest.namespace, "learning-path-A");
  const pathB = derivedUuid(manifest.namespace, "learning-path-B");

  return getDb().transaction(async (tx) => {
    let created = 0;
    let reused = 0;
    const accountIds = {} as Record<E2EPersona, string>;

    for (const [key, name] of [
      ["orgColleges", "E2E Colleges " + suffix],
      ["org42Learn", "E2E 42Learn " + suffix],
    ] as const) {
      const id = ids[key];
      const inserted = await tx.insert(organizations)
        .values({ id, name }).onConflictDoNothing()
        .returning({ id: organizations.id });
      const [existing] = await tx.select({ name: organizations.name })
        .from(organizations).where(eq(organizations.id, id)).limit(1);
      if (!existing || existing.name !== name) throw new Error("E2E_ORGANIZATION_COLLISION");
      if (inserted.length) created++; else reused++;
    }

    for (const [key, name, code] of [
      ["collegeA", "E2E College A " + suffix, "E2E-A-" + suffix],
      ["collegeB", "E2E College B " + suffix, "E2E-B-" + suffix],
    ] as const) {
      const id = ids[key];
      const inserted = await tx.insert(colleges).values({
        id, organizationId: ids.orgColleges, name, code,
      }).onConflictDoNothing().returning({ id: colleges.id });
      const [existing] = await tx.select({
        organizationId: colleges.organizationId, name: colleges.name, code: colleges.code,
      }).from(colleges).where(eq(colleges.id, id)).limit(1);
      if (!existing || existing.organizationId !== ids.orgColleges ||
          existing.name !== name || existing.code !== code)
        throw new Error("E2E_COLLEGE_COLLISION");
      if (inserted.length) created++; else reused++;
    }

    for (const [key, collegeId, name] of [
      ["deptA", ids.collegeA, "E2E Computing A " + suffix],
      ["deptB", ids.collegeB, "E2E Computing B " + suffix],
    ] as const) {
      const id = ids[key];
      const inserted = await tx.insert(departments).values({
        id, collegeId, name,
      }).onConflictDoNothing().returning({ id: departments.id });
      const [existing] = await tx.select({
        collegeId: departments.collegeId, name: departments.name,
      }).from(departments).where(eq(departments.id, id)).limit(1);
      if (!existing || existing.collegeId !== collegeId || existing.name !== name)
        throw new Error("E2E_DEPARTMENT_COLLISION");
      if (inserted.length) created++; else reused++;
    }

    for (const [id, collegeId, code] of [
      [periodA, ids.collegeA, "E2E-A-" + suffix],
      [periodB, ids.collegeB, "E2E-B-" + suffix],
    ] as const) {
      const inserted = await tx.insert(academicPeriods).values({
        id, collegeId, code, name: "2026–27", startDate: "2026-07-01",
        endDate: "2027-06-30",
      }).onConflictDoNothing().returning({ id: academicPeriods.id });
      const [existing] = await tx.select({ collegeId: academicPeriods.collegeId })
        .from(academicPeriods).where(eq(academicPeriods.id, id)).limit(1);
      if (existing?.collegeId !== collegeId) throw new Error("E2E_PERIOD_COLLISION");
      if (inserted.length) created++; else reused++;
    }

    for (const [key, departmentId, code] of [
      ["programA", ids.deptA, "E2E-PA-" + suffix],
      ["programB", ids.deptB, "E2E-PB-" + suffix],
    ] as const) {
      const id = ids[key];
      const inserted = await tx.insert(programs).values({
        id, departmentId, code, name: "E2E Engineering " + code,
        durationTerms: 8,
      }).onConflictDoNothing().returning({ id: programs.id });
      const [existing] = await tx.select({ departmentId: programs.departmentId })
        .from(programs).where(eq(programs.id, id)).limit(1);
      if (existing?.departmentId !== departmentId) throw new Error("E2E_PROGRAM_COLLISION");
      if (inserted.length) created++; else reused++;
    }

    for (const [key, programId, startPeriodId, code] of [
      ["batchA", ids.programA, periodA, "E2E-BA-" + suffix],
      ["batchB", ids.programB, periodB, "E2E-BB-" + suffix],
    ] as const) {
      const id = ids[key];
      const inserted = await tx.insert(cohorts).values({
        id, programId, startPeriodId, code, name: "E2E Batch " + code,
      }).onConflictDoNothing().returning({ id: cohorts.id });
      const [existing] = await tx.select({
        programId: cohorts.programId, startPeriodId: cohorts.startPeriodId,
      }).from(cohorts).where(eq(cohorts.id, id)).limit(1);
      if (!existing || existing.programId !== programId ||
          existing.startPeriodId !== startPeriodId)
        throw new Error("E2E_COHORT_COLLISION");
      if (inserted.length) created++; else reused++;
    }

    for (const [key, cohortId, academicPeriodId, code] of [
      ["classA", ids.batchA, periodA, "E2E-CA-" + suffix],
      ["classB", ids.batchB, periodB, "E2E-CB-" + suffix],
    ] as const) {
      const id = ids[key];
      const inserted = await tx.insert(sections).values({
        id, cohortId, academicPeriodId, code, name: "E2E Class " + code,
      }).onConflictDoNothing().returning({ id: sections.id });
      const [existing] = await tx.select({
        cohortId: sections.cohortId, academicPeriodId: sections.academicPeriodId,
      }).from(sections).where(eq(sections.id, id)).limit(1);
      if (!existing || existing.cohortId !== cohortId ||
          existing.academicPeriodId !== academicPeriodId)
        throw new Error("E2E_SECTION_COLLISION");
      if (inserted.length) created++; else reused++;
    }

    const personas = [
      { key: "facultyA", name: "E2E Teacher A", collegeId: ids.collegeA, role: "FACULTY" },
      { key: "facultyB", name: "E2E Teacher B", collegeId: ids.collegeB, role: "FACULTY" },
      { key: "adminA", name: "E2E Admin A", collegeId: ids.collegeA, role: "COLLEGE_ADMIN" },
      { key: "learnerA", name: "E2E Learner A", collegeId: ids.collegeA, role: "LEARNER" },
      { key: "learnerB", name: "E2E Learner B", collegeId: ids.collegeB, role: "LEARNER" },
    ] as const;
    for (const persona of personas) {
      const phone = manifest.testPhones[persona.key];
      const uid = "e2e-person-" + createHash("sha256").update(phone).digest("hex").slice(0, 32);
      const userId = derivedUuid(manifest.namespace, "user-" + persona.key);
      const inserted = await tx.insert(users).values({
        id: userId, identityUid: uid, phoneE164: phone,
        displayName: persona.name,
      }).onConflictDoNothing().returning({ id: users.id });
      const [existing] = await tx.select({
        id: users.id, identityUid: users.identityUid, phoneE164: users.phoneE164,
        displayName: users.displayName,
      }).from(users).where(eq(users.phoneE164, phone)).limit(1);
      if (!existing || existing.identityUid !== uid ||
          existing.displayName !== persona.name)
        throw new Error("E2E_USER_COLLISION");
      accountIds[persona.key] = existing.id;
      if (inserted.length) created++; else reused++;

      const membershipId = ids[persona.key];
      const memberInsert = await tx.insert(collegeMemberships).values({
        id: membershipId, collegeId: persona.collegeId, userId: existing.id,
      }).onConflictDoNothing().returning({ id: collegeMemberships.id });
      const [member] = await tx.select({
        collegeId: collegeMemberships.collegeId, userId: collegeMemberships.userId,
      }).from(collegeMemberships).where(eq(collegeMemberships.id, membershipId)).limit(1);
      if (!member || member.collegeId !== persona.collegeId ||
          member.userId !== existing.id) throw new Error("E2E_MEMBERSHIP_COLLISION");
      if (memberInsert.length) created++; else reused++;

      const role = persona.role;
      const roleId = derivedUuid(manifest.namespace, "membership-role-" + persona.key);
      const roleInsert = await tx.insert(membershipRoles).values({
        id: roleId, membershipId, role,
      }).onConflictDoNothing().returning({ id: membershipRoles.id });
      const [assigned] = await tx.select({
        membershipId: membershipRoles.membershipId, role: membershipRoles.role,
      }).from(membershipRoles).where(eq(membershipRoles.id, roleId)).limit(1);
      if (!assigned || assigned.membershipId !== membershipId ||
          assigned.role !== role) throw new Error("E2E_ROLE_COLLISION");
      if (roleInsert.length) created++; else reused++;
    }

    for (const [key, departmentId, code] of [
      ["courseA", ids.deptA, "E2E-COURSE-A-" + suffix],
      ["courseB", ids.deptB, "E2E-COURSE-B-" + suffix],
    ] as const) {
      const id = ids[key];
      const inserted = await tx.insert(courses).values({
        id, departmentId, name: "E2E Course " + code, code,
        createdByOrganizationId: ids.org42Learn,
      }).onConflictDoNothing().returning({ id: courses.id });
      const [existing] = await tx.select({ departmentId: courses.departmentId })
        .from(courses).where(eq(courses.id, id)).limit(1);
      if (existing?.departmentId !== departmentId) throw new Error("E2E_COURSE_COLLISION");
      if (inserted.length) created++; else reused++;
    }

    for (const [courseId, cohortId, academicPeriodId, offeringId, deliveryId, sectionId, pathId, lessonId, lessonName] of [
      [ids.courseA, ids.batchA, periodA, offeringA, deliveryA, ids.classA, pathA, ids.lessonA, "E2E Lesson A"],
      [ids.courseB, ids.batchB, periodB, offeringB, deliveryB, ids.classB, pathB, ids.lessonB, "E2E Lesson B"],
    ] as const) {
      const insertedOffering = await tx.insert(courseOfferings).values({
        id: offeringId, courseId, cohortId, academicPeriodId,
      }).onConflictDoNothing().returning({ id: courseOfferings.id });
      const [offering] = await tx.select({
        courseId: courseOfferings.courseId, cohortId: courseOfferings.cohortId,
      }).from(courseOfferings).where(eq(courseOfferings.id, offeringId)).limit(1);
      if (!offering || offering.courseId !== courseId || offering.cohortId !== cohortId)
        throw new Error("E2E_OFFERING_COLLISION");
      if (insertedOffering.length) created++; else reused++;

      const insertedDelivery = await tx.insert(courseSectionDeliveries).values({
        id: deliveryId, offeringId, sectionId,
      }).onConflictDoNothing().returning({ id: courseSectionDeliveries.id });
      const [delivery] = await tx.select({
        offeringId: courseSectionDeliveries.offeringId,
        sectionId: courseSectionDeliveries.sectionId,
      }).from(courseSectionDeliveries).where(eq(courseSectionDeliveries.id, deliveryId)).limit(1);
      if (!delivery || delivery.offeringId !== offeringId ||
          delivery.sectionId !== sectionId) throw new Error("E2E_DELIVERY_COLLISION");
      if (insertedDelivery.length) created++; else reused++;

      const insertedPath = await tx.insert(courseLearningPaths).values({
        id: pathId, offeringId, title: "E2E Learning Path " + lessonName,
        status: "PUBLISHED",
      }).onConflictDoNothing().returning({ id: courseLearningPaths.id });
      const [learningPath] = await tx.select({
        offeringId: courseLearningPaths.offeringId,
      }).from(courseLearningPaths).where(eq(courseLearningPaths.id, pathId)).limit(1);
      if (learningPath?.offeringId !== offeringId) throw new Error("E2E_PATH_COLLISION");
      if (insertedPath.length) created++; else reused++;

      const insertedLesson = await tx.insert(courseLessons).values({
        id: lessonId, learningPathId: pathId, name: lessonName, sequence: 0,
      }).onConflictDoNothing().returning({ id: courseLessons.id });
      const [lesson] = await tx.select({
        learningPathId: courseLessons.learningPathId,
      }).from(courseLessons).where(eq(courseLessons.id, lessonId)).limit(1);
      if (lesson?.learningPathId !== pathId) throw new Error("E2E_LESSON_COLLISION");
      if (insertedLesson.length) created++; else reused++;
    }

    for (const [contentId, lessonId, deliveryId, creatorId, title] of [
      [ids.lectureA, ids.lessonA, deliveryA, accountIds.facultyA, "E2E Lecture A"],
      [ids.lectureB, ids.lessonB, deliveryB, accountIds.facultyB, "E2E Lecture B"],
    ] as const) {
      const inserted = await tx.insert(lessonContents).values({
        id: contentId, lessonId, deliveryId, createdByUserId: creatorId,
        title, contentType: "RESOURCE", notes: "E2E lesson notes",
        sequence: 0, status: "PUBLISHED",
      }).onConflictDoNothing().returning({ id: lessonContents.id });
      const [existing] = await tx.select({ lessonId: lessonContents.lessonId })
        .from(lessonContents).where(eq(lessonContents.id, contentId)).limit(1);
      if (existing?.lessonId !== lessonId) throw new Error("E2E_CONTENT_COLLISION");
      if (inserted.length) created++; else reused++;
    }

    const assignmentInsert = await tx.insert(courseAssignments).values({
      id: ids.assignmentA, lessonId: ids.lessonA, deliveryId: deliveryA,
      title: "E2E Assignment A", description: "Submit an example response",
      maxPoints: 100, sequence: 0, createdByUserId: accountIds.facultyA,
      status: "PUBLISHED",
    }).onConflictDoNothing().returning({ id: courseAssignments.id });
    const [assignment] = await tx.select({ lessonId: courseAssignments.lessonId })
      .from(courseAssignments).where(eq(courseAssignments.id, ids.assignmentA)).limit(1);
    if (assignment?.lessonId !== ids.lessonA) throw new Error("E2E_ASSIGNMENT_COLLISION");
    if (assignmentInsert.length) created++; else reused++;

    const hallInsert = await tx.insert(lectureHalls).values({
      id: ids.hallA, collegeId: ids.collegeA, departmentId: ids.deptA,
      name: "E2E Lab " + suffix, capacity: 50, roomType: "LAB",
    }).onConflictDoNothing().returning({ id: lectureHalls.id });
    const [hall] = await tx.select({ collegeId: lectureHalls.collegeId })
      .from(lectureHalls).where(eq(lectureHalls.id, ids.hallA)).limit(1);
    if (hall?.collegeId !== ids.collegeA) throw new Error("E2E_HALL_COLLISION");
    if (hallInsert.length) created++; else reused++;

    return {
      namespace: manifest.namespace, schemaVersion: manifest.schemaVersion,
      ids: {
        ...ids, periodA, periodB, offeringA, offeringB,
        deliveryA, deliveryB, pathA, pathB,
      },
      accountIds, created, reused, persisted: true as const,
      // A full cross-module fixture is NOT considered ready until the
      // dedicated media, attendance, placement and project writers succeed.
      completeGraph: false as const,
      pendingModuleWriters: ["MEDIA", "ATTENDANCE", "PLACEMENTS", "PROJECTS"] as const,
    };
  });
}
