"use client";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { groupCsvPreviewErrorMessage, groupCsvValidationLabel, type GroupImportRow } from "@/modules/groups/college-group-csv-preview-model";

type ImportResult = {
  requested: number; added: number; waitlisted: number; errors: number;
  results: { rowNumber: number; email: string; status: string }[];
  errorCsv: string;
};
type Result = {
  groupId: string; status: string; total: number; ready: number; blocked: number;
  rows: { rowNumber: number; email: string; status: GroupImportRow["status"] }[];
  warning: string; errorCsv: string;
};

export function CollegeGroupImportPreview({ groupId }: { groupId: string }) {
  const [csv, setCsv] = useState("email\n");
  const csvRevision = useRef(0);
  const [result, setResult] = useState<Result | null>(null);
  const [imported, setImported] = useState<ImportResult | null>(null);
  const [manualResult, setManualResult] = useState<ImportResult | null>(null);
  const [manualText, setManualText] = useState("");
  const [manualKind, setManualKind] = useState<"ROLL_NUMBER"|"MEMBERSHIP_ID"|"LEGACY_LEARNER_ID">("ROLL_NUMBER");
  const [error, setError] = useState("");
  const [manualError, setManualError] = useState("");
  const [pending, startTransition] = useTransition();
  const [reading, setReading] = useState(false);
  async function load(file: File | null) {
    const revision = ++csvRevision.current;
    setError("");
    setResult(null);
    setImported(null);
    // Never leave the old CSV eligible for confirmation when a new file fails.
    setCsv("");
    setReading(false);
    if (!file) return;
    if (file.size > 524288) {
      setError("CSV file exceeds the 512 KiB maximum.");
      return;
    }
    setReading(true);
    try { const next = await file.text(); if (revision === csvRevision.current) setCsv(next); }
    catch { if (revision === csvRevision.current) setError("The selected CSV could not be read."); }
    finally { if (revision === csvRevision.current) setReading(false); }
  }
  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setImported(null);
    const revision = csvRevision.current;
    const submittedCsv = csv;
    startTransition(async () => {
      try {
        const response = await fetch("/api/college/groups/import-preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ groupId, csv: submittedCsv }),
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          const code = typeof payload === "object" && payload !== null &&
            "error" in payload && typeof payload.error === "string"
            ? payload.error : "Import preview failed";
          throw new Error(groupCsvPreviewErrorMessage(code));
        }
        if (revision === csvRevision.current) setResult(payload as Result);
      } catch (cause) {
        if (revision === csvRevision.current) setError(cause instanceof Error ? cause.message : "Unable to preview CSV");
      }
    });
  }
  function confirm() {
    if (!result || !result.ready || pending || reading) return;
    setError("");
    setImported(null);
    const revision = csvRevision.current;
    const submittedCsv = csv;
    startTransition(async () => {
      try {
        const response = await fetch("/api/college/groups/import", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ groupId, csv: submittedCsv }),
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          const code = typeof payload === "object" && payload !== null &&
            "error" in payload && typeof payload.error === "string"
            ? payload.error : "Import failed";
          throw new Error(code);
        }
        if (revision === csvRevision.current) setImported(payload as ImportResult);
      } catch (cause) {
        if (revision === csvRevision.current) setError(cause instanceof Error ? cause.message : "Unable to import members");
      }
    });
  }
  function confirmManual() {
    const identifiers = manualText.split(/[\r\n,]+/).map(item=>item.trim()).filter(Boolean);
    if (!identifiers.length || identifiers.length > 2000 || pending) {
      setManualError("Provide between 1 and 2,000 learner identifiers."); return;
    }
    setManualError("");
    setManualResult(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/college/groups/import", {
          method:"POST", headers:{"content-type":"application/json"},
          body:JSON.stringify({groupId,identifierType:manualKind,identifiers}),
        });
        const payload:unknown=await response.json();
        if (!response.ok) {
          const code=payload && typeof payload==="object" && "error" in payload &&
            typeof payload.error==="string" ? payload.error : "Manual import failed";
          throw new Error(code);
        }
        setManualResult(payload as ImportResult);
      } catch (cause) {
        setManualError(cause instanceof Error ? cause.message : "Unable to import members");
      }
    });
  }
  return <div className="min-w-0 space-y-4">
    <form onSubmit={preview} className="min-w-0 space-y-3 border-b border-border pb-4">
      <p className="text-sm text-body leading-[22px]">
        Upload a CSV with one column named <code>Email</code>. Maximum 2,000 rows and 512 KiB.
        Only currently active learners in this college are eligible.
      </p>
      <FileUpload label="Select CSV file" accept=".csv,text/csv" maxBytes={524288}
        onFiles={files=>void load(files?.[0]??null)}/>
      <Button type="submit" loading={pending || reading} className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={reading || pending || !csv.trim()}>
        {pending ? "Validating…" : "Preview members"}
      </Button>
      <Disclosure title="CSV contents" className="min-w-0">
        <Label stack className="mt-3 min-w-0">CSV contents
          <Textarea rows={8} maxLength={524288} value={csv}
            onChange={(event) => { csvRevision.current++; setReading(false); setCsv(event.target.value); setResult(null); setImported(null); setError(""); }}
            className="font-mono text-sm" />
        </Label>
      </Disclosure>
      {error && !result ? <Alert tone="error">{error}</Alert> : null}
    </form>
    {result ? <section aria-label="Student group CSV validation report" className="min-w-0 space-y-3">
      <Heading level={2} size="lg" className="text-[var(--lms-heading)]">
        Dry run: {result.ready} ready, {result.blocked} blocked, {result.total} examined
      </Heading>
      <p role="status" className="text-sm text-body">Preview only. No memberships have been changed. Confirm import to apply the validated rows.</p>
      {result.warning ? <Alert tone="warning">{result.warning}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {!imported && result.ready > 0 ? <Button type="button" loading={pending}
        disabled={pending || reading} onClick={confirm}>
        Confirm import of {result.ready} eligible learner{result.ready===1?"":"s"}
      </Button> : null}
      <TextLink href={"data:text/csv;charset=utf-8," + encodeURIComponent(result.errorCsv)}
        download="group-import-validation-errors.csv"
        className="inline-flex min-h-11 items-center md:min-h-9">
        Download safe error CSV
      </TextLink>
      {result.rows.length === 0 ? <EmptyState title="No learner rows" description="No learner rows were supplied."/> : (
        <div className="max-h-[35rem] min-w-0 overflow-auto border-y border-border">
          <DataTable<Result["rows"][number]>
            caption="Group import preview validation"
            rows={result.rows} getRowKey={row=>String(row.rowNumber)}
            empty={<EmptyState title="No learner rows" description="No learner rows were supplied."/>}
            columns={[
              {key:"row",header:"Row",mobilePriority:"primary",cell:row=>row.rowNumber},
              {key:"email",header:"Email",mobilePriority:"secondary",cell:row=><span className="break-all">{row.email}</span>},
              {key:"validation",header:"Validation",mobilePriority:"secondary",cell:row=>groupCsvValidationLabel(row.status)},
            ]}/>
        </div>
      )}
    </section> : null}
    {imported ? <section aria-label="Confirmed group import results" className="min-w-0 space-y-3">
      <Heading level={2} size="lg" className="text-[var(--lms-heading)]">
        Import complete: {imported.requested} requested, {imported.added} added, {imported.waitlisted} waitlisted, {imported.errors} errors
      </Heading>
      <Alert tone={imported.errors?"warning":"success"}>
        {imported.requested} learner rows processed. Each membership was rechecked when written.
      </Alert>
      {imported.errors > 0 ? <TextLink href={"data:text/csv;charset=utf-8,"+encodeURIComponent(imported.errorCsv)}
        download="group-import-errors.csv" className="inline-flex min-h-11 items-center">
        Download import errors
      </TextLink> : null}
      <div className="max-h-[35rem] min-w-0 overflow-auto border-y border-border">
        <DataTable<ImportResult["results"][number]>
          caption="Confirmed group membership import"
          empty={<EmptyState title="No results" description="No imported rows were returned."/>}
          rows={imported.results} getRowKey={row=>String(row.rowNumber)}
          columns={[
            {key:"row",header:"Row",cell:row=>row.rowNumber},
            {key:"email",header:"Email",cell:row=><span className="break-all">{row.email}</span>},
            {key:"result",header:"Result",cell:row=>row.status.replaceAll("_"," ")},
          ]}/>
      </div>
    </section> : null}
    <section aria-label="Manual group member import" className="min-w-0 space-y-3 border-t border-border pt-4">
      <Heading level={2} size="lg" className="text-[var(--lms-heading)]">Add learners by ID or roll number</Heading>
      <p className="text-sm text-body">Enter up to 2,000 values, one per line or separated by commas.
        Only active learners of this college can be added.</p>
      <Label className="block space-y-2">Identifier type
        <Select value={manualKind} disabled={pending} onChange={event=>{
          setManualKind(event.target.value as typeof manualKind);setManualResult(null);setManualError("");
        }}>
          <option value="ROLL_NUMBER">Roll number</option>
          <option value="MEMBERSHIP_ID">Membership ID</option>
          <option value="LEGACY_LEARNER_ID">Legacy learner ID</option>
        </Select>
      </Label>
      <Label className="block space-y-2">Learner identifiers
        <Textarea rows={5} value={manualText} disabled={pending} maxLength={524288}
          onChange={event=>{setManualText(event.target.value);setManualResult(null);setManualError("");}}/>
      </Label>
      <Button type="button" loading={pending} disabled={pending||!manualText.trim()}
        onClick={confirmManual}>Confirm manual import</Button>
      {manualError ? <Alert tone="error">{manualError}</Alert> : null}
      {manualResult ? <div className="min-w-0 space-y-3">
        <Heading level={3}>Manual import: {manualResult.requested} requested, {manualResult.added} added, {manualResult.waitlisted} waitlisted, {manualResult.errors} errors</Heading>
        {manualResult.errors>0?<TextLink href={"data:text/csv;charset=utf-8,"+encodeURIComponent(manualResult.errorCsv)}
          download="manual-group-import-errors.csv" className="inline-flex min-h-11 items-center">
          Download errors
        </TextLink>:null}
        <DataTable<ImportResult["results"][number]>
          caption="Manual group import results"
          empty={<EmptyState title="No results" description="No imported rows were returned."/>}
          rows={manualResult.results} getRowKey={row=>String(row.rowNumber)}
          columns={[
            {key:"row",header:"Row",cell:row=>row.rowNumber},
            {key:"identifier",header:"Identifier",cell:row=>row.email},
            {key:"result",header:"Result",cell:row=>row.status.replaceAll("_"," ")},
          ]}/>
      </div> : null}
    </section>
    <p className="text-xs leading-5 text-muted-foreground">
      Preview never writes memberships. Confirmed import rechecks active learner eligibility and
      capacity for each row and records partial successes without rolling them back.
    </p>
  </div>;
}
