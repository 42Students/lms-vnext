"use client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/ui/file-upload";

import {DataTable} from "@/components/ui/data-table";

import { useRef, useState } from "react";
import {CollegeStudentImportHistory} from "@/components/college/college-student-import-history";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import { useRouter } from "next/navigation";
import { LEGACY_STUDENT_CSV_COLUMNS, studentImportReportCsv, type StudentCsvResult } from "@/modules/people/college-student-csv-model";

type Report = {
  preview: boolean;
  structuralErrors: string[];
  valid: number;
  invalid: number;
  results: StudentCsvResult[];
};

const TEMPLATE = LEGACY_STUDENT_CSV_COLUMNS.join(",");
type Choices = {programs: {id:string;name:string}[]; batches:{id:string;name:string;programId:string}[];
  classes:{id:string;name:string;cohortId:string;capacity:number|null}[]};

export function CollegeStudentCsvImport({ choices }: {choices:Choices}) {
  const router = useRouter();
  const [csv, setCsv] = useState(TEMPLATE + "\n");
  const [programId,setProgramId] = useState("");
  const [cohortId,setCohortId] = useState("");
  const [sectionId,setSectionId] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const fileRevision=useRef(0);
  const [readingFile,setReadingFile]=useState(false);
  const [summary,setSummary]=useState<{tone:"info"|"success"|"warning";message:string}|null>(null);
  const {pending,run:guardRun}=useGuardedAction({busyLabel:"Importing..."});
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "PREVIEW" | "IMPORT") {
    setError(null);setSummary(null);
    const payload=await apiFetch<{report:Report}>("/api/people/student-import",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({action,csv,programId,cohortId,sectionId:sectionId||undefined,
        confirm:action==="IMPORT"?confirm:false}),
    });
    if(!payload?.report)throw Error("Unable to validate student CSV. Please try again.");
    setReport(payload.report as Report);
    if(action==="PREVIEW"){
      if(payload.report.invalid===0 && !payload.report.structuralErrors.length){
        setSummary({tone:"success",message:"Validation passed for "+payload.report.valid+" learner(s)."});
      }else{
        setSummary({tone:"warning",message:"Validation found "+payload.report.invalid+" invalid learner(s). Review the row report."});
      }
    }else{
      const imported=payload.report.results.filter(row=>row.status==="IMPORTED").length;
      const partial=payload.report.results.filter(row=>row.status==="PARTIAL").length;
      const failed=payload.report.results.filter(row=>row.status==="FAILED"||row.status==="INVALID").length;
      setSummary({tone:failed||partial?"warning":"success",
        message:failed||partial
          ?"Created "+imported+" learner(s); "+(failed+partial)+" failed or need enrollment recovery."
          :"Created "+imported+" learner(s)."});
    }
    if (action === "IMPORT") {
      setConfirm(false);
      router.refresh();
    }
  }

  const csvDownload = report ? "data:text/csv;charset=utf-8," +
    encodeURIComponent("\uFEFF" + studentImportReportCsv(report.results)) : null;

  return <div className="min-w-0 max-w-4xl space-y-6">
    <section className="border-t border-border pt-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Upload or paste CSV</h2>
        <CollegeStudentImportHistory/>
      </div>
      <p className="mt-2 text-sm text-body leading-[22px]">
        Maximum 500 learner rows and 1 MB. Use the exact header order below.
        Choose a program and batch from the selectors; you do not need to copy their IDs into legacy CSV rows.
        Indian 10-digit mobile numbers are normalized to +91 for the legacy template.
        The dry run checks format, college ownership, duplicate rows and existing account conflicts. All rows must validate before import.
        Successful rows create independent identities and memberships; no automatic batch undo is available. Use Bulk import history for recorded batch results and manual recovery.
      </p>
      <p className="mt-2 break-all font-mono text-xs text-muted-foreground leading-[20px]">{TEMPLATE}</p>
      <a download="student-import-template.csv"
        href={"data:text/csv;charset=utf-8,"+encodeURIComponent(TEMPLATE+"\n")}
        className="mt-2 inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">
        Download CSV template
      </a>
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 print:hidden">
        <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Program
          <Select required value={programId}
            onChange={event=>{setProgramId(event.target.value);setCohortId("");setSectionId("");setReport(null);}}
            className="min-h-11 md:min-h-9">
            <option value="">Choose program</option>
            {choices.programs.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}
          </Select>
        </label>
        <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Batch
          <Select required value={cohortId}
            onChange={event=>{setCohortId(event.target.value);setSectionId("");setReport(null);}}
            className="min-h-11 md:min-h-9">
            <option value="">Choose batch</option>
            {choices.batches.filter(option=>option.programId===programId).map(option=>
              <option key={option.id} value={option.id}>{option.name}</option>)}
          </Select>
        </label>
        <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Class/Section
          <Select value={sectionId}
            onChange={event=>{setSectionId(event.target.value);setReport(null);}}
            className="min-h-11 md:min-h-9">
            <option value="">No class placement</option>
            {choices.classes.filter(option=>option.cohortId===cohortId).map(option=>
              <option key={option.id} value={option.id}>{option.name} · capacity {option.capacity??"unlimited"}</option>)}
          </Select>
        </label>
      </div>
      <FileUpload className="mt-4 print:hidden [&_input]:min-h-11 md:[&_input]:min-h-9" label="Choose local CSV file" maxBytes={1_000_000} accept=".csv,text/csv"
          disabled={pending||readingFile} onFiles={async files => {
            const revision=++fileRevision.current;
            const file=files?.[0];
            if(!file)return;
            setReadingFile(true);setError(null);setReport(null);setConfirm(false);setSummary(null);
            try{
              if(file.size>1_000_000)throw Error("File exceeds 1 MB");
              const text=await file.text();
              if(revision!==fileRevision.current)return;
              setCsv(text);
              const count=Math.max(0,text.split(/\r?\n/).filter(row=>row.trim()).length-1);
              setSummary({tone:"info",message:"Parsed "+count+" row(s). Select program & class, then Validate or Create."});
            }catch(error){
              if(revision===fileRevision.current)
                setError(error instanceof Error?error.message:"Could not read CSV file");
            }finally{
              if(revision===fileRevision.current)setReadingFile(false);
            }
          }} />
      <label className="mt-4 grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] print:hidden text-[13px]">
        CSV contents
        <Textarea value={csv} onChange={event => {
          fileRevision.current+=1;setReadingFile(false);
          setCsv(event.target.value); setReport(null); setConfirm(false);setSummary(null);
        }} rows={8} spellCheck={false}
          className="w-full font-mono text-xs md:text-sm" />
      </label>
      <Button variant="primary" type="button" loading={pending} disabled={pending || readingFile || !csv.trim() || !programId || !cohortId} onClick={() => guardRun(async () => {
        try { await submit("PREVIEW"); } catch (reason) {
          setError(reason instanceof Error ? reason.message : "Validation failed");
        }
      })} className="mt-4 min-h-11 w-full md:min-h-9 md:w-auto print:hidden">
        {pending ? "Validating..." : "Preview validation"}
      </Button>
      {readingFile?<p role="status" className="mt-3 text-sm text-muted-foreground">Reading selected CSV…</p>:null}
      {summary?<Alert tone={summary.tone} className="mt-3">{summary.message}</Alert>:null}
      {error ? <Alert tone="error" className="mt-3">{error}</Alert> : null}
    </section>

    {report ? <section aria-label="CSV validation and result report"
      className="min-w-0 space-y-4 border-t border-border pt-4">
      <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">
        {report.preview ? "Dry-run report" : "Import result"}
      </h2>
      <Alert tone="info">{report.valid} structurally valid; {report.invalid} invalid.
        {report.preview ? " No learner has been created or enrolled." :
          " Import is per-row. PARTIAL means onboarding succeeded but enrollment did not."}</Alert>
      {report.structuralErrors.length ? <Alert tone="error">
        {report.structuralErrors.join(", ")}
      </Alert> : null}
      {csvDownload ? <a href={csvDownload} download="student-import-result.csv"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">
        Export neutralized result CSV
      </a> : null}
      <DataTable<StudentCsvResult> caption="Student CSV validation and import results"
        rows={report.results} getRowKey={item=>String(item.row)}
        columns={[
          {key:"row",header:"Row",cell:item=>item.row,mobilePriority:"primary"},
          {key:"status",header:"Status",cell:item=><StatusBadge tone={item.status==="IMPORTED"||item.status==="VALID"?"success":item.status==="FAILED"||item.status==="INVALID"?"error":"warning"}>{item.status}</StatusBadge>,mobilePriority:"secondary"},
          {key:"reason",header:"Reason",cell:item=>item.detail,mobilePriority:"secondary"},
        ]}
        empty={<EmptyState title="No row results" description="No row-level results are available."/>}/>

      {report.preview && report.valid > 0 && report.invalid === 0 && report.structuralErrors.length === 0 ? <div className="space-y-3">
        <label className="flex min-h-11 items-start gap-2 text-sm text-body print:hidden">
          <Checkbox checked={confirm} onChange={event => setConfirm(event.target.checked)} className="mt-1" />
          I understand that importing creates real identities and memberships, successful rows are not rolled back,
          and any partial onboarding requires manual enrollment recovery.
        </label>
        <Button variant="primary" type="button" loading={pending} disabled={!confirm || pending}
          onClick={() => guardRun(async () => {
            try { await submit("IMPORT"); } catch (reason) {
              setError(reason instanceof Error ? reason.message : "Import failed");
            }
          })}
          className="min-h-11 w-full md:min-h-9 md:w-auto print:hidden">
          {pending ? "Importing..." : "Confirm import of validated rows"}
        </Button>
      </div> : null}
    </section> : null}
  </div>;
}
