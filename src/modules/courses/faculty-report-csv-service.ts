import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { hasActiveMembership, hasMembershipRole } from "@/modules/identity/context";
import { can, AuthorizationError } from "@/modules/permissions/policy";
import {
  getFacultyAssignmentReport, getFacultyQuizReport,
} from "./faculty-assessment-report-service";
import {
  facultyReportCsv, facultyReportCsvFilename,
  type FacultyReportCsvInput,
} from "./faculty-report-csv";
import { facultyReportCsvRequestSchema } from "./faculty-report-csv-request";

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
  if (query.kind === "assignment") {
    const report = await getFacultyAssignmentReport(
      context,query.assessmentId,query.deliveryId,
    );
    const {assignment,submissions,missingLearners} = report;
    input = {
      kind:"assignment",title:assignment.title,sectionName:assignment.sectionName,
      rows:[
        ...submissions.map(submission => {
          const scored = submission.gradingStatus === "GRADED" &&
            submission.pointsAwarded !== null && assignment.maxPoints > 0;
          return {
            name:submission.learnerDisplayName || submission.learnerEmail || "Learner",
            email:submission.learnerEmail,
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
        ...missingLearners.map(learner => ({
          name:learner.displayName || learner.email || "Learner",
          email:learner.email,
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
    input = {
      kind:"quiz",title:quiz.title,sectionName:quiz.sectionName,
      rows:[
        ...latestAttempts.map(attempt => ({
          name:attempt.learnerDisplayName || attempt.learnerEmail || "Learner",
          email:attempt.learnerEmail,
          status:"ATTEMPTED" as const,
          score:attempt.score + "/" + attempt.maxScore,
          percent:attempt.maxScore > 0 ?
            Math.round(attempt.score / attempt.maxScore * 100) : null,
          submittedAt:attempt.submittedAt.toISOString(),
          note:"Attempt " + attempt.attemptNumber,
        })),
        ...notAttemptedLearners.map(learner => ({
          name:learner.displayName || learner.email || "Learner",
          email:learner.email,
          status:"NOT_ATTEMPTED" as const,
          score:null,percent:null,submittedAt:null,note:"No recorded attempt",
        })),
      ],
    };
  }
  return {
    filename:facultyReportCsvFilename(input.kind,input.title,input.sectionName),
    csv:facultyReportCsv(input),
  };
}
