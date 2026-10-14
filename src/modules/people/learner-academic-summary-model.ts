export type LearnerAcademicSummaryRecord = {
  displayName: string | null;
  programName: string | null;
  programCode: string | null;
  cohortName: string | null;
  departmentName: string | null;
};

export function buildOwnLearnerAcademicSummary(row: LearnerAcademicSummaryRecord) {
  const title = row.displayName?.trim() || "Name not recorded";
  const enrollment = row.programName
    ? {
        program: row.programName,
        programCode: row.programCode,
        cohort: row.cohortName,
        department: row.departmentName,
      }
    : null;
  return { title, enrollment };
}
