"use client";
import { Radio } from "@/components/ui/radio";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";
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
  DB08_REGISTRATION_CONSENT_REQUIRED: "To register for placements you need to agree to share your details with the companies you apply to",
  DB08_REGISTRATION_MODULE_DISABLED: "Placements is not enabled for your college.",
  DB08_REGISTRATION_FORBIDDEN: "You cannot register for placements with this account.",
  DB08_REGISTRATION_CONSENT_NOT_APPLICABLE: "Consent is only needed when you choose Placements.",
};
export function LearnerPlacementRegistration({registration}:Props) {
  const router = useRouter();
  const {showToast}=useToast();
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
      const data = await response.json() as {error?:string;ok?:boolean;choice?:LearnerPlacementChoice;version?:number};
      if(!response.ok){
        if(response.status===409&&data.error==="DB08_REGISTRATION_WINDOW_CLOSED")
          throw Error(LEARNER_REGISTRATION_COPY.closed);
        throw Error(errors[data.error??""] ?? LEARNER_REGISTRATION_COPY.failure);
      }
      if(data.ok!==true||data.choice!==choice)
        throw Error("Could not confirm your registration. Refresh and check your recorded choice.");
      setMessage(LEARNER_REGISTRATION_COPY.success);
      showToast({tone:"success",title:"Registration saved"});
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error?cause.message:LEARNER_REGISTRATION_COPY.failure);
    } finally {setBusy(false);}
  }
  return <section id="registration" aria-label="Registration" className="scroll-mt-24 min-w-0 space-y-3 border-b border-border pb-6">
    <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">{LEARNER_REGISTRATION_COPY.title}</h2>
    <fieldset disabled={busy || registration.stage!=="OPEN"} className="space-y-2">
      <legend className="text-sm font-semibold">{LEARNER_REGISTRATION_COPY.choice}</legend>
      {learnerPlacementChoices.map(item=><label key={item.value} className="flex min-h-11 min-w-0 items-start gap-3 border-b border-border px-2 py-3 transition-colors duration-150 hover:bg-[var(--lms-primary-subtle)] focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-[var(--lms-primary)] motion-reduce:transition-none has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
        <Radio name="sp-choice" checked={choice===item.value}
          onChange={()=>{setChoice(item.value);setConsent(false);}} className="mt-1" />
        <span className="min-w-0"><span className="block break-words font-semibold">{item.label}</span>
          <span className="block break-words text-sm text-muted-foreground">{item.hint}</span></span>
      </label>)}
      {choice==="PLACEMENTS"&&registration.choice==="PLACEMENTS"?
        <p className="text-sm text-muted-foreground">You previously chose Placements. To update or reconfirm this registration, please agree to the sharing statement again.</p>:null}
      {choice==="PLACEMENTS"?<label className="flex min-h-11 min-w-0 items-start gap-2 py-2 text-sm">
        <Checkbox checked={consent} onChange={e=>setConsent(e.target.checked)}/>
        <span>{LEARNER_REGISTRATION_COPY.consent}</span>
      </label>:null}
    </fieldset>
    {registration.stage==="OPEN"?<>
      {registration.deadline?<p className="text-sm leading-[22px]">{LEARNER_REGISTRATION_COPY.deadline} {new Date(registration.deadline).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"})}.</p>:null}
      <Button className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={busy} onClick={()=>void submit()}>
        {busy?"Saving…":registration.choice?LEARNER_REGISTRATION_COPY.update:LEARNER_REGISTRATION_COPY.register}
      </Button>
    </>:<p className="text-sm leading-[22px]" role="status">{registration.stage==="NOT_INVITED"?
      LEARNER_REGISTRATION_COPY.notInvited:LEARNER_REGISTRATION_COPY.closed}</p>}
    {registration.choice?<p className="text-sm leading-[22px]">Your choice: {learnerPlacementChoices.find(item=>item.value===registration.choice)?.label}</p>:null}
    {message?<p role="status" className="text-sm leading-[22px]">{message}</p>:null}
    {error?<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>:null}
  </section>;
}
