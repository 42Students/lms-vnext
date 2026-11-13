import { notFound } from "next/navigation";
import { TpoSelectionImport } from "@/components/placements/tpo-selection-import";
import { TpoWaitlistPromotionControl } from "@/components/placements/tpo-waitlist-promotion-control";
import { TpoWeekHourCalendar } from "@/components/placements/tpo-week-hour-calendar";

import { env } from "@/config/env";
export const dynamic = "force-dynamic";
const jobId="00000000-0000-4000-8000-000000000149";
const applicants=Array.from({length:101},(_,index)=>({
  applicationId:"app-"+String(index+1).padStart(3,"0"),
  name:"Synthetic learner "+String(index+1),email:"synthetic-"+index+"@invalid.example",
  roleTitle:"Developer",offerReady:true,alreadyOffered:false,
}));
const next={
  applicationId:"app-001",name:"Synthetic learner 1",roleTitle:"Developer",
  annualCtcInr:1200000,rank:1,reasons:[] as string[],canPromote:true,promotionStatus:null,
};
const week=["2027-01-04","2027-01-05","2027-01-06","2027-01-07","2027-01-08","2027-01-09","2027-01-10"];

/** Only synthetic source components. No seeded actor, tenant query or real mutation on the server. */
export default function TpoPlacementUxFixture() {
  if (process.env.NODE_ENV!=="development" || env.UX_G149_PLACEMENT_FIXTURE!=="1") notFound();
  return <main className="mx-auto min-w-0 max-w-5xl space-y-8 px-4 py-8">
    <h1 className="text-2xl font-bold">Placement recovery acceptance</h1>
    <p role="note">Synthetic TPO component props; all API calls must be intercepted by browser acceptance.</p>
    <section aria-label="Selection import recovery" className="space-y-4">
      <TpoSelectionImport jobId={jobId} candidates={applicants}/>
    </section>
    <section aria-label="Waitlist offer recovery" className="space-y-4">
      <TpoWaitlistPromotionControl jobId={jobId} preview={{
        storageReady:true,freeSeats:1,activeOffers:0,rows:[next],next,previewToken:"synthetic-preview-v1"
      }}/>
    </section>
    <section aria-label="Weekly calendar recovery" className="space-y-4">
      <TpoWeekHourCalendar days={week} events={[]} collegeId="00000000-0000-4000-8000-000000000149"
        canCreate={true} nowIso="2026-11-08T00:00:00Z" blockedDates={[]} blockedDatesAvailable={true}/>
    </section>
  </main>;
}
