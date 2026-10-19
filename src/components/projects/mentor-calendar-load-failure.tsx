"use client";

import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

/** MEN-projects-meetings-69: keep the calendar screen available if its list fails. */
export function MentorCalendarLoadFailure(){
  const router=useRouter();
  return <section role="alert" className="border-b border-border pb-4">
    <p className="text-sm text-body">We couldn&apos;t load your meetings.</p>
    <Button type="button" variant="secondary" className="mt-3" onClick={()=>router.refresh()}>Retry</Button>
  </section>;
}
