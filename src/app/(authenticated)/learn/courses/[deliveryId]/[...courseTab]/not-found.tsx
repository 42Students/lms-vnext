import Link from "next/link";
export default function LearnerCourseNotFound(){
 return <section role="alert" className="space-y-3 py-6">
  <h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Course unavailable</h1>
  <p className="text-sm text-body">This course may not exist or you may not have access. Please try again or return to your courses.</p>
  <Link href="/learn/courses" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">Back to Courses</Link>
 </section>;
}
