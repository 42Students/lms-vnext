"use client";

import {useRouter} from "next/navigation";

/** MEN-projects-meetings-69: keep the calendar screen available if its list fails. */
export function MentorCalendarLoadFailure(){
  const router=useRouter();
  return <section role="alert" className="rounded-xl border border-border bg-surface p-5">
    <p className="text-sm text-body">We couldn&apos;t load your meetings.</p>
    <button type="button" onClick={()=>router.refresh()}
      className="mt-3 min-h-10 rounded-lg border border-border px-4 text-sm font-semibold text-primary-text">
      Retry
    </button>
  </section>;
}
