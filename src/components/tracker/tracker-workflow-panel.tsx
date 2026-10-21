"use client";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { useEffect, useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useRouter } from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  BUG_AFFECTED_LAYERS,
  BUG_REGRESSION_TEST_STATUSES,
  BUG_RESOLUTIONS,
  BUG_STATUSES,
} from "@/modules/bug-tracker/workflow";

export type TrackerWorkflowIssue = {
  publicId: string;
  version: number;
  status: string;
  resolution: string | null;
  affectedLayer: string | null;
  rootCause: string | null;
  fixNotes: string | null;
  frontendCommitSha: string | null;
  backendCommitSha: string | null;
  regressionTestStatus: string;
  productionVerified: boolean;
  retestStatus: string;
};

export function TrackerWorkflowPanel({ issue, canManage = true }: { issue: TrackerWorkflowIssue; canManage?: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(issue.status);
  const [resolution, setResolution] = useState(issue.resolution ?? "");
  const [affectedLayer, setAffectedLayer] = useState(issue.affectedLayer ?? "");
  const [rootCause, setRootCause] = useState(issue.rootCause ?? "");
  const [fixNotes, setFixNotes] = useState(issue.fixNotes ?? "");
  const [frontendCommitSha, setFrontendCommitSha] = useState(issue.frontendCommitSha ?? "");
  const [backendCommitSha, setBackendCommitSha] = useState(issue.backendCommitSha ?? "");
  const [regressionTestStatus, setRegressionTestStatus] = useState(issue.regressionTestStatus);
  const [productionVerified, setProductionVerified] = useState(issue.productionVerified);
  const [retestNote, setRetestNote] = useState("");
  useEffect(() => {
    setStatus(issue.status); setResolution(issue.resolution ?? "");
    setAffectedLayer(issue.affectedLayer ?? ""); setRootCause(issue.rootCause ?? "");
    setFixNotes(issue.fixNotes ?? ""); setFrontendCommitSha(issue.frontendCommitSha ?? "");
    setBackendCommitSha(issue.backendCommitSha ?? "");
    setRegressionTestStatus(issue.regressionTestStatus);
    setProductionVerified(issue.productionVerified); setRetestNote("");
  }, [issue.publicId, issue.version, issue.status, issue.resolution, issue.affectedLayer,
      issue.rootCause, issue.fixNotes, issue.frontendCommitSha, issue.backendCommitSha,
      issue.regressionTestStatus, issue.productionVerified]);
  function changeStatus(nextStatus: string) {
    if (pending || !canManage || nextStatus === status) return;
    setStatus(nextStatus);
    startTransition(async () => {
      try {
        const response = await apiFetch<{issue:{status:string;resolution:string|null}}>(
          "/api/tracker/issues/" + encodeURIComponent(issue.publicId) + "/workflow", {
            method: "PATCH", headers: {"content-type":"application/json"},
            body: JSON.stringify({expectedVersion:issue.version,status:nextStatus}),
          });
        setStatus(response.issue.status);
        setResolution(response.issue.resolution ?? "");
        showToast({tone:"success",title:issue.publicId+" moved to "+response.issue.status});
        router.refresh();
      } catch (reason) {
        setStatus(issue.status);
        showToast({tone:"error",title:reason instanceof FriendlyFetchError && reason.status===409 ?
          "Issue changed elsewhere" : "Could not update issue status.",
          description:reason instanceof Error ? reason.message : friendlyApiError({})});
        if (reason instanceof FriendlyFetchError && reason.status===409) router.refresh();
      }
    });
  }

  function save() {
    if(pending)return;
    startTransition(async () => {
      try {
        await apiFetch(`/api/tracker/issues/${encodeURIComponent(issue.publicId)}/workflow`,{
          method:"PATCH",headers:{"content-type":"application/json"},
          body:JSON.stringify({
            expectedVersion:issue.version,resolution,
            affectedLayer:affectedLayer||null,rootCause,fixNotes,
            frontendCommitSha,backendCommitSha,regressionTestStatus,productionVerified,
          }),
        });
        showToast({tone:"success",title:"Engineering details saved"});
        router.refresh();
      }catch(reason){
        showToast({tone:"error",title:reason instanceof FriendlyFetchError&&reason.status===409?"Issue changed elsewhere":"Engineering details could not be saved.",
          description:reason instanceof Error?reason.message:friendlyApiError({})});
      }
    });
  }

  function retest(result:"PASS"|"FAIL"){
    if(pending)return;
    startTransition(async()=>{
      try{
        await apiFetch(`/api/tracker/issues/${encodeURIComponent(issue.publicId)}/retest`,{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({expectedVersion:issue.version,result,note:retestNote||null}),
        });
        showToast({tone:"success",title:result==="PASS"?"Retest passed — issue closed":"Retest failed — issue reopened"});
        router.refresh();
      }catch(reason){
        showToast({tone:"error",title:reason instanceof FriendlyFetchError&&reason.status===409?"Issue changed elsewhere":"Retest result could not be saved.",
          description:reason instanceof Error?reason.message:friendlyApiError({})});
      }
    });
  }

  if (!canManage) return <section className="space-y-2 border-b border-border pb-4"><h2 className="font-semibold">Issue status</h2><StatusBadge>{issue.status}</StatusBadge><p className="text-xs text-muted-foreground">Status is read-only for this viewer.</p></section>;
  return (
    <section className="min-w-0 space-y-4 border-b border-border pb-5 [overflow-wrap:anywhere]">
      <div>
        <h2 className="m-0 text-lg font-semibold text-foreground">Issue status</h2>
        <p className="mt-1 text-sm text-body">Super Admin only. Version {issue.version}; stale writes are rejected.</p>
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="grid min-w-0 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Status
          <Select className="w-full min-w-0" disabled={pending} value={status} onChange={(e) => changeStatus(e.target.value)}>
            {BUG_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
          {pending ? <span role="status" className="text-xs text-muted-foreground">Updating status…</span> : null}
        </label>
      </div>
      <details className="min-w-0 border-t border-border pt-3">
        <summary className="min-h-11 cursor-pointer text-base font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Engineering details</summary>
        <p className="mb-4 text-sm text-body">Root cause, fix commits, regression coverage and production verification</p>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="grid min-w-0 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Resolution
          <Select className="w-full min-w-0" value={resolution} onChange={(e) => setResolution(e.target.value)}>
            <option value="">No resolution</option>
            {BUG_RESOLUTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Affected layer
          <Select className="w-full min-w-0" value={affectedLayer} onChange={(e) => setAffectedLayer(e.target.value)}>
            <option value="">Not set</option>
            {BUG_AFFECTED_LAYERS.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Regression test
          <Select className="w-full min-w-0" value={regressionTestStatus} onChange={(e) => setRegressionTestStatus(e.target.value)}>
            {BUG_REGRESSION_TEST_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
        <details className="min-w-0 sm:col-span-2">
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Commit evidence</summary>
          <div className="grid min-w-0 gap-4 pt-2 sm:grid-cols-2">
        <label className="min-w-0 font-semibold sm:col-span-2 text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Root cause
          <Textarea className="mt-[6px] w-full min-w-0" value={rootCause} maxLength={4000} onChange={(e) => setRootCause(e.target.value)} />
        </label>
        <label className="min-w-0 font-semibold sm:col-span-2 text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Fix notes
          <Textarea className="mt-[6px] w-full min-w-0" value={fixNotes} maxLength={4000} onChange={(e) => setFixNotes(e.target.value)} />
        </label>
        <div className="min-w-0 text-sm font-semibold text-body">
          <label htmlFor="tracker-workflow-frontend-sha">Frontend commit SHA</label>
          <Input id="tracker-workflow-frontend-sha" className="mt-[6px] min-w-0 w-full" value={frontendCommitSha} maxLength={64} onChange={(e) => setFrontendCommitSha(e.target.value)} />
          {frontendCommitSha.trim().length >= 7 && !/^[a-f0-9]{7,40}$/i.test(frontendCommitSha.trim()) ?
            <p role="status" className="mt-1 text-xs font-normal text-muted-foreground">Enter 7–40 hexadecimal SHA characters to enable the commit link.</p> : null}
          {/^[a-f0-9]{7,40}$/i.test(frontendCommitSha.trim())?<a href={"https://github.com/42Students/lms2-fe/commit/"+frontendCommitSha.trim()}
            target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:underline">View on GitHub ↗</a>:null}
        </div>
        <div className="min-w-0 text-sm font-semibold text-body">
          <label htmlFor="tracker-workflow-backend-sha">Backend commit SHA</label>
          <Input id="tracker-workflow-backend-sha" className="mt-[6px] min-w-0 w-full" value={backendCommitSha} maxLength={64} onChange={(e) => setBackendCommitSha(e.target.value)} />
          {backendCommitSha.trim().length >= 7 && !/^[a-f0-9]{7,40}$/i.test(backendCommitSha.trim()) ?
            <p role="status" className="mt-1 text-xs font-normal text-muted-foreground">Enter 7–40 hexadecimal SHA characters to enable the commit link.</p> : null}
          {/^[a-f0-9]{7,40}$/i.test(backendCommitSha.trim())?<a href={"https://github.com/42Students/lms/commit/"+backendCommitSha.trim()}
            target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:underline">View on GitHub ↗</a>:null}
        </div>
          </div>
        </details>
        <label className="flex min-h-11 min-w-0 items-center gap-3 text-sm font-semibold text-body md:min-h-9">
          <Checkbox checked={productionVerified} onChange={(e) => setProductionVerified(e.target.checked)} />
          Production verified
        </label>
      </div>
        <Button disabled={pending} loading={pending} onClick={save} className="mt-4 min-h-11 w-full sm:w-auto md:min-h-9">
          {pending ? "Saving…" : "Save details"}
        </Button>
      </details>

      {issue.status === "READY_FOR_RETEST" ? (
        <div className="space-y-3 border-t border-border pt-4">
          <h3 className="m-0 text-base font-semibold text-foreground">Ready for retest</h3>
          <p className="text-sm font-semibold text-body">Does it work now?</p>
          <p className="text-sm text-body">Check the same flow once more. One click sends it back to engineering or closes it.</p>
          <Textarea className="w-full min-w-0" value={retestNote} maxLength={1000} placeholder="Optional note — what did you observe?" onChange={(e) => setRetestNote(e.target.value)} />
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button variant="danger" disabled={pending} loading={pending} onClick={() => retest("FAIL")} className="min-h-11 w-full md:min-h-9 md:w-auto">Still broken</Button>
            <Button disabled={pending} loading={pending} onClick={() => retest("PASS")} className="min-h-11 w-full md:min-h-9 md:w-auto">Works now</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
