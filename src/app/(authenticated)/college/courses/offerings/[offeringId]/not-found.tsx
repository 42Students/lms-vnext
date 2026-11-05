import {ErrorState} from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";
/** Unknown, archived or cross-tenant offering details do not expose a framework screen. */
export default function CollegeOfferingNotFound(){
 return <div className="min-w-0">
  <ErrorState title="Course not found"
   description="This course doesn't exist, was removed, or isn't available to your college."
   action={<TextLink href="/college/courses"
    className="inline-flex min-h-11 items-center md:min-h-9">Back to Courses</TextLink>}/>
 </div>;
}
