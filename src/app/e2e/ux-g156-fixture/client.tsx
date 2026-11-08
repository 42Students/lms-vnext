"use client";
import {useEffect,useState} from "react";
import {TpoBatchInvitationControl} from "@/components/tpo/tpo-batch-invitation-control";
import {TpoBatchClassDecision} from "@/components/tpo/tpo-batch-class-decision";
import {TpoAuditSavedViews} from "@/components/tpo/tpo-audit-saved-views";
import {Heading} from "@/components/ui/heading";

const batch="00000000-0000-4000-8000-000000000156";
const invitedBatch="00000000-0000-4000-8000-000000000256";
export function UxG156FixtureClient(){
 const [ready,setReady]=useState(false);
 useEffect(()=>{setReady(true)},[]);
 return <main id="lms-main-content" className="mx-auto w-full max-w-[70rem] min-w-0 space-y-8 px-4 py-6 md:px-8">
  <span data-ux-g156-ready={ready?"true":"false"} aria-hidden="true" className="hidden"/>
  <Heading level={1}>TPO batch/audit interaction acceptance</Heading>
  <section data-ux-fixture="invite" className="min-w-0 rounded-xl border border-border p-4">
   <TpoBatchInvitationControl batchId={batch} invitedAt={null} finishedAt={null}
    deadline={null} expectedVersion="2026-11-07T08:00:00.000Z"
    invitable={2} eligible={5} deadlinePassed={false} minDate="2026-11-08"/>
  </section>
  <section data-ux-fixture="remind" className="min-w-0 rounded-xl border border-border p-4">
   <TpoBatchInvitationControl batchId={invitedBatch}
    invitedAt="2026-11-07T08:00:00.000Z" finishedAt={null}
    deadline="2030-01-01T18:29:59.000Z" expectedVersion="2026-11-07T08:00:00.000Z"
    invitable={3} eligible={5} deadlinePassed={false} minDate="2026-11-08"/>
  </section>
  <section data-ux-fixture="decision" className="min-w-0 rounded-xl border border-border p-4">
   <TpoBatchClassDecision batchId={batch} classId="00000000-0000-4000-8000-000000000356"
    initial="ELIGIBLE" expectedVersion="2026-11-07T08:00:00.000Z" finished={false}/>
  </section>
  <section data-ux-fixture="audit" className="min-w-0 rounded-xl border border-border p-4">
   <TpoAuditSavedViews filters={{kind:"ALL",q:""}}/>
  </section>
 </main>;
}
