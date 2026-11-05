import {ErrorState} from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";
export default function DriveNotFound(){
 return <ErrorState title="This drive doesn't exist"
  description="This drive may have been removed or is not accessible for this college."
  action={<TextLink href="/tpo/placements/jobs" className="inline-flex min-h-11 items-center md:min-h-9">Go to Drives</TextLink>}/>;
}
