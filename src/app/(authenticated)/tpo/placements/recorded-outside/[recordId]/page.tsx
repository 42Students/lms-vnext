import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoOutsideDriveParticipants} from "@/modules/placements/recorded-outside-participation-service";
import {TpoOutsideParticipantsEditor} from "@/components/placements/tpo-outside-participants-editor";
export default async function TpoOutsideDriveDetail({params,searchParams}:{
 params:Promise<{recordId:string}>;searchParams:Promise<{q?:string}>;
}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {recordId}=await params,q=(await searchParams).q??"";
 let data:Awaited<ReturnType<typeof getTpoOutsideDriveParticipants>>;
 try{data=await getTpoOutsideDriveParticipants(context,recordId,q);}
 catch(error){if(error instanceof PlacementsServiceError)notFound();throw error;}
 return <main className="space-y-5">
  <Link href="/tpo/placements/recorded-outside" className="text-sm font-semibold text-primary-text">← All recorded outside drives</Link>
  <PageHeader eyebrow="TPO · External history" title={data.record.title}
   description="Add participating learners and outcomes from a drive already completed outside the platform."/>
  <p className="text-sm text-body">Occurred {new Intl.DateTimeFormat("en-IN",{
   timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(data.record.occurredAt)} IST</p>
  <form method="get" className="flex gap-2">
   <label className="grid gap-1 text-sm">Search college learners
    <input name="q" defaultValue={q} maxLength={80} className="min-h-11 md:min-h-9 rounded-[9px] border border-border px-3"/>
   </label>
   <button type="submit" className="self-end min-h-11 md:min-h-9 rounded-[9px] border border-border px-4 text-sm font-semibold">Find</button>
  </form>
  <TpoOutsideParticipantsEditor recordId={recordId} choices={data.choices}
   participants={data.participants} available={data.available}/>
 </main>;
}
