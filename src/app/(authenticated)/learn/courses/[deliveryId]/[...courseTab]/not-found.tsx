import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
export default function LearnerCourseNotFound(){
 return <section role="alert" className="space-y-3 py-6">
  <PageHeader title="Course unavailable" />
  <p className="text-sm text-body">This course may not exist or you may not have access. Please try again or return to your courses.</p>
  <Link href="/learn/courses" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">Back to Courses</Link>
 </section>;
}
