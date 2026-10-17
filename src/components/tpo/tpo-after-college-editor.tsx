"use client";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";

import {useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
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

  return <div className="min-w-40 space-y-2" aria-label={"After college for " + learnerName}>
    <label className="grid gap-1 text-xs font-medium">
      After college
      <select value={draft} disabled={!available || pending}
        onChange={event => setDraft(event.target.value as AfterCollegeOutcome)}
        className="min-h-10 rounded border border-border bg-surface px-2 text-xs">
        {!MANUAL_AFTER_COLLEGE_OUTCOMES.includes(draft)?<option value={draft} disabled>{AFTER_COLLEGE_LABELS[draft]} · Automatic</option>:null}
        {afterCollegeOptions().map(option => <option value={option.value} key={option.value}>
          {option.label}
        </option>)}
      </select>
    </label>
    {["ENTREPRENEURSHIP","COMPETITIVE_EXAMS"].includes(draft)?<p className="text-xs text-muted-foreground">Additional destination details are not yet stored; verify these with the learner before saving.</p>:null}
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={!available || pending || draft === saved}
        className="min-h-9 rounded border border-border px-2 text-xs font-semibold disabled:opacity-50"
        onClick={() => write(draft)}>Save</button>
      {undo !== null && undo !== saved ? <button type="button" disabled={pending}
        className="min-h-9 rounded border border-border px-2 text-xs disabled:opacity-50"
        onClick={() => write(undo, true)}>Undo</button> : null}
    </div>
    {!available ? <p className="text-xs text-muted-foreground">Outcome storage unavailable.</p> : null}
    {message ? <p role="status" className="text-xs">{message}</p> : null}
    {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
    <Dialog open={confirmation!==null} onOpenChange={open=>{if(!open&&!pending)setConfirmation(null);}}
      title={confirmation?.reversing?"Restore previous outcome":"Save after-college outcome"}
      description={(confirmation?.reversing?"Restore":"Save")+" after-college outcome for "+learnerName+"?"}
      footer={<><Button variant="secondary" disabled={pending} onClick={()=>setConfirmation(null)}>Cancel</Button>
        <Button disabled={pending} onClick={()=>void apply()}>{pending?"Saving…":"Confirm"}</Button></>}>
      <p className="text-sm">Your selected outcome is kept if saving does not complete.</p>
    </Dialog>
  </div>;
}
