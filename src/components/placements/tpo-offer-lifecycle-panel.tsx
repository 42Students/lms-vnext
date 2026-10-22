"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";


import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {friendlyApiError} from "@/lib/friendly-error";
import { canRecordTpoOfferAction, parseTpoOfferExpiryIstInput, TPO_OFFER_REASON_PRESETS, TPO_OFFER_ACTIONS, type TpoOfferAction } from "@/modules/placements/tpo-offer-lifecycle-model";
import {Button} from "@/components/ui/button";

type CandidateOffer = {
  id: string;
  label: string;
  status: "ISSUED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  joiningStatus: "PENDING" | "JOINED" | "DEFERRED" | "DID_NOT_JOIN" | null;
};

export function TpoOfferLifecyclePanel({
  jobId,
  choices,
}: {
  jobId: string;
  choices: readonly CandidateOffer[];
}) {
  const router = useRouter();
  const {run}=useGuardedAction({timeoutMs:35000});
  const [reviewed,setReviewed]=useState(false);
  const [action, setAction] = useState<TpoOfferAction>("EXTEND");
  const [ids, setIds] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const eligible = choices.filter((choice) =>
    canRecordTpoOfferAction(action, choice.status, choice.joiningStatus),
  );
  const selected = eligible.filter((choice) => ids.includes(choice.id));
  const statuses = [...new Set(selected.map((item) => item.status))];
  const parsedExpiry = parseTpoOfferExpiryIstInput(expiresAt);
  const valid = selected.length > 0 && selected.length === ids.length &&
    selected.length <= 200 && new Set(selected.map(choice=>choice.id)).size===selected.length && statuses.length === 1 &&
    reason.trim().length >= 10 &&
    (action !== "EXTEND" || parsedExpiry !== null) &&
    (action !== "RECORD_JOINED" || Boolean(joiningDate));

  function select(id: string, checked: boolean) {
    setIds((current) => checked
      ? current.includes(id) || current.length >= 200
        ? current : [...current, id]
      : current.filter((value) => value !== id));
  }

  async function submit() {
    if (!valid || busy) return;
    if(!reviewed)return;
    await run(async()=>{
    setBusy(true);
    setNotice(null);
    try {
      const payload = await apiFetch<{updated?:number}>(
        "/api/placements/jobs/" + encodeURIComponent(jobId) + "/offers/lifecycle",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            confirmed: true,
            action,
            offerIds: selected.map((choice) => choice.id),
            expectedStatus: statuses[0],
            reason: reason.trim(),
            ...(action === "EXTEND" ? {
              expiresAt: parsedExpiry,
            } : {}),
            ...(action === "RECORD_JOINED" ? { joiningDate } : {}),
          }),
        },
      );

      setNotice(String(payload?.updated ?? 0) + " offer(s) updated and audited.");
      setIds([]);
      setReason("");
      setReviewed(false);
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : friendlyApiError({}));
    } finally {
      setBusy(false);
    }
    });
  }

  if (choices.length === 0) return null;
  return (
    <section className="space-y-4 border-b border-border pb-6" aria-label="TPO verified offer lifecycle">
      <div>
        <h3 className="text-base font-semibold text-[var(--lms-heading)]">Verified offer lifecycle</h3>
        <p className="mt-1 text-sm text-body leading-[22px]">
          Record an expiry extension, evidence-backed learner response, joining
          confirmation or employer withdrawal for up to 200 offers.
          Changing a learner response here requires independent confirmation evidence.
        </p>
      </div>
      <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)]">
        Administrative action
        <Select
          value={action}
          disabled={busy}
          onChange={(event) => {
            setAction(event.target.value as TpoOfferAction);
            setIds([]);
            setReviewed(false);
          }}
          className="mt-2 block min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-normal"
        >
          {TPO_OFFER_ACTIONS.map((value) => (
            <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
          ))}
        </Select>
      </label>
      {eligible.length === 0 ? (
        <EmptyState title="No offers currently match this action." description="Nothing will be changed."/>
      ) : (
        <div tabIndex={0} role="group" aria-label="Eligible offers, scroll for more" className="max-h-56 min-h-0 min-w-0 divide-y divide-border overflow-auto overscroll-contain rounded-[var(--lms-canvas-radius)] border border-border px-2 [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)]">
          {eligible.map((offer) => (
            <label key={offer.id} className="flex min-h-11 min-w-0 flex-wrap items-center gap-2 px-2 py-1 text-sm hover:bg-muted md:min-h-9">
              <Checkbox
                checked={ids.includes(offer.id)}
                disabled={busy || (ids.length >= 200 && !ids.includes(offer.id)) ||
                  (statuses.length > 0 && !statuses.includes(offer.status))}
                onChange={(event) => select(offer.id, event.target.checked)}
              />
              <span className="min-w-0 flex-1 break-words font-medium text-foreground">{offer.label}</span>
              <span className="text-muted-foreground">{offer.status}</span>
            </label>
          ))}
        </div>
      )}
      {action === "EXTEND" ? (
        <label className="block text-[13px] font-semibold">
          New expiry (IST)
          <DateInput
            mode="datetime-local"
            value={expiresAt}
            disabled={busy}
            onChange={(event) => setExpiresAt(event.target.value)}
            className="mt-2 block min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2"
          />
        </label>
      ) : null}
      {action === "RECORD_JOINED" ? (
        <label className="block text-[13px] font-semibold">
          Confirmed joining date
          <DateInput
            mode="date"
            value={joiningDate}
            disabled={busy}
            onChange={(event) => setJoiningDate(event.target.value)}
            className="mt-2 block min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2"
          />
        </label>
      ) : null}
      <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)]">
        Reason
        <Select className="mt-2 min-h-11 w-full md:min-h-9" value={TPO_OFFER_REASON_PRESETS.includes(reason as typeof TPO_OFFER_REASON_PRESETS[number])?reason:""} disabled={busy}
         onChange={event=>setReason(event.target.value)}>
         <option value="">Choose a reason or write your own</option>
         {TPO_OFFER_REASON_PRESETS.map(option=><option value={option} key={option}>{option}</option>)}
        </Select>
      </label>
      <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)]">
        Mandatory evidence / reason (10–1200 characters)
        <Textarea
          rows={3}
          maxLength={1200}
          value={reason}
          disabled={busy}
          onChange={(event) => setReason(event.target.value)}
          className="mt-2 block w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm font-normal text-foreground"
        />
      </label>
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <span className="text-sm text-body">{ids.length} / 200 selected</span>
        <label className="flex min-w-0 items-start gap-[6px] break-words text-[13px] text-[var(--lms-neutral-400)]">
          <Checkbox checked={reviewed} disabled={busy}
            onChange={event=>setReviewed(event.target.checked)} className="mt-1 h-4 w-4 accent-primary"/>
          I reviewed the {selected.length} affected offer(s) and supporting evidence.
          This is an audited administrative action, not a learner self-response.
        </label>
        <Button
          className="min-h-11 w-full md:w-auto md:min-h-9"
          loading={busy}
          type="button"
          disabled={!valid || busy || !reviewed}
          onClick={() => void submit()}
          
        >
          {busy ? "Recording..." : "Review and confirm action"}
        </Button>
      </div>
      {notice ? <p role={notice.includes("updated and audited")?"status":"alert"} className="text-sm text-body leading-[22px]">{notice}</p> : null}
      <TpoOfferLetterAttachment jobId={jobId} choices={choices}/>
    </section>
  );
}


