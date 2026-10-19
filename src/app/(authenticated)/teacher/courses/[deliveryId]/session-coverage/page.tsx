import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {getFacultySessionCoverage} from "@/modules/courses/faculty-session-coverage-service";
export default async function FacultySessionCoveragePage({
  params,
}:{params:Promise<{deliveryId:string}>}){
  const {deliveryId}=await params;
  const data=await getFacultySessionCoverage(await getCurrentRequestContext(),{deliveryId});
  const base="/teacher/courses/"+encodeURIComponent(deliveryId)+"/attendanceDetail";
  return <div className="min-w-0 max-w-full space-y-5">
    <Link href={base} className="inline-flex min-h-9 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">← Attendance</Link>
    <PageHeader title="Attendance session coverage"/>
    <section aria-label="Session state counts" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {([["Scheduled sessions",data.total],["Marked",data.marked],
        ["Ended without marks",data.completedUnmarked],["Upcoming",data.upcoming]] as const)
        .map(([name,value])=><div key={name} className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">{name}</p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
        </div>)}
    </section>
    <section className="space-y-3" aria-label="Persisted session history">
      <h2 className="text-lg font-semibold">Recent scheduled sessions</h2>
      {data.shown.length===0?<EmptyState title="No scheduled sessions"
        description="No persisted class sessions were found for this authorized Section."/>:
        <ol className="grid gap-2">{data.shown.map(row=><li key={row.id}
          className="rounded-xl border border-border bg-surface p-4">
          <p className="font-semibold break-words">{row.title}</p>
          <p className="mt-1 text-sm text-body">{row.label}</p>
          <time dateTime={row.startsAt} className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
              timeZone:"Asia/Kolkata"}).format(new Date(row.startsAt))} IST
          </time>
        </li>)}</ol>}
      {data.omitted>0?<p role="status" className="text-sm text-body">
        Showing latest 40 sessions; {data.omitted} older sessions omitted.
      </p>:null}
    </section>
    <p className="text-xs text-muted-foreground">Snapshot {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(data.nowIso))} IST.
      Unmarked sessions are not counted as absent learner records. The view does
      not calculate learner attendance eligibility or infer missing records.</p>
  </div>;
}
