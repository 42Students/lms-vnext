import Link from "next/link";
import {ErrorState} from "@/components/ui/error-state";
/** Unknown, archived or cross-tenant offering details do not expose a framework screen. */
export default function CollegeOfferingNotFound(){
 return <div className="min-w-0">
  <ErrorState title="Course not found"
   description="This course doesn't exist, was removed, or isn't available to your college."
   action={<Link href="/college/courses"
    className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Back to Courses</Link>}/>
 </div>;
}