type OfferLetterState={
 id:string;status:string;rowVersion:number;url:string|null;hasPrivateFile:boolean;
};
/** Legacy offer-letter URL attachment. Signed private files belong to the
 * existing storage workflow and cannot be replaced with a public link here.
 * A separate read of the selected offer supplies the optimistic revision. */
function TpoOfferLetterAttachment({jobId,choices}:{
 jobId:string;choices:readonly CandidateOffer[];
}){
 const router=useRouter();
 const requestId=useRef(0);
 const [selectedId,setSelectedId]=useState("");
 const [state,setState]=useState<OfferLetterState|null>(null);
 const [url,setUrl]=useState("");
 const [reason,setReason]=useState("");
 const [confirmed,setConfirmed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const attachable=choices.filter(offer=>offer.status==="ISSUED"||offer.status==="ACCEPTED");
 const endpoint=(id:string)=>"/api/placements/jobs/"+encodeURIComponent(jobId)+
  "/offers/"+encodeURIComponent(id)+"/letter";
 const linkValid=(()=>{
  try{const parsed=new URL(url.trim());
   return parsed.protocol==="https:"&&!parsed.username&&!parsed.password&&parsed.hostname.includes(".")&&
    !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(parsed.hostname);
  }catch{return false;}
 })();
 async function choose(id:string){
  const current=++requestId.current;
  setSelectedId(id);setState(null);setUrl("");setReason("");
  setConfirmed(false);setNotice("");setError("");
  if(!id)return;
  setBusy(true);
  try{
   const result=await apiFetch<OfferLetterState>(endpoint(id),{cache:"no-store"});
   if(current!==requestId.current)return;
   if(!result||result.id!==id||!Number.isSafeInteger(result.rowVersion))
    throw new Error("Could not verify this offer's current revision.");
   setState(result);setUrl(result.url??"");
  }catch(cause){
   if(current===requestId.current)
    setError(cause instanceof Error?cause.message:"Offer is unavailable. Retry the selection.");
  }finally{if(current===requestId.current)setBusy(false);}
 }
 async function attach(){
  if(busy||!selectedId||!state||state.hasPrivateFile||!confirmed||!linkValid||
    reason.trim().length<10||reason.trim().length>1200)return;
  const id=selectedId,current=++requestId.current;
  setBusy(true);setError("");setNotice("");
  try{
   const result=await apiFetch<{offerId:string;rowVersion:number}>(
    endpoint(id),{
     method:"POST",credentials:"same-origin",
     headers:{"content-type":"application/json"},
     body:JSON.stringify({confirmed:true,url:url.trim(),
      expectedRowVersion:state.rowVersion,reason:reason.trim()}),
    });
   if(current!==requestId.current)return;
   if(result.offerId!==id)throw new Error("The offer-letter attachment was not confirmed.");
   setState(old=>old?{...old,rowVersion:result.rowVersion,url:url.trim()}:old);
   setConfirmed(false);setReason("");
   setNotice("Offer-letter reference saved, audited and an in-app learner notice recorded.");
   router.refresh();
  }catch(cause){
   if(current===requestId.current)
    setError((cause instanceof Error?cause.message:"Could not attach the offer letter.")+
     " Refresh the selected offer before retrying if it changed elsewhere.");
  }finally{if(current===requestId.current)setBusy(false);}
 }
 if(attachable.length===0)return null;
 return <section aria-label="Attach offer letter" className="mt-5 space-y-3 border-t border-border pt-4">
  <h4 className="text-sm font-semibold text-[var(--lms-heading)]">Attach offer letter</h4>
  <p className="text-xs text-body">Use a permanent HTTPS reference supplied by the company.
   The selected-college TPO must record evidence. Private offer-letter files
   already stored through signed uploads are not replaced here.</p>
  <label className="grid min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Offer
   <Select value={selectedId} disabled={busy} onChange={e=>void choose(e.target.value)}
    className="min-h-11 w-full md:min-h-9">
    <option value="">Select issued or accepted offer</option>
    {attachable.map(offer=><option key={offer.id} value={offer.id}>{offer.label} · {offer.status}</option>)}
   </Select>
  </label>
  {state?.hasPrivateFile?<p role="status" className="text-sm text-body">
   This offer has a private uploaded letter. Use its signed file workflow instead of replacing it with an external link.
  </p>:state?<div className="min-w-0 space-y-3">
   <label className="grid min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
    Offer-letter HTTPS URL
    <Input type="url" maxLength={2048} required value={url} disabled={busy}
     placeholder="https://company.example/offer-letter.pdf"
     onChange={event=>{setUrl(event.target.value);setConfirmed(false);}}/>
   </label>
   {url&&!linkValid?<p role="alert" className="text-xs text-error">Enter a valid public HTTPS letter link.</p>:null}
   <label className="grid min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
    Evidence / reason (10–1200 characters)
    <Textarea rows={2} maxLength={1200} value={reason} disabled={busy}
     onChange={event=>{setReason(event.target.value);setConfirmed(false);}}/>
   </label>
   <label className="flex min-w-0 items-start gap-2 text-xs text-body">
    <Checkbox checked={confirmed} disabled={busy}
     onChange={event=>setConfirmed(event.target.checked)}/>
    I verified this letter with the employer and understand that the affected learner will be notified.
   </label>
   <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
    disabled={busy||!confirmed||!linkValid||reason.trim().length<10} loading={busy}
    onClick={()=>void attach()}>Save letter reference</Button>
  </div>:null}
  {busy?<p role="status" className="text-xs text-muted-foreground">Verifying selected offer…</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
 </section>;
}
