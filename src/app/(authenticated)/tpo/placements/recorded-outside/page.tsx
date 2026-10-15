import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {RecordedOutsideForm} from "@/components/placements/recorded-outside-form";
import {recordedOutsideChoices,verifyRecordedOutsideConfirmation} from "@/modules/placements/recorded-outside-service";
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
 </main>;
}
