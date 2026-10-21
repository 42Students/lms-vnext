"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {InlineNotice} from "@/components/ui/inline-notice";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {TPO_SEASON_CREATE_REVIEW_COPY} from "@/modules/placements/tpo-season-write-model";

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
  const [reviewOpen, setReviewOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = seasons.some((season) => season.status === "ACTIVE");
  function select(season: Season | null) {
    setEdit(season);
    setForm(season ? { name: season.name, code: season.code,
      startDate: season.startDate, endDate: season.endDate } : empty);
    setError(null);
    setAcknowledged(false);
  }
  async function save() {
    if (busy) return;
    if (!form.name.trim() || !form.code.trim() || !form.startDate ||
      !form.endDate || form.endDate < form.startDate) {
      setError("Complete the name, code and chronological date range.");
      return;
    }
    if (!reviewOpen) {setAcknowledged(false); setReviewOpen(true); return;}
    if(!edit&&!acknowledged){setError("Confirm that season activation does not open learner registration.");return;}
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
      setReviewOpen(false);
      select(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Season change failed.");
    } finally { setBusy(false); }
  }
  return (
    <section className="min-w-0 space-y-4 border-b border-border pb-5">
      <h3 className="text-base font-semibold text-foreground">
        {edit ? "Edit active season" : "Start new season"}
      </h3>
      {active && !edit ? (
        <Alert tone="warning">An active season already exists. Close that season through the existing lifecycle workflow before creating another one.</Alert>
      ) : (
        <>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {(["name", "code", "startDate", "endDate"] as const).map((key) => (
              <label key={key} className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
                {key === "startDate" ? "Start date" : key === "endDate" ? "End date" : key === "name" ? "Season name" : "Season code"}
                <Input type={key.endsWith("Date") ? "date" : "text"}
                  value={form[key]} disabled={busy}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  className="min-h-11 w-full min-w-0 md:min-h-9"
                  required />
              </label>
            ))}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{TPO_SEASON_CREATE_REVIEW_COPY.unavailable}</p>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" onClick={() => void save()} disabled={busy}
              className="min-h-11 w-full sm:w-auto md:min-h-9">
              {busy ? "Saving..." : edit ? "Review and confirm edit" : "Review and confirm new season"}
            </Button>
            {edit ? <Button type="button" variant="secondary" disabled={busy} onClick={() => select(null)}
              className="min-h-11 w-full sm:w-auto md:min-h-9">Cancel edit</Button> : null}
          </div>
        </>
      )}
      {seasons.filter((season) => season.status === "ACTIVE").map((season) => (
        <div className="flex min-w-0 flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between" key={season.id}>
         <p className="min-w-0 break-words text-sm font-semibold">{season.name}</p>
         <Button type="button" variant="secondary" disabled={busy} onClick={() => select(season)}
          className="min-h-11 w-full sm:w-auto md:min-h-9 text-sm">
          Edit {season.name} →
         </Button>
        </div>
      ))}
      {error && !reviewOpen ? <InlineNotice tone="error" message={error}/> : null}
      <ConfirmDialog open={reviewOpen} onOpenChange={setReviewOpen}
        title={edit ? "Confirm active season change?" : "Create and activate placement season?"}
        description={edit
          ? "Confirm change to this active season? Existing registration deadlines are not updated."
          : "Create and activate this placement season? This does not open learner registration."}
        confirmLabel={edit ? "Confirm edit" : "Activate season"}
        confirmVariant="primary" pending={busy} onConfirm={() => void save()}>
        <dl className="min-w-0 space-y-2 text-sm">
         <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"><dt>Season name</dt><dd className="break-words font-semibold">{form.name}</dd></div>
         <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"><dt>Season code</dt><dd className="break-words">{form.code}</dd></div>
         <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"><dt>Dates</dt><dd className="break-words">{form.startDate} – {form.endDate}</dd></div>
        </dl>
        {!edit ? <label className="mt-3 flex items-start gap-2 text-sm text-body">
          <input type="checkbox" checked={acknowledged} disabled={busy}
            onChange={event=>{setAcknowledged(event.currentTarget.checked);setError(null);}}
            className="mt-1 size-4 shrink-0" />
          <span>{TPO_SEASON_CREATE_REVIEW_COPY.confirm}</span>
        </label>:null}
        {error ? <InlineNotice tone="error" message={error} /> : null}
      </ConfirmDialog>
    </section>
  );
}
