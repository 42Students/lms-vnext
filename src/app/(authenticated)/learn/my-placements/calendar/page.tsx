import {Suspense} from "react";
import {readLearnerCalendarUrl} from "@/modules/placements/learner-career-calendar-url-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCareerCalendar } from "@/components/placements/learner-career-calendar";
import { initialCareerCalendarDay } from "@/modules/placements/learner-career-calendar-model";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";

export default async function LearnerCareerCalendarPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const context = await getCurrentRequestContext();
  const workspace = await getLearnerPlacementRequestWorkspace(context);
  const query=await searchParams;
  const params=new URLSearchParams();
  for(const key of ["date","view","kind"]) {
    const value=query[key];
    if(typeof value==="string")params.set(key,value);
  }
  const today=initialCareerCalendarDay();
  const initial=readLearnerCalendarUrl(params.toString(),today);
  return <div className="min-w-0 space-y-6"><PageHeader title="Career Calendar" description="Your upcoming assessments, interviews and other scheduled placement rounds." /><Suspense fallback={<p role="status" className="text-sm text-body">Loading calendar filters…</p>}><LearnerCareerCalendar
    initialAnchor={initial.date}
    todayAnchor={today}
    rounds={workspace.rounds.map((row) => ({
      ...row,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      exception: row.exception
        ? {
            scheduledAt: row.exception.scheduledAt.toISOString(),
            timezone: row.exception.timezone,
            mode: row.exception.mode,
            venue: row.exception.venue,
            meetingUrl: row.exception.meetingUrl,
          }
        : null,
    }))}
  /></Suspense></div>;
}