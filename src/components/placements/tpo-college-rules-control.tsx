"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    if (!Number.isInteger(values.maxHeldOffers) || values.maxHeldOffers < 1 ||
      !Number.isInteger(values.upliftPct) || values.upliftPct < 0 ||
      !Number.isInteger(values.minResponseHours) || values.minResponseHours < 1) {
      setError("Enter valid positive whole-number settings.");
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
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save rules.");
    } finally { setBusy(false); }
  }
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-base font-semibold text-foreground">Edit college offer rules</h3>
      <p className="mt-2 text-sm text-body">
        Save requires confirmation and rejects stale rule versions. Registration
        deadlines and learner consent are not modified.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-body">
          Count as placed when
          <select value={form.countsAsPlacedAt} disabled={busy}
            onChange={(event) => setForm((current) => ({ ...current, countsAsPlacedAt: event.target.value }))}
            className="min-h-10 rounded-md border border-border bg-surface px-3">
            <option value="SELECTED">Selected</option>
            <option value="OFFER_RELEASED">Offer released</option>
            <option value="OFFER_ACCEPTED">Offer accepted</option>
          </select>
        </label>
        {(["maxHeldOffers", "upliftPct", "minResponseHours"] as const).map((key) => (
          <label key={key} className="grid gap-1 text-sm font-semibold text-body">
            {key === "maxHeldOffers" ? "Maximum held offers" : key === "upliftPct" ? "Offer uplift %" : "Minimum response hours"}
            <input type="number" min={key === "upliftPct" ? 0 : 1}
              value={form[key]} disabled={busy}
              onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              className="min-h-10 rounded-md border border-border bg-surface px-3" />
          </label>
        ))}
      </div>
      <button type="button" disabled={busy} onClick={() => void save()}
        className="mt-4 min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60">
        {busy ? "Saving..." : "Review and confirm rules"}
      </button>
      {error ? <p role="alert" className="mt-2 text-sm text-error">{error}</p> : null}
    </section>
  );
}
