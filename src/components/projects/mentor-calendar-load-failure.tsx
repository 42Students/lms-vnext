"use client";

import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";

/** MEN-projects-meetings-69: keep the calendar screen available if its list fails.
 * Only a known, user-safe project-access failure is rendered as a reason.
 * Internal network/SQL error messages must not be shown verbatim.
 */
export function MentorCalendarLoadFailure({reason}:{reason?:"PROJECT_ACCESS_DENIED"|"UNKNOWN"}){
  const router=useRouter();
  return <div role="alert" aria-live="assertive"
    className="rounded-[var(--lms-control-radius)] border-l-[3px] border-error bg-error-subtle p-4">
    <Banner tone="error" action={<Button type="button" variant="secondary"
      onClick={()=>router.refresh()}>Retry</Button>}>
      {reason==="PROJECT_ACCESS_DENIED"?
        "Your mentor access changed. Choose an active Mentor workspace and retry.":
        "We couldn't load your meetings."}
    </Banner>
  </div>;
}
