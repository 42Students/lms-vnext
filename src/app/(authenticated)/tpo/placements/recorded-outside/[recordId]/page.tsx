import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoOutsideDriveParticipants} from "@/modules/placements/recorded-outside-participation-service";
import {TpoOutsideParticipantsEditor} from "@/components/placements/tpo-outside-participants-editor";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
export default async function TpoOutsideDriveDetail({params,searchParams}:{
 params:Promise<{recordId:string}>;searchParams:Promise<{q?:string}>;
}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {recordId}=await params,q=(await searchParams).q??"";
 let data:Awaited<ReturnType<typeof getTpoOutsideDriveParticipants>>;
 try{data=await getTpoOutsideDriveParticipants(context,recordId,q);}
 catch(error){if(error instanceof PlacementsServiceError)notFound();throw error;}
 return <div className="min-w-0 space-y-5">
  <Link href="/tpo/placements/recorded-outside" className="inline-flex min-h-11 items-center text-[13px] font-semibold text-[var(--lms-link-text)] underline min-[768px]:min-h-9">← All recorded outside drives</Link>
  <PageHeader eyebrow="TPO · External history" title={data.record.title}
   description="Add participating learners and outcomes from a drive already completed outside the platform."/>
  <p className="text-sm text-body">Occurred {new Intl.DateTimeFormat("en-IN",{
   timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(data.record.occurredAt)} IST</p>
  <form method="get" role="search" aria-label="Find college learners" className="flex min-w-0 flex-wrap items-end gap-3 border-b border-[var(--lms-canvas-border)] pb-4">
   <label className="grid min-w-0 flex-1 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search college learners
    <Input name="q" defaultValue={q} maxLength={80} />
   </label>
   <Button variant="secondary" type="submit" className="self-end">Find</Button>
  </form>
  <TpoOutsideParticipantsEditor recordId={recordId} choices={data.choices}
   participants={data.participants} available={data.available}/>
 </div>;
}
