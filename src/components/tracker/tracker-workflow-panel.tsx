"use client";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { useEffect, useRef, useState, useTransition } from "react";
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
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";

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
  const mutationLock = useRef(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
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
    // A successful mutation may invalidate the original optimistic version.
    // Unlock only after fresh server props have arrived.
    setNeedsRefresh(false);
  }, [issue.publicId, issue.version, issue.status, issue.resolution, issue.affectedLayer,
      issue.rootCause, issue.fixNotes, issue.frontendCommitSha, issue.backendCommitSha,
      issue.regressionTestStatus, issue.productionVerified]);
  function startExclusiveMutation(task: () => Promise<void>) {
    if (pending || needsRefresh || mutationLock.current) return false;
    mutationLock.current = true;
    startTransition(async () => {
      try { await task(); } finally { mutationLock.current = false; }
    });
    return true;
  }
  function changeStatus(nextStatus: string) {
    if (pending || needsRefresh || mutationLock.current || !canManage || nextStatus === status) return;
    setStatus(nextStatus);
    startExclusiveMutation(async () => {
      try {
        const response = await apiFetch<{issue:{status:string;resolution:string|null}}>(
          "/api/tracker/issues/" + encodeURIComponent(issue.publicId) + "/workflow", {
            method: "PATCH", headers: {"content-type":"application/json"},
            body: JSON.stringify({expectedVersion:issue.version,status:nextStatus}),
          });
        setStatus(response.issue.status);
        setResolution(response.issue.resolution ?? "");
        showToast({tone:"success",title:issue.publicId+" moved to "+response.issue.status});
        setNeedsRefresh(true);
        router.refresh();
      } catch (reason) {
        setStatus(issue.status);
        showToast({tone:"error",title:reason instanceof FriendlyFetchError && reason.status===409 ?
          "Issue changed elsewhere" : "Could not update issue status.",
          description:reason instanceof Error ? reason.message : friendlyApiError({})});
        if (!(reason instanceof FriendlyFetchError) || reason.status===409 || reason.status>=500) {
          setNeedsRefresh(true);
          router.refresh();
        }
      }
    });
  }

  function save() {
    if(pending||needsRefresh||mutationLock.current)return;
    startExclusiveMutation(async () => {
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
        setNeedsRefresh(true);
        router.refresh();
      }catch(reason){
        showToast({tone:"error",title:reason instanceof FriendlyFetchError&&reason.status===409?"Issue changed elsewhere":"Engineering details could not be saved.",
          description:reason instanceof Error?reason.message:friendlyApiError({})});
        if(!(reason instanceof FriendlyFetchError)||reason.status===409||reason.status>=500){
          setNeedsRefresh(true);
          router.refresh();
        }
      }
    });
  }

  function retest(result:"PASS"|"FAIL"){
    if(pending||needsRefresh||mutationLock.current)return;
    startExclusiveMutation(async()=>{
      try{
        await apiFetch(`/api/tracker/issues/${encodeURIComponent(issue.publicId)}/retest`,{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({expectedVersion:issue.version,result,note:retestNote||null}),
        });
        showToast({tone:"success",title:result==="PASS"?"Retest passed — issue closed":"Retest failed — issue reopened"});
        setNeedsRefresh(true);
        router.refresh();
      }catch(reason){
        showToast({tone:"error",title:reason instanceof FriendlyFetchError&&reason.status===409?"Issue changed elsewhere":"Retest result could not be saved.",
          description:reason instanceof Error?reason.message:friendlyApiError({})});
        if(!(reason instanceof FriendlyFetchError)||reason.status===409||reason.status>=500){
          setNeedsRefresh(true);
          router.refresh();
        }
      }
    });
  }

  if (!canManage) return <section className="space-y-2 border-b border-border pb-4"><Heading level={2}>Issue status</Heading><StatusBadge>{issue.status}</StatusBadge><p className="text-xs text-muted-foreground">Status is read-only for this viewer.</p></section>;
  return (
    <section className="min-w-0 space-y-4 border-b border-border pb-5 [overflow-wrap:anywhere]">
      <div>
        <Heading level={2} size="lg" className="m-0 text-foreground">Issue status</Heading>
        <p className="mt-1 text-sm text-body">Super Admin only. Status changes save immediately; engineering details are saved separately. Version {issue.version}; stale writes are rejected.</p>
        {needsRefresh?<p role="status" className="mt-2 text-sm text-body">Saved or updated elsewhere. Refresh the issue before making another change. <Button type="button" variant="secondary" onClick={()=>router.refresh()} className="ml-2 min-h-11 md:min-h-9">Refresh issue</Button></p>:null}
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Label stack className="min-w-0">
          Status
          <Select className="w-full min-w-0" disabled={pending||needsRefresh} value={status} onChange={(e) => changeStatus(e.target.value)}>
            {BUG_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
          {pending ? <span role="status" className="text-xs text-muted-foreground">Updating status…</span> : null}
        </Label>
      </div>
      <Disclosure title="Engineering details" className="min-w-0">
        <p className="mb-4 text-sm text-body">Root cause, fix commits, regression coverage and production verification</p>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Label stack className="min-w-0">
          Resolution
          <Select className="w-full min-w-0" disabled={pending||needsRefresh} value={resolution} onChange={(e) => setResolution(e.target.value)}>
            <option value="">No resolution</option>
            {BUG_RESOLUTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </Label>
        <Label stack className="min-w-0">
          Affected layer
          <Select className="w-full min-w-0" disabled={pending||needsRefresh} value={affectedLayer} onChange={(e) => setAffectedLayer(e.target.value)}>
            <option value="">Not set</option>
            {BUG_AFFECTED_LAYERS.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </Label>
        <Label stack className="min-w-0">
          Regression test
          <Select className="w-full min-w-0" disabled={pending||needsRefresh} value={regressionTestStatus} onChange={(e) => setRegressionTestStatus(e.target.value)}>
            {BUG_REGRESSION_TEST_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </Label>
        <Disclosure title="Commit evidence" className="min-w-0 sm:col-span-2">
          <div className="grid min-w-0 gap-4 pt-2 sm:grid-cols-2">
        <Label className="min-w-0 sm:col-span-2">
          Root cause
          <Textarea className="mt-[6px] w-full min-w-0" value={rootCause} maxLength={4000} onChange={(e) => setRootCause(e.target.value)} />
        </Label>
        <Label className="min-w-0 sm:col-span-2">
          Fix notes
          <Textarea className="mt-[6px] w-full min-w-0" value={fixNotes} maxLength={4000} onChange={(e) => setFixNotes(e.target.value)} />
        </Label>
        <div className="min-w-0 text-sm font-semibold text-body">
          <Label htmlFor="tracker-workflow-frontend-sha">Frontend commit SHA</Label>
          <Input id="tracker-workflow-frontend-sha" className="mt-[6px] min-w-0 w-full" value={frontendCommitSha} maxLength={64} onChange={(e) => setFrontendCommitSha(e.target.value)} />
          {frontendCommitSha.trim().length >= 7 && !/^[a-f0-9]{7,40}$/i.test(frontendCommitSha.trim()) ?
            <p role="status" className="mt-1 text-xs font-normal text-muted-foreground">Enter 7–40 hexadecimal SHA characters to enable the commit link.</p> : null}
          {/^[a-f0-9]{7,40}$/i.test(frontendCommitSha.trim())?<TextLink href={"https://github.com/42Students/lms2-fe/commit/"+frontendCommitSha.trim()}
            rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center md:min-h-9">View on GitHub ↗</TextLink>:null}
        </div>
        <div className="min-w-0 text-sm font-semibold text-body">
          <Label htmlFor="tracker-workflow-backend-sha">Backend commit SHA</Label>
          <Input id="tracker-workflow-backend-sha" className="mt-[6px] min-w-0 w-full" value={backendCommitSha} maxLength={64} onChange={(e) => setBackendCommitSha(e.target.value)} />
          {backendCommitSha.trim().length >= 7 && !/^[a-f0-9]{7,40}$/i.test(backendCommitSha.trim()) ?
            <p role="status" className="mt-1 text-xs font-normal text-muted-foreground">Enter 7–40 hexadecimal SHA characters to enable the commit link.</p> : null}
          {/^[a-f0-9]{7,40}$/i.test(backendCommitSha.trim())?<TextLink href={"https://github.com/42Students/lms/commit/"+backendCommitSha.trim()}
            rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center md:min-h-9">View on GitHub ↗</TextLink>:null}
        </div>
          </div>
        </Disclosure>
        <Label className="flex min-h-11 min-w-0 items-center gap-3 md:min-h-9">
          <Checkbox checked={productionVerified} disabled={pending||needsRefresh}
            onChange={(e) => setProductionVerified(e.target.checked)} />
          Production verified
        </Label>
      </div>
        <Button disabled={pending||needsRefresh} loading={pending} onClick={save} className="mt-4 min-h-11 w-full sm:w-auto md:min-h-9">
          {pending ? "Saving…" : "Save details"}
        </Button>
      </Disclosure>

      {issue.status === "READY_FOR_RETEST" ? (
        <div className="space-y-3 border-t border-border pt-4">
          <Heading level={3} size="base" className="m-0 text-foreground">Ready for retest</Heading>
          <p className="text-sm font-semibold text-body">Does it work now?</p>
          <p className="text-sm text-body">Check the same flow once more. One click sends it back to engineering or closes it.</p>
          <Label stack className="min-w-0">Retest notes (optional)
            <Textarea className="w-full min-w-0" value={retestNote} disabled={pending||needsRefresh} maxLength={1000} placeholder="What did you observe?" onChange={(e) => setRetestNote(e.target.value)} />
          </Label>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button variant="danger" disabled={pending||needsRefresh} loading={pending} onClick={() => retest("FAIL")} className="min-h-11 w-full md:min-h-9 md:w-auto">Still broken</Button>
            <Button disabled={pending||needsRefresh} loading={pending} onClick={() => retest("PASS")} className="min-h-11 w-full md:min-h-9 md:w-auto">Works now</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
