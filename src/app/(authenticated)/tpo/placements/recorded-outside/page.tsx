import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {RecordedOutsideForm} from "@/components/placements/recorded-outside-form";
import {recordedOutsideChoices,listTpoRecordedOutsideDrives,verifyRecordedOutsideConfirmation} from "@/modules/placements/recorded-outside-service";
export default async function TpoRecordedOutsidePage({searchParams}:{searchParams:Promise<{saved?:string}>}){
 const context=await getCurrentRequestContext();
 if(
  !context.membership ||
  !hasMembershipRole(context,"TPO")
 ){
  redirect("/dashboard");
 }
 const collegeId=context.membership.collegeId;
 const [result,history]=await Promise.all([recordedOutsideChoices(context,collegeId),listTpoRecordedOutsideDrives(context,collegeId)]);
 const savedId=(await searchParams).saved;
 const saved=savedId?await verifyRecordedOutsideConfirmation(context,collegeId,savedId):false;
 return <main className="space-y-5">
  <PageHeader eyebrow="TPO · Drive creation" title="Record an outside-platform drive"
   description="Document a drive that already happened outside LMS without publishing any job or learners."/>
  <Link href="/tpo/placements/new" className="inline-flex min-h-11 items-center text-primary-text">Back to platform drive creation</Link>
  {saved?<p role="status" className="rounded-md border border-border p-3 text-sm text-body">
   External drive record saved. It was not published as a job.
  </p>:null}
  <RecordedOutsideForm collegeId={collegeId} choices={result.choices}/>
  <section aria-label="Previously recorded outside-platform drives" className="rounded-xl border border-border bg-surface p-4">
   <h2 className="font-semibold">Recorded outside · history</h2>
   <p className="mt-1 text-sm text-body">These are historical records, not live jobs. They never accept in-app applications, results, offers or reminders.</p>
   {!history.rows.length?<p role="status" className="mt-3 text-sm text-body">No outside-platform drives recorded for this college.</p>:
    <ul className="mt-3 space-y-3">{history.rows.map(record=><li key={record.id} className="rounded-md border border-border p-3">
      <p className="font-semibold">{record.title} · {record.companyName}</p>
      <p className="text-sm text-body">Recorded: happened outside · {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(record.occurredAt)} IST</p>
      {record.externalReferenceUrl&&/^https:\/\/[^/]+/i.test(record.externalReferenceUrl)?<a href={record.externalReferenceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-text underline">Open external reference</a>:null}
      {record.notes?<p className="mt-1 whitespace-pre-wrap text-sm text-body">Staff note: {record.notes}</p>:null}
    </li>)}</ul>}
   {history.truncated?<p role="status" className="mt-3 text-sm text-warning-text">Showing the 100 most recent outside-platform drives. Older records remain stored.</p>:null}
  </section>
 </main>;
}
