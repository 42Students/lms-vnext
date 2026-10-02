import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  cohorts,
  colleges,
  departments,
  organizations,
  programs,
  sections,
} from "@/db/schema";
import { AcademicsServiceError } from "./errors";

export async function loadAcademicCollegeScope(
  collegeId: string,
) {
  const db = getDb();
  const [college] = await db
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
    })
    .from(colleges)
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(colleges.id, collegeId),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!college) {
    throw new AcademicsServiceError(
      "COLLEGE_NOT_FOUND",
    );
  }

  return college;
}

export async function loadAcademicDepartmentScope(
  departmentId: string,
) {
  const db = getDb();
  const [department] = await db
    .select({
      id: departments.id,
      collegeId: departments.collegeId,
      organizationId: colleges.organizationId,
    })
    .from(departments)
    .innerJoin(
      colleges,
      eq(colleges.id, departments.collegeId),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(departments.id, departmentId),
        isNull(departments.archivedAt),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!department) {
    throw new AcademicsServiceError(
      "DEPARTMENT_NOT_FOUND",
    );
  }

  return department;
}

export async function loadProgramScope(
  programId: string,
  includeArchived = false,
) {
  const db = getDb();
  const conditions = [
    eq(programs.id, programId),
    isNull(departments.archivedAt),
    eq(colleges.status, "ACTIVE"),
    eq(organizations.status, "ACTIVE"),
  ];

  if (!includeArchived) {
    conditions.push(eq(programs.status, "ACTIVE"));
  }

  const [program] = await db
    .select({
      id: programs.id,
      departmentId: programs.departmentId,
      collegeId: departments.collegeId,
      organizationId: colleges.organizationId,
      status: programs.status,
    })
    .from(programs)
    .innerJoin(
      departments,
      eq(departments.id, programs.departmentId),
    )
    .innerJoin(
      colleges,
      eq(colleges.id, departments.collegeId),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(and(...conditions))
    .limit(1);

  if (!program) {
    throw new AcademicsServiceError(
      "PROGRAM_NOT_FOUND",
    );
  }

  return program;
}

export async function loadAcademicPeriodScope(
  academicPeriodId: string,
) {
  const db = getDb();
  const [period] = await db
    .select({
      id: academicPeriods.id,
      collegeId: academicPeriods.collegeId,
      organizationId: colleges.organizationId,
      name: academicPeriods.name,
      code: academicPeriods.code,
      startDate: academicPeriods.startDate,
      endDate: academicPeriods.endDate,
      status: academicPeriods.status,
    })
    .from(academicPeriods)
    .innerJoin(
      colleges,
      eq(colleges.id, academicPeriods.collegeId),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(academicPeriods.id, academicPeriodId),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!period) {
    throw new AcademicsServiceError(
      "ACADEMIC_PERIOD_NOT_FOUND",
    );
  }

  return period;
}

export async function loadCohortScope(
  cohortId: string,
) {
  const db = getDb();
  const [cohort] = await db
    .select({
      id: cohorts.id,
      programId: cohorts.programId,
      collegeId: departments.collegeId,
      organizationId: colleges.organizationId,
      status: cohorts.status,
      startPeriodId: cohorts.startPeriodId,
      expectedEndPeriodId: cohorts.expectedEndPeriodId,
    })
    .from(cohorts)
    .innerJoin(
      programs,
      eq(programs.id, cohorts.programId),
    )
    .innerJoin(
      departments,
      eq(departments.id, programs.departmentId),
    )
    .innerJoin(
      colleges,
      eq(colleges.id, departments.collegeId),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(cohorts.id, cohortId),
        eq(programs.status, "ACTIVE"),
        isNull(departments.archivedAt),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!cohort) {
    throw new AcademicsServiceError(
      "COHORT_NOT_FOUND",
    );
  }

  return cohort;
}

export async function loadSectionScope(
  sectionId: string,
) {
  const db = getDb();
  const [section] = await db
    .select({
      id: sections.id,
      cohortId: sections.cohortId,
      academicPeriodId: sections.academicPeriodId,
      collegeId: departments.collegeId,
      organizationId: colleges.organizationId,
      status: sections.status,
    })
    .from(sections)
    .innerJoin(
      cohorts,
      eq(cohorts.id, sections.cohortId),
    )
    .innerJoin(
      programs,
      eq(programs.id, cohorts.programId),
    )
    .innerJoin(
      departments,
      eq(departments.id, programs.departmentId),
    )
    .innerJoin(
      colleges,
      eq(colleges.id, departments.collegeId),
    )
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(sections.id, sectionId),
        eq(programs.status, "ACTIVE"),
        isNull(departments.archivedAt),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!section) {
    throw new AcademicsServiceError(
      "SECTION_NOT_FOUND",
    );
  }

  return section;
}
