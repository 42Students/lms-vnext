import { z } from "zod";
import { facultySubmissionContentSchema } from "./faculty-submission-content-model";

export const facultySubmissionReviewRowSchema = facultySubmissionContentSchema.extend({
  assignmentId:z.string().uuid(),deliveryId:z.string().uuid(),membershipId:z.string().uuid(),
  submittedAt:z.iso.datetime({offset:true}),pointsAwarded:z.number().int().min(0).nullable(),
  feedback:z.string().max(10000).nullable(),gradingStatus:z.enum(["NOT_GRADED","GRADED"]),
  gradePublished:z.boolean(),version:z.number().int().min(0),
  learnerDisplayName:z.string().nullable(),learnerEmail:z.string().nullable(),
}).strict();
export type FacultySubmissionReviewRow = z.infer<typeof facultySubmissionReviewRowSchema>;
export const facultySubmissionReviewResponseSchema = z.object({
  page:z.number().int().min(1),pageSize:z.literal(20),total:z.number().int().min(0),
  totalPages:z.number().int().min(1),items:z.array(facultySubmissionReviewRowSchema).max(20),
}).strict().refine(data => data.page <= data.totalPages,"Invalid review page");
export type FacultySubmissionReviewResponse = z.infer<typeof facultySubmissionReviewResponseSchema>;
type PersistedRow = Omit<FacultySubmissionReviewRow,"submittedAt"> & {submittedAt:Date};

/** Only grade-review fields cross the API; DB Dates become ISO strings. */
export function facultySubmissionReviewResponse(data: {
  page:number;pageSize:number;total:number;totalPages:number;items:readonly PersistedRow[];
}) {
  return facultySubmissionReviewResponseSchema.parse({...data,items:data.items.map(row=>({
    id:row.id,assignmentId:row.assignmentId,deliveryId:row.deliveryId,membershipId:row.membershipId,
    submissionType:row.submissionType,textContent:row.textContent,submissionUrl:row.submissionUrl,
    submittedAt:row.submittedAt.toISOString(),pointsAwarded:row.pointsAwarded,feedback:row.feedback,
    gradingStatus:row.gradingStatus,gradePublished:row.gradePublished,version:row.version,
    learnerDisplayName:row.learnerDisplayName,learnerEmail:row.learnerEmail,
  }))});
}
