import Link from "next/link";
import {ErrorState} from "@/components/ui/error-state";
export default function DriveNotFound(){
 return <ErrorState title="This drive doesn't exist"
  description="This drive may have been removed or is not accessible for this college."
  action={<Link href="/tpo/placements/jobs" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Go to Drives</Link>}/>;
}
