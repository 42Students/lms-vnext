import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {DataTable} from "@/components/ui/data-table";
import {ErrorState} from "@/components/ui/error-state";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {StatusBadge} from "@/components/ui/status-badge";
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
    <PageHeader title="Correction windows"/>
    <ErrorState title="Invalid date range"
      description="Enter both valid IST calendar dates, up to 31 days, without duplicate or unrelated filters."
      action={<Link href="/college/attendance/corrections" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Reset filters</Link>}/>
  </div>;
  const data=await getCollegeCorrectionRead(await getCurrentRequestContext(),query.data);
  return <div className="min-w-0 overflow-x-clip space-y-6">
    <PageHeader title="Attendance correction windows"
      description={"Persisted scheduled sessions and the current college policy for "+data.collegeName+"."}
      actions={<Link href="/college/attendance/settings" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Policy settings</Link>}/>
    <section className="border-t border-border pt-5">
      <h2 className="font-semibold text-foreground">Policy evidence</h2>
      <dl className="mt-3 grid min-w-0 gap-3 text-sm md:grid-cols-3">
        <div><dt>Eligibility threshold</dt><dd>{data.policy.eligibilityThresholdPercent}%</dd></div>
        <div><dt>Faculty correction window</dt><dd>{data.policy.correctionWindowHours} hours after class end</dd></div>
        <div><dt>Policy source</dt><dd>{data.policySource==="SAVED"?"Saved college policy":"System defaults (no saved college row)"}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        This window describes Faculty marking eligibility. College Admin correction permissions have separate rules.
        No separate correction-request table is registered; request history and request totals are unavailable.
      </p>
    </section>
    <form method="get" className="flex min-w-0 flex-wrap items-end gap-3 border-t border-border pt-4">
      <label className="grid min-w-0 w-full flex-1 gap-2 text-sm font-semibold text-body md:min-w-40">From (IST)
        <Input name="from" type="date" required defaultValue={data.query.from??""}
          className="min-h-11 md:min-h-9"/>
      </label>
      <label className="grid min-w-0 w-full flex-1 gap-2 text-sm font-semibold text-body md:min-w-40">To (IST)
        <Input name="to" type="date" required defaultValue={data.query.to??""}
          className="min-h-11 md:min-h-9"/>
      </label>
      <Button variant="primary" type="submit" className="min-h-11 md:min-h-9">View sessions</Button>
    </form>
    {!data.queried?<Alert tone="info">Select an IST date range to inspect recorded sessions and their Faculty marking windows.</Alert>:<section className="space-y-3">
      {data.truncated?<Alert tone="warning">More than 250 sessions match. Results are truncated; narrow the date range.</Alert>:null}
      {data.items.length===0?<EmptyState title="No scheduled sessions" description="No persisted scheduled sessions overlap this date range. This does not mean no attendance corrections occurred."/>:<DataTable rows={data.items} getRowKey={item=>item.id}
        caption="Recorded attendance correction windows"
        columns={[
          {key:"session",header:"Session / class",mobilePriority:"primary",cell:item=>item.title+" · "+item.sectionName},
          {key:"time",header:"Time (IST)",mobilePriority:"secondary",cell:item=>when(item.startsAt)+" – "+when(item.endsAt)},
          {key:"attendance",header:"Attendance",mobilePriority:"secondary",cell:item=><StatusBadge tone={item.attendanceStatus==="MARKED"?"success":"neutral"}>{item.attendanceStatus??"No attendance session row"}</StatusBadge>},
          {key:"window",header:"Faculty window",mobilePriority:"secondary",cell:item=><StatusBadge tone={item.facultyMarkingWindow==="OPEN"?"success":"neutral"}>{item.facultyMarkingWindow.replaceAll("_"," ")}</StatusBadge>},
        ]}
        empty={<EmptyState title="No scheduled sessions" description="No persisted scheduled sessions overlap this date range."/>}/>}
    </section>}
  </div>;
}
