"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {TPO_RULE_LIMITS,tpoRuleBoundsValid} from "@/modules/placements/tpo-rule-limits";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useToast} from "@/components/ui/toast";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Disclosure} from "@/components/ui/disclosure";

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
    window.addEventListener("beforeunload",onUnload);
    document.addEventListener("click",onLink,true);
    return ()=>{window.removeEventListener("beforeunload",onUnload);document.removeEventListener("click",onLink,true);};
  },[dirty]);
  const [busy, setBusy] = useState(false);
  // A ref closes the gap before React renders disabled after a rapid double-click.
  const inFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [notice,setNotice]=useState("");
  async function save() {
    if (inFlight.current) return;
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
  return (
    <section className="min-w-0 border-b border-border pb-5">
      <h3 className="text-base font-semibold text-[var(--lms-heading)]">Offers and placed</h3>
      <p className="mt-2 text-sm text-body leading-[22px]">
        The placed numbers (Home, Students, Reports) follow the first rule as soon as you save; the offer rules apply to offers released from then on.
      </p>
      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
        {dirty?<div className="min-w-0 sm:col-span-2"><InlineNotice tone="info" message="Unsaved changes"/></div>:null}
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
          A student counts as placed when the offer is
          <Select value={form.countsAsPlacedAt} disabled={busy}
            onChange={(event) => {setError(null);setNotice("");setForm(current=>({...current,countsAsPlacedAt:event.target.value}));}}
            className="min-h-11 w-full md:min-h-9">
            <option value="OFFER_RELEASED">released</option>
            <option value="OFFER_ACCEPTED">accepted</option>
          </Select>
        </label>
        {(["maxHeldOffers", "upliftPct", "minResponseHours"] as const).map((key) => (
          <label key={key} className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
            {key === "maxHeldOffers" ? "Maximum held offers" : key === "upliftPct" ? "Offer uplift %" : "Minimum response hours"}
            <Input type="number" min={TPO_RULE_LIMITS[key].min} max={TPO_RULE_LIMITS[key].max} step={1}
              value={form[key]} disabled={busy}
              onChange={(event) => {setError(null);setNotice("");setForm(current=>({...current,[key]:event.target.value}));}}
              className="min-h-11 w-full md:min-h-9" />
          </label>
        ))}
      </div>
      <section role="status" className="mt-4 min-w-0 space-y-1 border-t border-border pt-4 text-sm text-body">
        <p>A student may hold {Number.isFinite(held)?held:0} offers (released or accepted) before the next rule applies.</p>
        <p className="mt-1">After that, another offer needs a CTC at least {form.upliftPct}% higher than their best offer, or a Dream drive. Internships never count.</p>
        <Disclosure title="For example" className="mt-3 border-t border-border py-2"><p className="pt-2">A student holding a 5 LPA offer can take another only if it is at least {nextLpa} LPA, or from a Dream drive.</p></Disclosure>
      </section>
      <Button type="button" disabled={busy} onClick={() => void save()}
        className="mt-4 min-h-11 w-full sm:w-auto md:min-h-9">
        {busy ? "Saving..." : "Review and confirm rules"}
      </Button>
      {notice?<InlineNotice tone="success" message={notice}/>:null}
      {error ? <InlineNotice tone="error" message={error}/> : null}
      <ConfirmDialog open={confirmSave} onOpenChange={next=>{if(!busy)setConfirmSave(next);}}
        title="Save college-wide placement rules?"
        description="Save college-wide placement rules? These settings may affect future offer eligibility. Continue?"
        confirmLabel="Save rules" confirmVariant="primary" pending={busy}
        onConfirm={() => void save()}/>
      <ConfirmDialog open={leaveHref !== null}
        onOpenChange={next => { if (!next) setLeaveHref(null); }}
        title="Discard unsaved placement settings?"
        description="You have unsaved placement settings. Leave without saving them?"
        confirmLabel="Leave without saving" confirmVariant="danger"
        onConfirm={()=>{
          if(!leaveHref)return;
          const href=new URL(leaveHref,window.location.href);
          setLeaveHref(null);
          allowUnload.current=true;
          if(href.origin===window.location.origin)router.push(href.pathname+href.search+href.hash);
          else window.location.assign(href.href);
        }}/>
    </section>
  );
}
