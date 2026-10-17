import Link from "next/link";
export default function LearnerCourseNotFound(){
 return <section role="alert" className="space-y-3 rounded-xl border border-border bg-surface p-6">
  <h1 className="text-xl font-semibold">Course unavailable</h1>
  <p className="text-sm text-body">This course may not exist or you may not have access. Please try again or return to your courses.</p>
  <Link href="/learn/courses" className="inline-flex min-h-10 items-center rounded border border-border px-4 py-2 text-sm font-semibold text-primary-text">Back to Courses</Link>
 </section>;
}
