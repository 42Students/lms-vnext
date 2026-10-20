"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {TPO_RULE_LIMITS,tpoRuleBoundsValid} from "@/modules/placements/tpo-rule-limits";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
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
      if(!link||link.hasAttribute("download")||allowUnload.current)return;
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
  async function save() {
    if (inFlight.current) return;
    const values = {
      countsAsPlacedAt: form.countsAsPlacedAt,
      maxHeldOffers: Number(form.maxHeldOffers),
      upliftPct: Number(form.upliftPct),
      minResponseHours: Number(form.minResponseHours),
    };
    if(!tpoRuleBoundsValid(values)){
      setError("Held offers: 1–5; uplift: 0–200%; response hours: 12–168.");
      return;
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
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save rules.");
    } finally { inFlight.current = false; setBusy(false); }
  }
  return (
    <section className="border-b border-border pb-6">
      <h3 className="text-base font-semibold text-foreground">Offers and placed</h3>
      <p className="mt-2 text-sm text-body">
        The placed numbers (Home, Students, Reports) follow the first rule as soon as you save; the offer rules apply to offers released from then on.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {dirty?<div className="min-w-0 sm:col-span-2"><InlineNotice tone="info" message="Unsaved changes"/></div>:null}
        <label className="grid gap-1 text-sm font-semibold text-body">
          A student counts as placed when the offer is
          <Select value={form.countsAsPlacedAt} disabled={busy}
            onChange={(event) => setForm((current) => ({ ...current, countsAsPlacedAt: event.target.value }))}
            className="min-h-11 md:min-h-9">
            <option value="OFFER_RELEASED">released</option>
            <option value="OFFER_ACCEPTED">accepted</option>
          </Select>
        </label>
        {(["maxHeldOffers", "upliftPct", "minResponseHours"] as const).map((key) => (
          <label key={key} className="grid gap-1 text-sm font-semibold text-body">
            {key === "maxHeldOffers" ? "Maximum held offers" : key === "upliftPct" ? "Offer uplift %" : "Minimum response hours"}
            <Input type="number" min={TPO_RULE_LIMITS[key].min} max={TPO_RULE_LIMITS[key].max} step={1}
              value={form[key]} disabled={busy}
              onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              className="min-h-11 md:min-h-9" />
          </label>
        ))}
      </div>
      <section role="status" className="mt-4 text-sm text-body border-t border-border pt-5">
        <p>A student may hold {Number.isFinite(held)?held:0} offers (released or accepted) before the next rule applies.</p>
        <p className="mt-1">After that, another offer needs a CTC at least {form.upliftPct}% higher than their best offer, or a Dream drive. Internships never count.</p>
        <p className="mt-2 font-semibold">For example</p>
        <p>A student holding a 5 LPA offer can take another only if it is at least {nextLpa} LPA, or from a Dream drive.</p>
      </section>
      <Button type="button" disabled={busy} onClick={() => void save()}
        className="mt-4 min-h-11 md:min-h-9">
        {busy ? "Saving..." : "Review and confirm rules"}
      </Button>
      {error ? <InlineNotice tone="error" message={error}/> : null}
      <ConfirmDialog open={confirmSave} onOpenChange={setConfirmSave}
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
