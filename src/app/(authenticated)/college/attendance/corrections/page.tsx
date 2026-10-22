import { DateInput } from "@/components/ui/date-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {DataTable} from "@/components/ui/data-table";
import {ErrorState} from "@/components/ui/error-state";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {StatusBadge} from "@/components/ui/status-badge";
import { Disclosure } from "@/components/ui/disclosure";
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
  if(!query.success) return <div className="min-w-0 space-y-4">
    <PageHeader title="Attendance correction windows"/>
    <ErrorState title="Invalid date range"
      description="Enter both valid IST calendar dates, up to 31 days, without duplicate or unrelated filters."
      action={<Link href="/college/attendance/corrections" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Reset filters</Link>}/>
  </div>;
  const data=await getCollegeCorrectionRead(await getCurrentRequestContext(),query.data);
  return <div className="min-w-0 overflow-x-clip space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
    <PageHeader title="Attendance correction windows"
      description={"Persisted scheduled sessions and the current college policy for "+data.collegeName+"."}
      actions={<Link href="/college/attendance/settings" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-4 text-[14px] font-[650] leading-5 text-[var(--lms-body-text)] transition-colors duration-150 md:min-h-9 hover:border-[var(--lms-button-primary)] hover:bg-[var(--lms-button-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Policy settings</Link>}/>
    <form method="get" className="grid min-w-0 gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-2 [&>button]:w-full sm:[&>button]:col-span-2 sm:[&>button]:w-auto sm:[&>button]:justify-self-end">
      <label className="grid min-w-0 w-full flex-1 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:min-w-40">From (IST)
        <DateInput mode="date" name="from" required defaultValue={data.query.from??""}
          className="min-h-11 md:min-h-9"/>
      </label>
      <label className="grid min-w-0 w-full flex-1 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:min-w-40">To (IST)
        <DateInput mode="date" name="to" required defaultValue={data.query.to??""}
          className="min-h-11 md:min-h-9"/>
      </label>
      <Button variant="primary" type="submit" className="min-h-11 md:min-h-9">View sessions</Button>
    </form>
    {!data.queried?<Alert tone="info">Select an IST date range to inspect recorded sessions and their faculty marking windows.</Alert>:<section className="space-y-3">
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
    <section className="min-w-0">
      <Disclosure title="Policy evidence" className="border-t border-[var(--lms-canvas-border)]" contentClassName="min-w-0 pb-[var(--lms-space-3)]">
      <dl className="mt-3 grid min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)] text-[14px] leading-5 md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="min-w-0 px-4 py-3"><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Eligibility threshold</dt><dd className="mt-2 font-semibold tabular-nums text-[var(--lms-heading)]">{data.policy.eligibilityThresholdPercent}%</dd></div>
        <div className="min-w-0 px-4 py-3"><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty correction window</dt><dd className="mt-2 text-[var(--lms-body-text)]">{data.policy.correctionWindowHours} hours after class end</dd></div>
        <div className="min-w-0 px-4 py-3"><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Policy source</dt><dd className="mt-2 break-words text-[var(--lms-body-text)]">{data.policySource==="SAVED"?"Saved college policy":"System defaults (no saved college row)"}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground leading-5">
        This window describes faculty marking eligibility. College Admin correction permissions have separate rules.
        No separate correction-request table is registered; request history and request totals are unavailable.
      </p>
      </Disclosure>
    </section>
  </div>;
}
