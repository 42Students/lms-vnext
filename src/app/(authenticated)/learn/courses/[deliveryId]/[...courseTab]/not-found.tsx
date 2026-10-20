import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
export default function LearnerCourseNotFound(){
 return <section className="min-w-0 space-y-3 py-4">
  <PageHeader title="Course unavailable" />
  <Alert tone="warning">This course may not exist or you may not have access. Please try again or return to your courses.</Alert>
  <Link href="/learn/courses" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary-text md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Back to Courses</Link>
 </section>;
}
