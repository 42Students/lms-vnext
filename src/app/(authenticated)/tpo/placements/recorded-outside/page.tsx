import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {Banner} from "@/components/ui/banner";
import {RecordedOutsideForm} from "@/components/placements/recorded-outside-form";
import {recordedOutsideChoices,verifyRecordedOutsideConfirmation} from "@/modules/placements/recorded-outside-service";
import {listTpoOutsideDriveRecords} from "@/modules/placements/recorded-outside-participation-service";
export default async function TpoRecordedOutsidePage({searchParams}:{searchParams:Promise<{saved?:string}>}){
 const context=await getCurrentRequestContext();
 if(
  !context.membership ||
  !hasMembershipRole(context,"TPO")
 ){
  redirect("/dashboard");
 }
 const collegeId=context.membership.collegeId;
 const result=await recordedOutsideChoices(context,collegeId);
 const recorded=await listTpoOutsideDriveRecords(context);
 const savedId=(await searchParams).saved;
 const saved=savedId?await verifyRecordedOutsideConfirmation(context,collegeId,savedId):false;
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="TPO · Drive creation" title="Record an outside-platform drive"
   description="Document a drive that already happened outside LMS without publishing any job or learners."/>
  <Link href="/tpo/placements/new" className="inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] md:min-h-9">Back to platform drive creation</Link>
  {saved?<Banner tone="success">
   External drive record saved. It was not published as a job.
  </Banner>:null}
  <RecordedOutsideForm collegeId={collegeId} choices={result.choices}/>
  <section aria-label="Recorded outside drives" className="space-y-3 border-b border-border pb-6">
   <h2 className="font-semibold">Recorded outside drives</h2>
   <p className="text-sm text-body">These are historic records, not published jobs; they are excluded from learner application reminders.</p>
   {recorded.length?<ul className="divide-y divide-border">
    {recorded.map(item=><li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
     <span>{item.company} · {item.title} · {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(item.occurredAt)} · Recorded outside LMS</span>
     <Link href={"/tpo/placements/recorded-outside/"+item.id} className="font-semibold text-[var(--lms-teal-deep)] underline">
      Add students and results
     </Link>
    </li>)}
   </ul>:<p role="status" className="text-sm text-muted-foreground">No outside-platform drives have been recorded yet.</p>}
  </section>
 </div>;
}
