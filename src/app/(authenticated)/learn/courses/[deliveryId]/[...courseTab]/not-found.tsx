import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";
export default function LearnerCourseNotFound(){
 return <section className="min-w-0 space-y-4">
  <PageHeader title="Course unavailable" />
  <Alert tone="warning">This course may not exist or you may not have access. Please try again or return to your courses.</Alert>
  <ButtonLink variant="secondary" href="/learn/courses" className="w-full sm:w-auto">Back to Courses</ButtonLink>
 </section>;
}
