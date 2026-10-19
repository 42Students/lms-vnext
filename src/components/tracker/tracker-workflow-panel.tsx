"use client";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { useState, useTransition } from "react";
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

export function TrackerWorkflowPanel({ issue }: { issue: TrackerWorkflowIssue }) {
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

  function save() {
    if(pending)return;
    startTransition(async () => {
      try {
        await apiFetch(`/api/tracker/issues/${encodeURIComponent(issue.publicId)}/workflow`,{
          method:"PATCH",headers:{"content-type":"application/json"},
          body:JSON.stringify({
            expectedVersion:issue.version,status,resolution,
            affectedLayer:affectedLayer||null,rootCause,fixNotes,
            frontendCommitSha,backendCommitSha,regressionTestStatus,productionVerified,
          }),
        });
        showToast({tone:"success",title:"Engineering details saved"});
        router.refresh();
      }catch(reason){
        showToast({tone:"error",title:reason instanceof FriendlyFetchError&&reason.status===409?"Issue changed elsewhere":"Tracker update failed",
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
        showToast({tone:"error",title:reason instanceof FriendlyFetchError&&reason.status===409?"Issue changed elsewhere":"Retest could not be recorded",
          description:reason instanceof Error?reason.message:friendlyApiError({})});
      }
    });
  }

  return (
    <section className="space-y-4 border-b border-border pb-5">
      <div>
        <h2 className="m-0 text-lg font-semibold text-foreground">Engineering workflow</h2>
        <p className="mt-1 text-sm text-body">Super Admin only. Version {issue.version}; stale writes are rejected.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-body">
          Status
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {BUG_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
        <label className="text-sm font-semibold text-body">
          Resolution
          <Select value={resolution} onChange={(e) => setResolution(e.target.value)}>
            <option value="">No resolution</option>
            {BUG_RESOLUTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
        <label className="text-sm font-semibold text-body">
          Affected layer
          <Select value={affectedLayer} onChange={(e) => setAffectedLayer(e.target.value)}>
            <option value="">Not set</option>
            {BUG_AFFECTED_LAYERS.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
        <label className="text-sm font-semibold text-body">
          Regression test
          <Select value={regressionTestStatus} onChange={(e) => setRegressionTestStatus(e.target.value)}>
            {BUG_REGRESSION_TEST_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
        <label className="md:col-span-2 text-sm font-semibold text-body">
          Root cause
          <Textarea className="mt-1" value={rootCause} maxLength={4000} onChange={(e) => setRootCause(e.target.value)} />
        </label>
        <label className="md:col-span-2 text-sm font-semibold text-body">
          Fix notes
          <Textarea className="mt-1" value={fixNotes} maxLength={4000} onChange={(e) => setFixNotes(e.target.value)} />
        </label>
        <label className="text-sm font-semibold text-body">
          Frontend commit SHA
          <Input className="mt-1" value={frontendCommitSha} maxLength={64} onChange={(e) => setFrontendCommitSha(e.target.value)} />
          {/^[a-f0-9]{7,40}$/i.test(frontendCommitSha.trim())?<a href={"https://github.com/42Students/lms2-fe/commit/"+frontendCommitSha.trim()}
            target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">View on GitHub ↗</a>:null}
        </label>
        <label className="text-sm font-semibold text-body">
          Backend commit SHA
          <Input className="mt-1" value={backendCommitSha} maxLength={64} onChange={(e) => setBackendCommitSha(e.target.value)} />
          {/^[a-f0-9]{7,40}$/i.test(backendCommitSha.trim())?<a href={"https://github.com/42Students/lms/commit/"+backendCommitSha.trim()}
            target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">View on GitHub ↗</a>:null}
        </label>
        <label className="flex min-h-9 items-center gap-3 text-sm font-semibold text-body">
          <Checkbox checked={productionVerified} onChange={(e) => setProductionVerified(e.target.checked)} />
          Production verified
        </label>
      </div>
      <Button disabled={pending} onClick={save}>
        {pending ? "Saving…" : "Save workflow"}
      </Button>

      {issue.status === "READY_FOR_RETEST" ? (
        <div className="space-y-3 border-t border-border pt-4">
          <h3 className="m-0 text-base font-semibold text-foreground">Ready for retest</h3>
          <p className="text-sm font-semibold text-body">Does it work now?</p>
          <p className="text-sm text-body">Check the same flow once more. One click sends it back to engineering or closes it.</p>
          <Textarea value={retestNote} maxLength={1000} placeholder="Optional retest note" onChange={(e) => setRetestNote(e.target.value)} />
          <div className="flex gap-2">
            <Button disabled={pending} onClick={() => retest("PASS")}>Works now</Button>
            <Button variant="danger" disabled={pending} onClick={() => retest("FAIL")}>Still broken</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
