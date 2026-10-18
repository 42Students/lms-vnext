"use client";

import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

/** MEN-projects-meetings-69: keep the calendar screen available if its list fails. */
export function MentorCalendarLoadFailure(){
  const router=useRouter();
  return <section role="alert" className="rounded-xl border border-border bg-surface p-5">
    <p className="text-sm text-body">We couldn&apos;t load your meetings.</p>
    <Button type="button" variant="secondary" className="mt-3" onClick={()=>router.refresh()}>Retry</Button>
  </section>;
}
