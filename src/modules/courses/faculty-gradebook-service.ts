import "server-only";
import {can} from "@/modules/permissions/policy";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {getFacultyDeliveryRoster} from "@/modules/attendance/faculty-service";
import {getFacultyAssessmentOverview} from "./faculty-assessment-service";
import {getFacultyAssignmentReport,getFacultyQuizReport} from "./faculty-assessment-report-service";
import {CoursesServiceError} from "./errors";
import {facultyGradebookParamsSchema,facultyPublishedGradeRows,
  type GradebookScore} from "./faculty-gradebook-model";

/**
 * Published gradebook: exact current Section roster, only scores made visible
 * by persisted publication controls. Incomplete grading never becomes zero.
 */
export async function getFacultyPublishedGradebook(context:RequestContext,raw:unknown){
  const query=facultyGradebookParamsSchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY")||
    !can(context,"courses.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  const {delivery,roster}=await getFacultyDeliveryRoster(context,query.deliveryId);
  const overview=await getFacultyAssessmentOverview(context);
  const assignments=overview.assignments.filter(row=>
    row.deliveryId===query.deliveryId&&row.status==="PUBLISHED");
  const quizzes=overview.quizzes.filter(row=>
    row.deliveryId===query.deliveryId&&row.status==="PUBLISHED");
  if(assignments.length+quizzes.length>100)throw new Error(
    "GRADEBOOK_TOO_MANY_PUBLISHED_ASSESSMENTS",
  );
  const scores:GradebookScore[]=[];
  let publishedAssessments=0;
  for(const item of assignments){
    const report=await getFacultyAssignmentReport(context,item.id,query.deliveryId);
    // A partially published assignment contributes a score only for learners
    // whose own grade is actually published; others remain unknown.
    publishedAssessments++;
    for(const submission of report.submissions){
      if(submission.gradePublished&&submission.gradingStatus==="GRADED"&&
        submission.pointsAwarded!==null&&item.maxPoints>0)
        scores.push({membershipId:submission.membershipId,
          earned:submission.pointsAwarded,possible:item.maxPoints,
          kind:"ASSIGNMENT",assessmentId:item.id});
    }
  }
  for(const item of quizzes){
    const report=await getFacultyQuizReport(context,item.id,query.deliveryId);
    // No quiz score is exported while the results publication flag is off.
    if(!report.quiz.resultsPublished)continue;
    publishedAssessments++;
    for(const attempt of report.latestAttempts){
      if(attempt.maxScore>0&&attempt.score>=0&&attempt.score<=attempt.maxScore)
        scores.push({membershipId:attempt.membershipId,
          earned:attempt.score,possible:attempt.maxScore,
          kind:"QUIZ",assessmentId:item.id});
    }
  }
  const rows=facultyPublishedGradeRows(roster,scores,publishedAssessments);
  return {delivery,rows,publishedAssessments,rosterSize:roster.length};
}
