"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {TPO_RULE_LIMITS,tpoRuleBoundsValid} from "@/modules/placements/tpo-rule-limits";

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
  const held = Number(form.maxHeldOffers);
  const nextLpa = (5 * (1 + Number(form.upliftPct) / 100)).toFixed(2);
  const dirty = (Object.keys(form) as (keyof typeof form)[]).some(key=>form[key]!==saved[key]);
  useEffect(()=>{
    if(!dirty)return;
    const onUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    const onLink=(event:MouseEvent)=>{
      const target=event.target;
      if(target instanceof Element && target.closest("a[href]") && !window.confirm("You have unsaved placement settings. Leave without saving them?")){
        event.preventDefault();event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload",onUnload);
    document.addEventListener("click",onLink,true);
    return ()=>{window.removeEventListener("beforeunload",onUnload);document.removeEventListener("click",onLink,true);};
  },[dirty]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    if (busy) return;
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
    if (!window.confirm(
      "Save college-wide placement rules? These settings may affect future offer eligibility. Continue?",
    )) return;
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
    } finally { setBusy(false); }
  }
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-base font-semibold text-foreground">Offers and placed</h3>
      <p className="mt-2 text-sm text-body">
        The placed numbers (Home, Students, Reports) follow the first rule as soon as you save; the offer rules apply to offers released from then on.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {dirty?<p role="status" className="sm:col-span-2 text-sm text-warning-text">Unsaved changes</p>:null}
        <label className="grid gap-1 text-sm font-semibold text-body">
          A student counts as placed when the offer is
          <select value={form.countsAsPlacedAt} disabled={busy}
            onChange={(event) => setForm((current) => ({ ...current, countsAsPlacedAt: event.target.value }))}
            className="min-h-10 rounded-md border border-border bg-surface px-3">
            <option value="OFFER_RELEASED">released</option>
            <option value="OFFER_ACCEPTED">accepted</option>
          </select>
        </label>
        {(["maxHeldOffers", "upliftPct", "minResponseHours"] as const).map((key) => (
          <label key={key} className="grid gap-1 text-sm font-semibold text-body">
            {key === "maxHeldOffers" ? "Maximum held offers" : key === "upliftPct" ? "Offer uplift %" : "Minimum response hours"}
            <input type="number" min={TPO_RULE_LIMITS[key].min} max={TPO_RULE_LIMITS[key].max} step={1}
              value={form[key]} disabled={busy}
              onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              className="min-h-10 rounded-md border border-border bg-surface px-3" />
          </label>
        ))}
      </div>
      <section role="status" className="mt-4 rounded-lg border border-border bg-surface-subtle p-3 text-sm text-body">
        <p>A student may hold {Number.isFinite(held)?held:0} offers (released or accepted) before the next rule applies.</p>
        <p className="mt-1">After that, another offer needs a CTC at least {form.upliftPct}% higher than their best offer, or a Dream drive. Internships never count.</p>
        <p className="mt-2 font-semibold">For example</p>
        <p>A student holding a 5 LPA offer can take another only if it is at least {nextLpa} LPA, or from a Dream drive.</p>
      </section>
      <button type="button" disabled={busy} onClick={() => void save()}
        className="mt-4 min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60">
        {busy ? "Saving..." : "Review and confirm rules"}
      </button>
      {error ? <p role="alert" className="mt-2 text-sm text-error">{error}</p> : null}
    </section>
  );
}
