import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {TpoInterviewSlotPlanner} from "@/components/placements/tpo-interview-slot-planner";
import {getTpoInterviewSlotWorkspace} from "@/modules/placements/tpo-interview-slot-service";
import {PlacementsServiceError} from "@/modules/placements/errors";
export const dynamic="force-dynamic";
export default async function SlotsPage({params}:{params:Promise<{jobId:string;roundId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId,roundId}=await params;
 let data:Awaited<ReturnType<typeof getTpoInterviewSlotWorkspace>>;
 try{data=await getTpoInterviewSlotWorkspace(context,jobId,roundId);}
 catch(e){if(e instanceof PlacementsServiceError&&e.code==="PLACEMENT_ROUND_NOT_FOUND")notFound();throw e;}
 return <div className="min-w-0 space-y-6">
  <PageHeader eyebrow="TPO · Interviews" title={data.round.name+" · Slots and rooms"}
   description="Generate interview slots, book candidates and resolve room assignments before the drive day."/>
  <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/candidate-schedule"}
   className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">← Candidate schedule</Link>
  {!data.storageReady?<Alert tone="warning">
   Candidate-specific interview slot storage has not been registered. The orchestrator must register
   docs/proposed-migrations/chat-5-interview-candidate-slots.sql before booking or changing slots.</Alert>
   :data.round.kind!=="INTERVIEW"||data.round.roundStatus!=="SCHEDULED"||data.round.jobStatus!=="PUBLISHED"
   ?<Alert tone="warning">
     Slots can be booked only for a scheduled interview round in a published drive.</Alert>
   :<TpoInterviewSlotPlanner jobId={jobId} roundId={roundId}
     slots={data.slots.map(s=>({id:s.id,startsAt:s.startsAt,endsAt:s.endsAt,room:s.room,
       panel:s.panel,status:s.status,applicationId:s.applicationId,version:s.version}))}
     roster={data.roster} recruiterProposals={data.recruiterProposals} reschedules={data.reschedules}/>}
 </div>;
}
