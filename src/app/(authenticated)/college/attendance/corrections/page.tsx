import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {collegeCorrectionReadSchema} from "@/modules/attendance/college-correction-read-model";
import {getCollegeCorrectionRead} from "@/modules/attendance/college-correction-read-service";

type Search=Record<string,string|string[]|undefined>;
function when(value:string) {
  return new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
  }).format(new Date(value));
}

export default async function CollegeCorrectionReadPage({searchParams}:{searchParams:Promise<Search>}) {
  const values=await searchParams;
  const raw=Object.fromEntries(Object.entries(values).filter(([,value])=>value!==undefined));
  const query=collegeCorrectionReadSchema.safeParse(raw);
  if(!query.success) return <div className="space-y-4">
    <PageHeader eyebrow="College Admin · Attendance" title="Correction windows"/>
    <ErrorState title="Invalid date range"
      description="Enter both valid IST calendar dates, up to 31 days, without duplicate or unrelated filters."
      action={<Link href="/college/attendance/corrections" className="font-semibold text-primary-text">Reset filters</Link>}/>
  </div>;
  const data=await getCollegeCorrectionRead(await getCurrentRequestContext(),query.data);
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="College Admin · Attendance" title="Attendance correction windows"
      description={"Persisted scheduled sessions and the current college policy for "+data.collegeName+"."}
      actions={<Link href="/college/attendance/settings" className="text-sm font-semibold text-primary-text">Policy settings</Link>}/>
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">Policy evidence</h2>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div><dt>Eligibility threshold</dt><dd>{data.policy.eligibilityThresholdPercent}%</dd></div>
        <div><dt>Faculty correction window</dt><dd>{data.policy.correctionWindowHours} hours after class end</dd></div>
        <div><dt>Policy source</dt><dd>{data.policySource==="SAVED"?"Saved college policy":"System defaults (no saved college row)"}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        This window describes Faculty marking eligibility. College Admin correction permissions have separate rules.
        No separate correction-request table is registered; request history and request totals are unavailable.
      </p>
    </section>
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-5">
      <label className="grid min-w-40 flex-1 gap-2 text-sm font-semibold text-body">From (IST)
        <input name="from" type="date" required defaultValue={data.query.from??""}
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
      </label>
      <label className="grid min-w-40 flex-1 gap-2 text-sm font-semibold text-body">To (IST)
        <input name="to" type="date" required defaultValue={data.query.to??""}
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
      </label>
      <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">View sessions</button>
    </form>
    {!data.queried?<p className="rounded-xl border border-border bg-surface p-6 text-sm text-body">
      Select an IST date range to inspect recorded sessions and their Faculty marking windows.
    </p>:<section className="space-y-3">
      {data.truncated?<p role="status" className="text-sm text-warning">More than 250 sessions match. Results are truncated; narrow the date range.</p>:null}
      {data.items.length===0?<p className="rounded-xl border border-border bg-surface p-6 text-sm text-body">
        No persisted scheduled sessions overlap this date range. This does not mean no attendance corrections occurred.
      </p>:<div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[45rem] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface"><tr><th className="p-3" scope="col">Session / class</th>
            <th className="p-3" scope="col">Time (IST)</th>
            <th className="p-3" scope="col">Attendance</th>
            <th className="p-3" scope="col">Faculty window</th></tr></thead>
          <tbody>{data.items.map(item=><tr key={item.id} className="border-t border-border">
            <td className="p-3">{item.title} · {item.sectionName}</td>
            <td className="p-3">{when(item.startsAt)} – {when(item.endsAt)}</td>
            <td className="p-3">{item.attendanceStatus??"No attendance session row"}</td>
            <td className="p-3">{item.facultyMarkingWindow.replaceAll("_"," ")}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>}
  </div>;
}
