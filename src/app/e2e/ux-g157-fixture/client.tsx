"use client";
import {Suspense,useEffect,useState} from "react";
import {TpoCompanyTeamComposer} from "@/components/tpo/tpo-company-team-composer";
import {TpoBlockedDatesEditor} from "@/components/tpo/tpo-blocked-dates-editor";
import {TpoBatchStudentSavedViews} from "@/components/tpo/tpo-batch-student-saved-views";
import {TpoCampaignSendControl} from "@/components/tpo/tpo-campaign-send-control";
import {ToastProvider} from "@/components/ui/toast";
import {Button} from "@/components/ui/button";
import {Heading} from "@/components/ui/heading";

const firstCompany="00000000-0000-4000-8000-000000000157";
const secondCompany="00000000-0000-4000-8000-000000000257";
export function UxG157FixtureClient(){
 const [companyId,setCompanyId]=useState(firstCompany);
 const [ready,setReady]=useState(false);
 useEffect(()=>{setReady(true);},[]);
 return <main id="lms-main-content" className="mx-auto w-full max-w-[70rem] min-w-0 space-y-8 px-4 py-6 md:px-8">
  <span data-ux-g157-ready={ready?"true":"false"} aria-hidden="true" className="hidden"/>
  <Heading level={1}>TPO group 157 synthetic interaction test</Heading>
  <section data-ux-fixture="company" className="min-w-0 space-y-3 rounded-xl border border-border p-4">
   <Heading level={2}>Private company discussion</Heading>
   <p role="status">Selected: {companyId===firstCompany?"Company A":"Company B"}</p>
   <Button type="button" variant="secondary" onClick={()=>setCompanyId(id=>id===firstCompany?secondCompany:firstCompany)}>Change company</Button>
   <TpoCompanyTeamComposer companyId={companyId} actorUserId="fixture-tpo-user"/>
  </section>
  <section data-ux-fixture="blocked" className="min-w-0 space-y-3 rounded-xl border border-border p-4">
   <Heading level={2}>Blocked dates</Heading>
   <TpoBlockedDatesEditor items={[]}/>
  </section>
  <section data-ux-fixture="views" className="min-w-0 space-y-3 rounded-xl border border-border p-4">
   <Heading level={2}>Saved batch views</Heading>
   <Suspense fallback={<p role="status">Loading saved views…</p>}>
    <TpoBatchStudentSavedViews batchId="00000000-0000-4000-8000-000000000357"/>
   </Suspense>
  </section>
  <section data-ux-fixture="campaign" className="min-w-0 space-y-3 rounded-xl border border-border p-4">
   <Heading level={2}>Campaign delivery readiness</Heading>
   <ToastProvider>
    <TpoCampaignSendControl campaignId="00000000-0000-4000-8000-000000000457"
     ready={false} recipients={4} status="DRAFT"/>
   </ToastProvider>
  </section>
 </main>;
}
