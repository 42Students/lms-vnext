"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-fetch";
type Drive = {id: string; title: string; status: string; companyName: string};
type Preview = {eligible: number; ignored: number; excluded: number; pendingLettersWithdrawn: number};
type Result = {updated: number; skipped: number;
  results: {jobId: string; status: "UPDATED" | "SKIPPED"; reason: string}[]};

export function SuperAdminBulkDriveActions({drives}: {drives: Drive[]}) {
  const router = useRouter();
  const [action, setAction] = useState<"OPEN" | "CLOSE">("CLOSE");
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const eligible = drives.filter(d => action === "CLOSE"
    ? d.status === "PUBLISHED" : d.status === "CLOSED");
  function toggle(id: string) {
    setSelected(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
    setPreview(null); setResult(null);
  }
  async function send(confirm: boolean) {
    if (busy || !selected.length || selected.length > 25) return;
    setBusy(true); setError("");
    try {
      const payload = await apiFetch<Preview | Result>("/api/admin/placements/drives/bulk", {
        method: "POST", headers: {"content-type": "application/json"},
        body: JSON.stringify({action, jobIds: selected,
          ...(confirm ? {confirmed: true} : {confirmStage: "PREVIEW"})}),
      });
      if (confirm) {
        const response = payload as Result;
        setResult(response); setPreview(null);
        setSelected(response.results.filter(r => r.status === "SKIPPED").map(r => r.jobId));
        router.refresh();
      } else {setPreview(payload as Preview); setResult(null);}
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update drives. Please try again.");
    } finally {setBusy(false);}
  }
  return <section className="space-y-3 rounded-xl border border-border bg-surface p-4"
    aria-label="Super Admin bulk drive actions">
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="font-semibold">Bulk Open / Close</h2>
      <label className="flex min-h-10 items-center gap-2 text-sm">
        <input type="checkbox" disabled={busy || !eligible.length}
          checked={eligible.length>0 && eligible.every(d=>selected.includes(d.id))}
          onChange={e=>{setSelected(e.target.checked?eligible.slice(0,25).map(d=>d.id):[]);
            setPreview(null);setResult(null);}}/>
        Select eligible on this page ({eligible.length})
      </label>
      <label className="flex items-center gap-2 text-sm">Action
        <select value={action} aria-label="Bulk action" onChange={e=>{
          setAction(e.target.value as "OPEN" | "CLOSE");setSelected([]);
          setPreview(null);setResult(null);}}
          className="min-h-10 rounded border border-border bg-surface p-2">
          <option value="CLOSE">Close selected</option>
          <option value="OPEN">Open closed drives</option>
        </select>
      </label>
      <button type="button" disabled={busy || !selected.length || selected.length>25}
        onClick={()=>void send(false)}
        className="min-h-10 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
        Preview {selected.length} drive(s)
      </button>
    </div>
    <div className="grid max-h-48 gap-2 overflow-auto sm:grid-cols-2 xl:grid-cols-4">
      {eligible.map(d=><label key={d.id} className="flex gap-2 rounded border border-border p-2 text-xs">
        <input type="checkbox" disabled={busy} checked={selected.includes(d.id)}
          onChange={()=>toggle(d.id)}/>
        <span><strong>{d.title}</strong><span className="block text-muted-foreground">
          {d.companyName} · {d.status}</span></span>
      </label>)}
    </div>
    <p className="text-xs text-muted-foreground">
      Opening applies to closed drives only; draft publication requires the workspace preflight.
      Affected issued offers may be withdrawn when closing. Historical decisions remain.
    </p>
    {preview?<div role="group" aria-label="Bulk action impact"
      className="space-y-2 rounded border border-border p-3 text-sm">
      <p>{preview.eligible} eligible, {preview.ignored+preview.excluded} skipped.</p>
      <p>{action==="CLOSE"?
        `${preview.pendingLettersWithdrawn} issued offers may be withdrawn when these drives close.`:
        "Previously withdrawn offers will not be reissued."}</p>
      <button type="button" disabled={busy || !preview.eligible} onClick={()=>{
        if(window.confirm("Confirm "+action.toLowerCase()+" for "+preview.eligible+" drives?"))
          void send(true);
      }} className="min-h-10 rounded bg-primary px-3 font-semibold text-on-primary disabled:opacity-50">
        Confirm {action.toLowerCase()}
      </button>
      <button type="button" disabled={busy} onClick={()=>setPreview(null)}
        className="ml-2 min-h-10 rounded border border-border px-3">Cancel</button>
    </div>:null}
    {result?<div role="status" className="space-y-2 text-sm">
      <p>{result.updated} updated, {result.skipped} failed. Retry will target only failed drives.</p>
      {result.results.filter(x=>x.status==="SKIPPED").map(x=>
        <p key={x.jobId}>{drives.find(d=>d.id===x.jobId)?.title??"Drive"}: {x.reason}</p>)}
      {result.skipped>0?<button type="button" onClick={()=>void send(false)}
        className="min-h-10 font-semibold text-primary-text underline">Preview failed drives for retry</button>:null}
    </div>:null}
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  </section>;
}
