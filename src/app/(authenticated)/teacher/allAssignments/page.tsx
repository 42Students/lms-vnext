import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import { getCurrentRequestContext } from "@/auth/request-context";
import {RetainedFacultyAssignments} from "@/components/courses/faculty-assignments-retention";
import { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";

export default async function FacultyAllAssignmentsPage() {
  const context = await getCurrentRequestContext();
  const overview = await getFacultyAssessmentOverview(context);
  return (
    <div className="min-w-0 max-w-full space-y-4">
      <RetainedFacultyAssignments filesEnabled={assignmentFilesRuntimeEnabled()} overview={overview}/>
    </div>
  );
}
