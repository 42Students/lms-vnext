"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

type Season = {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: string;
  updatedAt: string;
};
type FormValue = Pick<Season, "name" | "code" | "startDate" | "endDate">;
const empty: FormValue = { name: "", code: "", startDate: "", endDate: "" };

export function TpoSeasonControls({ seasons }: { seasons: readonly Season[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<Season | null>(null);
  const [form, setForm] = useState<FormValue>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = seasons.some((season) => season.status === "ACTIVE");
  function select(season: Season | null) {
    setEdit(season);
    setForm(season ? { name: season.name, code: season.code,
      startDate: season.startDate, endDate: season.endDate } : empty);
    setError(null);
  }
  async function save() {
    if (busy) return;
    if (!form.name.trim() || !form.code.trim() || !form.startDate ||
      !form.endDate || form.endDate < form.startDate) {
      setError("Complete the name, code and chronological date range.");
      return;
    }
    if (!window.confirm(
      edit
        ? "Confirm change to this active season? Existing registration deadlines are not updated."
        : "Create and activate this placement season? This does not open learner registration.",
    )) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/placements/tpo/settings/season", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: edit ? "EDIT" : "CREATE", ...form,
          ...(edit ? { seasonId: edit.id, expectedUpdatedAt: edit.updatedAt } : {}),
          confirmed: true,
        }),
      });
      if (!response.ok) throw new Error("Season change failed. The current values may be stale; refresh and review.");
      select(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Season change failed.");
    } finally { setBusy(false); }
  }
  return (
    <section className="space-y-4 border-b border-border pb-6">
      <h3 className="text-base font-semibold text-foreground">
        {edit ? "Edit active season" : "Start new season"}
      </h3>
      {active && !edit ? (
        <p role="status" className="text-sm text-body">
          An active season already exists. Close that season through the existing
          lifecycle workflow before creating another one.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["name", "code", "startDate", "endDate"] as const).map((key) => (
              <label key={key} className="grid gap-1 text-sm font-semibold text-body">
                {key === "startDate" ? "Start date" : key === "endDate" ? "End date" : key === "name" ? "Season name" : "Season code"}
                <Input type={key.endsWith("Date") ? "date" : "text"}
                  value={form[key]} disabled={busy}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  className="min-h-11 md:min-h-9"
                  required />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void save()} disabled={busy}
              className="min-h-11 md:min-h-9">
              {busy ? "Saving..." : edit ? "Review and confirm edit" : "Review and confirm new season"}
            </Button>
            {edit ? <Button type="button" variant="secondary" onClick={() => select(null)}
              className="min-h-11 md:min-h-9">Cancel edit</Button> : null}
          </div>
        </>
      )}
      {seasons.filter((season) => season.status === "ACTIVE").map((season) => (
        <Button type="button" variant="ghost" key={season.id} onClick={() => select(season)}
          className="min-h-11 md:min-h-9 text-sm underline">
          Edit {season.name} →
        </Button>
      ))}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </section>
  );
}
