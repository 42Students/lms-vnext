import {notFound} from "next/navigation";
import {TpoTeamAwayForm} from "@/components/tpo/tpo-team-away-form";
import {TpoTeamRename} from "@/components/tpo/tpo-team-rename";
import {TpoTeamMessageActions} from "@/components/tpo/tpo-team-message-actions";
import {TpoStudentNudgePanel} from "@/components/tpo/tpo-student-nudge-panel";
import {Heading} from "@/components/ui/heading";
import {UxG159FixtureReady} from "./ready";

import { env } from "@/config/env";
export const dynamic="force-dynamic";

/** Synthetic-data-only acceptance harness, not a publicly available route. */
export default function TeamInteractionFixture(){
 if(process.env.NODE_ENV!=="development"||env.UX_G159_FIXTURE!=="1")notFound();
 return <main id="lms-main-content" className="mx-auto w-full max-w-[70rem] min-w-0 space-y-7 px-4 py-6 md:px-8">
  <UxG159FixtureReady/>
  <Heading level={1} className="text-2xl font-bold">TPO team interaction acceptance</Heading>
  <section data-ux-fixture="away" className="min-w-0 rounded-xl border border-border p-4">
   <Heading level={2}>Set away status</Heading>
   <TpoTeamAwayForm until="2026-12-01T00:00:00.000Z"/>
  </section>
  <section data-ux-fixture="rename" className="min-w-0 rounded-xl border border-border p-4">
   <Heading level={2}>Conversation rename</Heading>
   <TpoTeamRename threadId="00000000-0000-4000-8000-000000000159" currentTopic="Recruiter follow-ups"/>
  </section>
  <section data-ux-fixture="nudge" className="min-w-0 rounded-xl border border-border p-4">
   <TpoStudentNudgePanel rows={Array.from({length:26},(_,index)=>({
    id:"learner-"+(index+1),label:"Learner "+(index+1),registered:true,
   }))}/>
  </section>
  <section data-ux-fixture="message" className="min-w-0 rounded-xl border border-border p-4">
   <Heading level={2}>Message actions</Heading>
   <TpoTeamMessageActions threadId="00000000-0000-4000-8000-000000000159"
    messageId="00000000-0000-4000-8000-000000000259" body="Initial team message"
    expectedBodyHash="fixture-message-hash" canEdit/>
  </section>
 </main>;
}
