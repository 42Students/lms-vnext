"use client";

/** CI-only component preview; copied to a temporary Next route by acceptance workflow.
 * This source is never included in the shipped app router. */
import {useState} from "react";
import {FacultyProfileEditor} from "@/components/people/faculty-profile-editor";
import {LearnerProfileWorkspace} from "@/components/profile/learner-profile-workspace";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {emptyLearnerProfileDocument} from "@/modules/people/profile-validation";
import {ToastProvider} from "@/components/ui/toast";

export default function UXProfileProof(){
 const [view,setView]=useState<"faculty"|"learner">("faculty");
 return <ToastProvider><main className="mx-auto w-full min-w-0 max-w-5xl space-y-5 px-4 py-8 sm:px-6">
  <header className="space-y-4 border-b border-border pb-5">
   <h1 className="text-2xl font-bold text-foreground">Profile editor UX acceptance</h1>
   <p className="text-sm text-body">Synthetic profile only, no private account, external data or production API calls.</p>
   <div className="flex flex-wrap gap-3">
    <button type="button" className="min-h-11 rounded border border-border bg-surface px-4 font-semibold focus-ring" onClick={()=>setView("faculty")}>Faculty preview</button>
    <button type="button" className="min-h-11 rounded border border-border bg-surface px-4 font-semibold focus-ring" onClick={()=>setView("learner")}>Learner preview</button>
   </div>
  </header>
  {view==="faculty"? <section aria-label="Faculty profile editor preview">
    <FacultyProfileEditor initialDocument={emptyFacultyProfileDocument} initialVersion={1}/>
   </section>:<section aria-label="Learner profile workspace preview">
    <LearnerProfileWorkspace displayName="Demo Learner" primaryEmail={null} primaryPhone={null}
      rollNumber={null} registrationNumber={null} initialDocument={emptyLearnerProfileDocument}/>
   </section>}
 </main></ToastProvider>;
}
