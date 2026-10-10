"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
    startTransition(async () => {
      const response = await fetch(
        `/api/tracker/issues/${encodeURIComponent(issue.publicId)}/workflow`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            expectedVersion: issue.version,
            status,
            resolution,
            affectedLayer: affectedLayer || null,
            rootCause,
            fixNotes,
            frontendCommitSha,
            backendCommitSha,
            regressionTestStatus,
            productionVerified,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        showToast({
          tone: "error",
          title: response.status === 409 ? "Issue changed elsewhere" : "Tracker update failed",
          description: response.status === 409
            ? "Refresh the issue before applying your changes."
            : payload?.error ?? "The workflow could not be updated.",
        });
        return;
      }
      showToast({ tone: "success", title: "Tracker issue updated" });
      router.refresh();
    });
  }

  function retest(result: "PASS" | "FAIL") {
    startTransition(async () => {
      const response = await fetch(
        `/api/tracker/issues/${encodeURIComponent(issue.publicId)}/retest`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            expectedVersion: issue.version,
            result,
            note: retestNote || null,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        showToast({
          tone: "error",
          title: response.status === 409 ? "Issue changed elsewhere" : "Retest failed",
          description: payload?.error ?? "Refresh and try again.",
        });
        return;
      }
      showToast({ tone: "success", title: `Retest recorded: ${result}` });
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div>
        <h2 className="m-0 text-lg font-semibold text-foreground">Engineering workflow</h2>
        <p className="mt-1 text-sm text-body">Super Admin only. Version {issue.version}; stale writes are rejected.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-body">
          Status
          <select className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3" value={status} onChange={(e) => setStatus(e.target.value)}>
            {BUG_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-body">
          Resolution
          <select className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3" value={resolution} onChange={(e) => setResolution(e.target.value)}>
            <option value="">No resolution</option>
            {BUG_RESOLUTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-body">
          Affected layer
          <select className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3" value={affectedLayer} onChange={(e) => setAffectedLayer(e.target.value)}>
            <option value="">Not set</option>
            {BUG_AFFECTED_LAYERS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-body">
          Regression test
          <select className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3" value={regressionTestStatus} onChange={(e) => setRegressionTestStatus(e.target.value)}>
            {BUG_REGRESSION_TEST_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
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
        </label>
        <label className="text-sm font-semibold text-body">
          Backend commit SHA
          <Input className="mt-1" value={backendCommitSha} maxLength={64} onChange={(e) => setBackendCommitSha(e.target.value)} />
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-body">
          <input type="checkbox" checked={productionVerified} onChange={(e) => setProductionVerified(e.target.checked)} />
          Production verified
        </label>
      </div>
      <Button disabled={pending} onClick={save}>
        {pending ? "Saving…" : "Save workflow"}
      </Button>

      {issue.status === "READY_FOR_RETEST" ? (
        <div className="space-y-3 border-t border-border pt-4">
          <h3 className="m-0 text-base font-semibold text-foreground">Retest</h3>
          <Textarea value={retestNote} maxLength={1000} placeholder="Optional retest note" onChange={(e) => setRetestNote(e.target.value)} />
          <div className="flex gap-2">
            <Button disabled={pending} onClick={() => retest("PASS")}>Pass retest</Button>
            <Button variant="danger" disabled={pending} onClick={() => retest("FAIL")}>Fail retest</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
