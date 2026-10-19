"use client";
import { Radio } from "@/components/ui/radio";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  learnerPlacementChoices, LEARNER_REGISTRATION_COPY,
  type LearnerPlacementChoice,
} from "@/modules/placements/learner-registration-view-model";
type Props = {
  registration: {
    stage: "NOT_INVITED" | "FINISHED" | "OPEN" | "CLOSED";
    deadline: string | null;
    choice: LearnerPlacementChoice | null;
  };
};
const errors: Record<string,string> = {
  DB08_REGISTRATION_WINDOW_CLOSED: LEARNER_REGISTRATION_COPY.closed,
  DB08_REGISTRATION_NOT_ELIGIBLE: "Ask the placement cell about your eligibility.",
  DB08_REGISTRATION_ENROLLMENT_INVALID: "Ask your college to check your batch.",
  DB08_REGISTRATION_CONSENT_REQUIRED: "Agree to the sharing statement before registering.",
};
export function LearnerPlacementRegistration({registration}:Props) {
  const router = useRouter();
  const [choice,setChoice] = useState<LearnerPlacementChoice>(registration.choice ?? "PLACEMENTS");
  const [consent,setConsent] = useState(false);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  async function submit() {
    if (registration.stage !== "OPEN" || busy) return;
    if (choice === "PLACEMENTS" && !consent) {
      setError(errors.DB08_REGISTRATION_CONSENT_REQUIRED); return;
    }
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/placements/registration",{
        method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({choice,acceptedConsent: choice==="PLACEMENTS" && consent}),
      });
      const data = await response.json() as {error?:string};
      if (!response.ok) throw Error(errors[data.error??""] ?? LEARNER_REGISTRATION_COPY.failure);
      setMessage(LEARNER_REGISTRATION_COPY.success);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error?cause.message:LEARNER_REGISTRATION_COPY.failure);
    } finally {setBusy(false);}
  }
  return <section id="registration" aria-label="Registration" className="space-y-3 border-b border-border pb-6">
    <h2 className="font-semibold">{LEARNER_REGISTRATION_COPY.title}</h2>
    <fieldset disabled={busy || registration.stage!=="OPEN"} className="space-y-2">
      <legend className="text-sm font-semibold">{LEARNER_REGISTRATION_COPY.choice}</legend>
      {learnerPlacementChoices.map(item=><label key={item.value} className="flex min-h-11 gap-3 rounded-[var(--lms-control-radius)] border border-border p-3">
        <Radio name="sp-choice" checked={choice===item.value}
          onChange={()=>{setChoice(item.value);setConsent(false);}} className="mt-1" />
        <span><span className="block font-semibold">{item.label}</span>
          <span className="block text-sm text-muted-foreground">{item.hint}</span></span>
      </label>)}
      {choice==="PLACEMENTS"?<label className="flex gap-2 text-sm">
        <Checkbox checked={consent} onChange={e=>setConsent(e.target.checked)}/>
        <span>{LEARNER_REGISTRATION_COPY.consent}</span>
      </label>:null}
    </fieldset>
    {registration.stage==="OPEN"?<>
      {registration.deadline?<p className="text-sm">{LEARNER_REGISTRATION_COPY.deadline} {new Date(registration.deadline).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"})}.</p>:null}
      <Button type="button" disabled={busy} onClick={()=>void submit()}>
        {busy?"Saving…":registration.choice?LEARNER_REGISTRATION_COPY.update:LEARNER_REGISTRATION_COPY.register}
      </Button>
    </>:<p className="text-sm" role="status">{registration.stage==="NOT_INVITED"?
      LEARNER_REGISTRATION_COPY.notInvited:LEARNER_REGISTRATION_COPY.closed}</p>}
    {registration.choice?<p className="text-sm">Your choice: {learnerPlacementChoices.find(item=>item.value===registration.choice)?.label}</p>:null}
    {message?<p role="status" className="text-sm">{message}</p>:null}
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  </section>;
}
