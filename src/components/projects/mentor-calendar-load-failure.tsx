"use client";

import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";

/** MEN-projects-meetings-69: keep the calendar screen available if its list fails. */
export function MentorCalendarLoadFailure(){
  const router=useRouter();
  return <Banner tone="error" action={<Button type="button" variant="secondary"
    onClick={()=>router.refresh()}>Retry</Button>}>
    We couldn&apos;t load your meetings.
  </Banner>;
}
