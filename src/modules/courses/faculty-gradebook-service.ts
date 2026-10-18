import "server-only";
import {can} from "@/modules/permissions/policy";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {getFacultyDeliveryRoster} from "@/modules/attendance/faculty-service";
import {getFacultyAssessmentOverview} from "./faculty-assessment-service";
import {getFacultyAssignmentReport,getFacultyQuizReport} from "./faculty-assessment-report-service";
import {CoursesServiceError} from "./errors";
import {mapFacultyGradebookReportBatch} from "./faculty-gradebook-report-batch";
import {AuthorizationError} from "@/modules/permissions/policy";
import {facultyGradebookParamsSchema,facultyPublishedGradeRows,
  facultyPublishedLearnerBreakdown,
  type GradebookScore,type FacultyGradebookAssessment} from "./faculty-gradebook-model";
import {z} from "zod";

/**
 * Published gradebook: exact current Section roster, only scores made visible
 * by persisted publication controls. Incomplete grading never becomes zero.
 */
async function loadFacultyPublishedGradebook(context:RequestContext,raw:unknown){
  const query=facultyGradebookParamsSchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY")||
    !can(context,"courses.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new AuthorizationError("courses.read");
  const {delivery,roster}=await getFacultyDeliveryRoster(context,query.deliveryId);
  const overview=await getFacultyAssessmentOverview(context);
  const assignments=overview.assignments.filter(row=>
    row.deliveryId===query.deliveryId&&row.status==="PUBLISHED");
  const quizzes=overview.quizzes.filter(row=>
    row.deliveryId===query.deliveryId&&
    (row.status==="PUBLISHED"||row.status==="CLOSED"));
  if(assignments.length+quizzes.length>100)throw new CoursesServiceError(
    "FACULTY_GRADEBOOK_TOO_MANY_ASSESSMENTS",
  );
  const scores:GradebookScore[]=[];
  const assessments:FacultyGradebookAssessment[]=[];
  let publishedAssessments=0;
  const assignmentReports=await mapFacultyGradebookReportBatch(assignments,
    async item=>({item,report:await getFacultyAssignmentReport(context,item.id,query.deliveryId)}));
  for(const {item,report} of assignmentReports){
    // A partially published assignment contributes a score only for learners
    // whose own grade is actually published; others remain unknown.
    publishedAssessments++;
    assessments.push({kind:"ASSIGNMENT",assessmentId:item.id,title:item.title});
    for(const submission of report.submissions){
      if(submission.gradePublished&&submission.gradingStatus==="GRADED"&&
        submission.pointsAwarded!==null&&Number.isFinite(submission.pointsAwarded)&&
        submission.pointsAwarded>=0&&submission.pointsAwarded<=item.maxPoints&&item.maxPoints>0)
        scores.push({membershipId:submission.membershipId,
          earned:submission.pointsAwarded,possible:item.maxPoints,
          kind:"ASSIGNMENT",assessmentId:item.id});
    }
  }
  const quizReports=await mapFacultyGradebookReportBatch(quizzes,
    async item=>({item,report:await getFacultyQuizReport(context,item.id,query.deliveryId)}));
  for(const {item,report} of quizReports){
    // No quiz score is exported while the results publication flag is off.
    if(!report.quiz.resultsPublished)continue;
    publishedAssessments++;
    assessments.push({kind:"QUIZ",assessmentId:item.id,title:item.title});
    for(const attempt of report.latestAttempts){
      if(Number.isFinite(attempt.score)&&Number.isFinite(attempt.maxScore)&&
        attempt.maxScore>0&&attempt.score>=0&&attempt.score<=attempt.maxScore)
        scores.push({membershipId:attempt.membershipId,
          earned:attempt.score,possible:attempt.maxScore,
          kind:"QUIZ",assessmentId:item.id});
    }
  }
  const rows=facultyPublishedGradeRows(roster,scores,publishedAssessments);
  return {delivery,rows,publishedAssessments,rosterSize:roster.length,
    assessments,scores};
}

/** The aggregate never returns private grade rows or raw score details to a client. */
export async function getFacultyPublishedGradebook(context:RequestContext,raw:unknown){
  const data=await loadFacultyPublishedGradebook(context,raw);
  return {delivery:data.delivery,rows:data.rows,
    publishedAssessments:data.publishedAssessments,rosterSize:data.rosterSize};
}
const learnerParamsSchema=facultyGradebookParamsSchema.extend({
  learnerMembershipId:z.string().uuid(),
}).strict();
/** Exact live teaching Section AND current enrolled roster required. */
export async function getFacultyPublishedGradebookLearner(
  context:RequestContext,raw:unknown,
) {
  const query=learnerParamsSchema.parse(raw);
  const source=await loadFacultyPublishedGradebook(context,{
    deliveryId:query.deliveryId,
  });
  const learner=source.rows.find(row=>row.membershipId===query.learnerMembershipId);
  if(!learner)throw new CoursesServiceError("MEMBERSHIP_NOT_FOUND");
  return {
    delivery:source.delivery,
    learner,
    assessments:facultyPublishedLearnerBreakdown(query.learnerMembershipId,
      source.assessments,source.scores),
  };
}
