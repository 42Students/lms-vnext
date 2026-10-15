import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { hasActiveMembership, hasMembershipRole } from "@/modules/identity/context";
import { can, AuthorizationError } from "@/modules/permissions/policy";
import {
  getFacultyAssignmentReport, getFacultyQuizReport,
} from "./faculty-assessment-report-service";
import {
  facultyReportCsv, facultyReportCsvFilename, capFacultyReportCsvRows,
  type FacultyReportCsvInput, facultyCsvLearnerLabel,
} from "./faculty-report-csv";
import { facultyReportCsvRequestSchema } from "./faculty-report-csv-request";
import { selectFacultyAssignmentSubmissions } from "./faculty-assignment-submissions-model";
import {capFacultyQuizCsvRows,facultyQuizCsvNotice,selectFacultyQuizCsvRows} from "./faculty-quiz-csv-cap";

/** A GET export re-runs the persisted Section authorization; never trust cached UI report props. */
export async function getFacultyReportCsvForDownload(
  context: RequestContext,
  raw: unknown,
) {
  const query = facultyReportCsvRequestSchema.parse(raw);
  const membership = context.membership;
  if (!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context,"FACULTY") ||
      !can(context,"courses.read",{
        collegeId:membership.collegeId,
        organizationId:membership.organizationId,
      })) throw new AuthorizationError("courses.read");

  let input: FacultyReportCsvInput;
  let omittedRows=0;
  if (query.kind === "assignment") {
    const report = await getFacultyAssignmentReport(
      context,query.assessmentId,query.deliveryId,
    );
    const {assignment,submissions,missingLearners} = report;
    const selected=selectFacultyAssignmentSubmissions(
      submissions,query.filter??"ALL",assignment.dueAt,
    );
    input = {
      kind:"assignment",title:assignment.title,sectionName:assignment.sectionName,
      rows:[
        ...selected.map(submission => {
          const scored = submission.gradingStatus === "GRADED" &&
            submission.pointsAwarded !== null && assignment.maxPoints > 0;
          return {
            name:facultyCsvLearnerLabel(submission.learnerDisplayName),
            status:"SUBMITTED" as const,
            score:scored ? submission.pointsAwarded + "/" + assignment.maxPoints : null,
            percent:scored ? Math.round(submission.pointsAwarded! /
              assignment.maxPoints * 100) : null,
            submittedAt:submission.submittedAt.toISOString(),
            note:(assignment.dueAt && submission.submittedAt > assignment.dueAt
              ? "Late" : "On time") +
              (submission.gradePublished ? " · Published grade" : " · Private grade"),
          };
        }),
        ...(query.filter===undefined||query.filter==="ALL" ? missingLearners : [])
          .map(learner => ({
          name:facultyCsvLearnerLabel(learner.displayName),
          status:"NOT_SUBMITTED" as const,
          score:null,percent:null,submittedAt:null,note:"No recorded submission",
        })),
      ],
    };
  } else {
    const report = await getFacultyQuizReport(
      context,query.assessmentId,query.deliveryId,
    );
    const {quiz,latestAttempts,notAttemptedLearners} = report;
    const selected=selectFacultyQuizCsvRows(latestAttempts,notAttemptedLearners,
      query.filter??"ALL");
    const capped=capFacultyQuizCsvRows(selected.attempted,selected.missing);
    omittedRows=capped.omittedRows;
    input = {
      kind:"quiz",title:quiz.title,sectionName:quiz.sectionName,
      rows:[
        ...capped.selectedAttempts.map(attempt => ({
          name:facultyCsvLearnerLabel(attempt.learnerDisplayName),
          status:"ATTEMPTED" as const,
          score:attempt.score + "/" + attempt.maxScore,
          percent:attempt.maxScore > 0 ?
            Math.round(attempt.score / attempt.maxScore * 100) : null,
          submittedAt:attempt.submittedAt.toISOString(),
          note:"Attempt " + attempt.attemptNumber,
        })),
        ...capped.selectedMissing.map(learner => ({
          name:facultyCsvLearnerLabel(learner.displayName),
          status:"NOT_ATTEMPTED" as const,
          score:null,percent:null,submittedAt:null,note:"No recorded attempt",
        })),
      ],
    };
  }
  const bounded=capFacultyReportCsvRows(input.rows);
  omittedRows+=bounded.omittedRows;
  input={...input,rows:bounded.rows};
  const notice=facultyQuizCsvNotice(omittedRows);
  // The notice is seven CSV fields like ordinary rows; numeric, server
  // authored metadata only. It cannot introduce a spreadsheet formula.
  const noteRow=notice?
    '"' + notice.replaceAll('"','""') + '","","","",""\r\n':"";
  return {
    filename:facultyReportCsvFilename(input.kind,input.title,input.sectionName),
    csv:facultyReportCsv(input)+noteRow,
    omittedRows,
  };
}
