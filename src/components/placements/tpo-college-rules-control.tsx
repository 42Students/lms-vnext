"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {TPO_RULE_LIMITS,tpoRuleBoundsValid} from "@/modules/placements/tpo-rule-limits";
import Link from "next/link";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useToast} from "@/components/ui/toast";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

type Rules = {
  countsAsPlacedAt: string;
  maxHeldOffers: number;
  upliftPct: number;
  minResponseHours: number;
  version: number;
};
export function TpoCollegeRulesControl({ rules }: { rules: Rules }) {
  const router = useRouter();
  const {showToast}=useToast();
  const [form, setForm] = useState({
    countsAsPlacedAt: rules.countsAsPlacedAt,
    maxHeldOffers: String(rules.maxHeldOffers),
    upliftPct: String(rules.upliftPct),
    minResponseHours: String(rules.minResponseHours),
  });
  const [saved, setSaved] = useState(form);
  const [confirmSave, setConfirmSave] = useState(false);
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const allowUnload = useRef(false);
  const held = Number(form.maxHeldOffers);
  const upliftValue = Number(form.upliftPct);
  const nextLpa = Number.isFinite(upliftValue) ? (5 * (1 + upliftValue / 100)).toFixed(2) : "—";
  const dirty = (Object.keys(form) as (keyof typeof form)[]).some(key=>form[key]!==saved[key]);
  useEffect(()=>{
    if(!dirty)return;
    const onUnload=(event:BeforeUnloadEvent)=>{
      if(allowUnload.current)return;
      event.preventDefault();event.returnValue="";
    };
    const onLink=(event:MouseEvent)=>{
      const target=event.target;
      const link=target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
      if(!link||link.hasAttribute("download")||allowUnload.current||event.defaultPrevented||
        event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      event.preventDefault();event.stopPropagation();
      setLeaveHref(link.href);
    };
    // A history sentinel catches same-origin browser Back/Forward, which
    // does not trigger beforeunload in the Next App Router.
    const originHref=window.location.href;
    const sentinel={lmsPlacementRulesDraft:true};
    window.history.pushState(sentinel,"",originHref);
    const onHistory=()=>{
      if(allowUnload.current)return;
      const requested=window.location.href;
      window.history.pushState(sentinel,"",originHref);
      if(requested!==originHref)setLeaveHref(requested);
      else setLeaveHref(originHref);
    };
    window.addEventListener("beforeunload",onUnload);
    window.addEventListener("popstate",onHistory);
    document.addEventListener("click",onLink,true);
    return ()=>{
      window.removeEventListener("beforeunload",onUnload);
      window.removeEventListener("popstate",onHistory);
      document.removeEventListener("click",onLink,true);
    };
  },[dirty]);
  const [busy, setBusy] = useState(false);
  // A ref closes the gap before React renders disabled after a rapid double-click.
  const inFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [notice,setNotice]=useState("");
  async function save() {
    if (inFlight.current||!dirty) return;
    const values = {
      countsAsPlacedAt: form.countsAsPlacedAt,
      maxHeldOffers: Number(form.maxHeldOffers),
      upliftPct: Number(form.upliftPct),
      minResponseHours: Number(form.minResponseHours),
    };
    if(!["OFFER_RELEASED","OFFER_ACCEPTED"].includes(values.countsAsPlacedAt)){
      setError("Counts as placed must be when the offer is released or accepted");return;
    }
    if(!Number.isSafeInteger(values.maxHeldOffers)||values.maxHeldOffers<1||values.maxHeldOffers>5){
      setError("Offers a student can hold must be 1 to 5");return;
    }
    if(!Number.isSafeInteger(values.upliftPct)||values.upliftPct<0||values.upliftPct>200){
      setError("The uplift must be 0 to 200%");return;
    }
    if(!Number.isSafeInteger(values.minResponseHours)||values.minResponseHours<12||values.minResponseHours>168){
      setError("Time to respond must be 12 to 168 hours");return;
    }
    if(!tpoRuleBoundsValid(values)){
      setError("Check placement rules and retry.");return;
    }
    if (!confirmSave) { setConfirmSave(true); return; }
    setConfirmSave(false);
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/placements/tpo/settings/rules", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, expectedVersion: rules.version, confirmed: true }),
      });
      if (!response.ok) throw new Error("Rules were changed elsewhere or could not be saved. Refresh and review.");
      setSaved({...form});
      setNotice("Placement rules saved");
      showToast({tone:"success",title:"Placement rules saved"});
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save rules.");
    } finally { inFlight.current = false; setBusy(false); }
  }
  const selectClass="mx-1 inline-flex min-h-11 w-auto max-w-full rounded-md border border-border bg-primary-subtle px-2 text-sm font-semibold text-primary-text md:min-h-9";
  const upliftChoices=[...new Set([0,10,20,30,40,50,60,70,80,90,100,125,150,175,200,Number(form.upliftPct)])]
    .filter(value=>Number.isSafeInteger(value)&&value>=0&&value<=200).sort((a,b)=>a-b);
  const responseChoices=[...new Set([12,24,36,48,72,96,120,144,168,Number(form.minResponseHours)])]
    .filter(value=>Number.isSafeInteger(value)&&value>=12&&value<=168).sort((a,b)=>a-b);
  const update=(key:keyof typeof form,value:string)=>{
    setError(null);setNotice("");setForm(current=>({...current,[key]:value}));
  };
  const discard=()=>{setForm({...saved});setError(null);setNotice("");setConfirmSave(false);};
  return (
    <section aria-label="Offers and placed" className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <p className="text-sm text-body">Read them as sentences. Click a highlighted value to change it.</p>
       {dirty?<span role="status" aria-live="polite" className="rounded-full border border-warning px-2 py-1 text-xs font-semibold text-warning-text">Unsaved changes</span>:null}
      </div>
      <div className="divide-y divide-border text-[15px] leading-8 text-foreground">
       <p className="py-4 first:pt-2">A student counts as placed when the offer is
        <Select aria-label="Counts as placed when" disabled={busy} value={form.countsAsPlacedAt}
         onChange={event=>update("countsAsPlacedAt",event.target.value)} className={selectClass}>
         <option value="OFFER_ACCEPTED">accepted</option>
         <option value="OFFER_RELEASED">released</option>
        </Select>.
       </p>
       <p className="py-4">A student may hold
        <Select aria-label="Maximum held offers" disabled={busy} value={form.maxHeldOffers}
         onChange={event=>update("maxHeldOffers",event.target.value)} className={selectClass}>
         {Array.from({length:5},(_,index)=>index+1).map(value=>
          <option key={value} value={value}>{value}</option>)}
        </Select>
        {held===1?" offer.":" offers."} After that, another offer needs a CTC at least
        <Select aria-label="Offer uplift threshold" disabled={busy} value={form.upliftPct}
         onChange={event=>update("upliftPct",event.target.value)} className={selectClass}>
         {upliftChoices.map(value=><option key={value} value={value}>{value}%</option>)}
        </Select>
        higher. Internships never count.
       </p>
       <p className="py-4">Students get
        <Select aria-label="Minimum response period" disabled={busy} value={form.minResponseHours}
         onChange={event=>update("minResponseHours",event.target.value)} className={selectClass}>
         {responseChoices.map(value=><option key={value} value={value}>{value} hours</option>)}
        </Select>
        to answer an offer. A placement officer can review any permitted extension separately.
       </p>
       <p className="py-4">CTC and dream-drive tiers are configured through
        <Link href="/tpo/settings/job-types" className="mx-1 font-semibold text-link underline underline-offset-2">Job types</Link>;
        the offer uplift above is the persisted college-wide threshold.
       </p>
      </div>
      <details className="rounded-lg border border-border px-3 py-2">
       <summary className="min-h-11 cursor-pointer text-sm font-semibold text-link">
        Custom thresholds and response times
       </summary>
       <div className="grid gap-3 border-t border-border py-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-body">Custom offer uplift (%)
         <Input type="number" min={TPO_RULE_LIMITS.upliftPct.min}
          max={TPO_RULE_LIMITS.upliftPct.max} step={1} value={form.upliftPct}
          disabled={busy} onChange={event=>update("upliftPct",event.target.value)}
          className="min-h-11 md:min-h-9"/>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-body">Custom response period (hours)
         <Input type="number" min={TPO_RULE_LIMITS.minResponseHours.min}
          max={TPO_RULE_LIMITS.minResponseHours.max} step={1} value={form.minResponseHours}
          disabled={busy} onChange={event=>update("minResponseHours",event.target.value)}
          className="min-h-11 md:min-h-9"/>
        </label>
       </div>
      </details>
      <p className="text-sm text-body">The placed numbers (Home, Students, Reports) follow your chosen placed trigger after you save. For example, an internship never counts as placed, and a qualifying Dream drive may follow separate eligibility rules.</p>
      <div className="rounded-lg bg-surface-muted px-4 py-3 text-sm leading-6 text-body">
       <strong className="font-semibold text-foreground">What this means today:</strong>
       A student holding a 5 LPA offer needs an offer of at least {nextLpa} LPA
       unless an applicable alternate placement rule permits the drive.
       Students' original offer and eligibility records are never rewritten when these rules change.
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
       <Button type="button" variant="secondary" disabled={busy||!dirty}
        onClick={discard} className="min-h-11 md:min-h-9">Discard</Button>
      <Button type="button" disabled={busy||!dirty} onClick={() => void save()}
        className="min-h-11 md:min-h-9">
        {busy ? "Saving..." : "Save the rules"}
      </Button>
      </div>
      {notice?<InlineNotice tone="success" message={notice}/>:null}
      {error ? <InlineNotice tone="error" message={error}/> : null}
      <ConfirmDialog open={confirmSave} onOpenChange={next=>{if(!busy)setConfirmSave(next);}}
        title="Save college-wide placement rules?"
        description="Save college-wide placement rules? These settings may affect future offer eligibility. Continue?"
        confirmLabel="Save rules" confirmVariant="primary" pending={busy}
        onConfirm={() => void save()}/>
      <ConfirmDialog open={leaveHref !== null}
        onOpenChange={next => { if (!next) setLeaveHref(null); }}
        title="Leave without saving"
        description="You have unsaved placement settings. Leave without saving them?"
        confirmLabel="Leave and discard" cancelLabel="Stay" confirmVariant="danger"
        onConfirm={()=>{
          if(!leaveHref)return;
          const href=new URL(leaveHref,window.location.href);
          setLeaveHref(null);
          allowUnload.current=true;
          if(href.origin===window.location.origin&&href.href!==window.location.href)
            router.push(href.pathname+href.search+href.hash);
          else if(href.href===window.location.href)window.history.back();
          else window.location.assign(href.href);
        }}/>
    </section>
  );
}
