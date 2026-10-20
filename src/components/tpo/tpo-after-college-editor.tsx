"use client";
import {Select} from "@/components/ui/select";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";

import {useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import { useRouter } from "next/navigation";
import {
  afterCollegeOptions,AFTER_COLLEGE_LABELS,MANUAL_AFTER_COLLEGE_OUTCOMES, type AfterCollegeOutcome,
} from "@/modules/placements/tpo-after-college-model";

export function TpoAfterCollegeEditor({
  membershipId, learnerName, initial, available,
}: {
  membershipId: string;
  learnerName: string;
  initial: { outcome: AfterCollegeOutcome; expectedVersion: string };
  available: boolean;
}) {
  const router = useRouter();
  const {run:runGuarded,pending}=useGuardedAction();
  const [confirmation,setConfirmation]=useState<{outcome:AfterCollegeOutcome;reversing:boolean}|null>(null);
  const [error,setError]=useState("");
  const [saved, setSaved] = useState(initial.outcome);
  const [draft, setDraft] = useState<AfterCollegeOutcome>(initial.outcome);
  const [version, setVersion] = useState(initial.expectedVersion);
  const [undo, setUndo] = useState<AfterCollegeOutcome | null>(null);
  const [message, setMessage] = useState("");

  function write(outcome:AfterCollegeOutcome,reversing=false){
    if(!available||pending||(outcome===saved&&!reversing))return;
    setConfirmation({outcome,reversing});
    setError("");
  }
  async function apply(){
    if(!confirmation||pending)return;
    const {outcome,reversing}=confirmation;
    await runGuarded(async()=>{
      setMessage("");setError("");
      try{
        const data=await apiFetch<{version?:string}>(
          "/api/placements/tpo/students/"+encodeURIComponent(membershipId)+"/after-college",{
            method:"PUT",credentials:"same-origin",
            headers:{"content-type":"application/json"},
            body:JSON.stringify({outcome,expectedVersion:version}),
          });
        const previous=saved;
        setSaved(outcome);setDraft(outcome);setVersion(data?.version??version);
        setUndo(reversing?null:previous);
        setMessage(reversing?"Previous outcome restored.":"After-college outcome saved.");
        setConfirmation(null);
        router.refresh();
      }catch(cause){
        setError(cause instanceof FriendlyFetchError && cause.status===409
          ?"This changed while you were working. Your outcome selection is kept below. Refresh before retrying."
          :cause instanceof Error?cause.message:"Could not save outcome. Please try again.");
      }
    });
  }

  return <div className="min-w-0 space-y-2" aria-label={"After college for " + learnerName}>
    <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold leading-4">
      After college
      <Select value={draft} disabled={!available || pending}
        onChange={event => setDraft(event.target.value as AfterCollegeOutcome)}
        className="min-h-11 w-full min-w-0 md:min-h-9">
        {!MANUAL_AFTER_COLLEGE_OUTCOMES.includes(draft)?<option value={draft} disabled>{AFTER_COLLEGE_LABELS[draft]} · Automatic</option>:null}
        {afterCollegeOptions().map(option => <option value={option.value} key={option.value}>
          {option.label}
        </option>)}
      </Select>
    </label>
    {["ENTREPRENEURSHIP","COMPETITIVE_EXAMS"].includes(draft)?<p className="text-xs text-muted-foreground">Additional destination details are not yet stored; verify these with the learner before saving.</p>:null}
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button variant="primary" type="button" disabled={!available || pending || draft === saved}
        className="min-h-11 w-full md:min-h-9 sm:w-auto"
        onClick={() => write(draft)}>Save</Button>
      {undo !== null && undo !== saved ? <Button variant="secondary" type="button" disabled={pending}
        className="min-h-11 w-full md:min-h-9 sm:w-auto"
        onClick={() => write(undo, true)}>Undo</Button> : null}
    </div>
    {!available ? <p className="text-xs text-muted-foreground">Outcome storage unavailable.</p> : null}
    {message ? <InlineNotice tone="success" message={message}/> : null}
    {error?<InlineNotice tone="error" message={error}/>:null}
    <Dialog open={confirmation!==null} onOpenChange={open=>{if(!open&&!pending)setConfirmation(null);}}
      title={confirmation?.reversing?"Restore previous outcome":"Save after-college outcome"}
      description={(confirmation?.reversing?"Restore":"Save")+" after-college outcome for "+learnerName+"?"}
      footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" disabled={pending} className="min-h-11 w-full md:min-h-9 sm:w-auto" onClick={()=>setConfirmation(null)}>Cancel</Button>
        <Button disabled={pending} loading={pending} className="min-h-11 w-full md:min-h-9 sm:w-auto" onClick={()=>void apply()}>{pending?"Saving…":"Confirm"}</Button></div>}>
      <p className="text-sm">Your selected outcome is kept if saving does not complete.</p>
    </Dialog>
  </div>;
}
