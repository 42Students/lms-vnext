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
import { LEGACY_STUDENT_CSV_COLUMNS, parseStudentCsv, studentImportReportCsv, type StudentCsvResult } from "@/modules/people/college-student-csv-model";

type Report = {
  preview: boolean;
  structuralErrors: string[];
  valid: number;
  invalid: number;
  results: StudentCsvResult[];
};

const TEMPLATE = LEGACY_STUDENT_CSV_COLUMNS.join(",");
const SAMPLE_FILENAME="sample-students.csv";
// Example-only data. The .invalid address domain cannot receive real mail.
// Replace every illustrative mobile/roll number before importing accounts.
const SAMPLE_ROWS=[
  "Sample,Student,DEMO001,9000000000,sample.student@example.invalid",
  "Demo,Learner,DEMO002,9000000001,demo.learner@example.invalid",
];
const SAMPLE_CSV=[TEMPLATE,...SAMPLE_ROWS].join("\r\n")+"\r\n";
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
  const [selectedFilename,setSelectedFilename]=useState<string|null>(null);
  const [localParsedRows,setLocalParsedRows]=useState<number|null>(null);

  async function submit(action: "PREVIEW" | "IMPORT") {
    setError(null);setSummary(null);
    const local=parseStudentCsv(csv,{programId,cohortId,sectionId:sectionId||undefined});
    if(local.structuralErrors.length){
      setReport(null);
      throw Error("CSV could not be parsed: "+local.structuralErrors.join("; ")+". Fix the file and validate again.");
    }
    setLocalParsedRows(local.entries.length);
    if(action==="IMPORT" && local.entries.some(entry=>entry.errors.length)){
      throw Error("Resolve invalid CSV rows before creating student accounts.");
    }
    if(action==="IMPORT" && csv.includes("example.invalid")){
      throw Error("Replace both sample rows with real student details before importing.");
    }
    const payload=await apiFetch<{report:Report}>("/api/people/student-import",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({action,csv,programId,cohortId,sectionId:sectionId||undefined,
        confirm:action==="IMPORT"?confirm:false}),
    });
    if(!payload?.report || !Array.isArray(payload.report.results) ||
      typeof payload.report.valid!=="number" || typeof payload.report.invalid!=="number")
      throw Error("The import service returned an incomplete report. Do not retry creation until you check Bulk import history.");
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
        message:imported===0&&partial===0
          ? "No students were confirmed as created. Check the row report and Bulk import history before repeating this request."
          : failed||partial
          ? "Created "+imported+" learner(s); "+partial+" identities require enrollment recovery and "+failed+" failed. Do not retry partial rows."
          : "Created "+imported+" learner(s)."});
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
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1 of 3 · Prepare</p>
          <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Bulk Register Students</h2>
        </div>
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
      <div className="mt-2 flex flex-wrap gap-2 print:hidden">
        <a download={SAMPLE_FILENAME} href={"data:text/csv;charset=utf-8,"+encodeURIComponent(SAMPLE_CSV)}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Download sample CSV
        </a>
        <button type="button" onClick={()=>{
          fileRevision.current++;setCsv(SAMPLE_CSV);setSelectedFilename(SAMPLE_FILENAME);
          setReport(null);setConfirm(false);setSummary(null);setError(null);
        }} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 md:min-h-9">
          Load example rows
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Sample contains two fictitious students with reserved example.invalid email addresses.
        Replace the sample mobile numbers, roll numbers and names before creating identities.
        A class is optional; batch enrollment is required.
      </p>
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
            setReadingFile(true);setSelectedFilename(file.name);
            setError(null);setReport(null);setConfirm(false);setSummary(null);
            try{
              if(file.size>1_000_000)throw Error("File exceeds 1 MB");
              const text=await file.text();
              if(revision!==fileRevision.current)return;
              const parsed=parseStudentCsv(text,{programId,cohortId,sectionId:sectionId||undefined});
              if(parsed.structuralErrors.length)
                throw Error("CSV could not be parsed: "+parsed.structuralErrors.join(", "));
              setCsv(text);
              setLocalParsedRows(parsed.entries.length);
              setSummary({tone:"info",message:"Read "+parsed.entries.length+" student row(s) from "+file.name+". Select program and batch, then Preview validation."});
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
          setCsv(event.target.value);setSelectedFilename(null);setLocalParsedRows(null);
          setReport(null); setConfirm(false);setSummary(null);
        }} rows={8} spellCheck={false}
          className="w-full font-mono text-xs md:text-sm" />
      </label>
      {selectedFilename?<p role="status" className="mt-2 break-all text-sm text-muted-foreground">
        Selected file: <strong>{selectedFilename}</strong>{localParsedRows!==null?" · "+localParsedRows+" student row(s)":""}
      </p>:null}
      <Button variant="primary" type="button" loading={pending} disabled={pending || readingFile || !csv.trim() || !programId || !cohortId} onClick={() => guardRun(async () => {
        try { await submit("PREVIEW"); } catch (reason) {
          setError(reason instanceof Error ? reason.message : "Validation failed");
        }
      })} className="mt-4 min-h-11 w-full md:min-h-9 md:w-auto print:hidden">
        {pending ? "Validating..." : "Validate CSV"}
      </Button>
      {readingFile?<p role="status" className="mt-3 text-sm text-muted-foreground">Reading selected CSV…</p>:null}
      {summary?<Alert tone={summary.tone} className="mt-3">{summary.message}</Alert>:null}
      {error ? <Alert tone="error" className="mt-3">{error}</Alert> : null}
    </section>

    {report ? <section aria-label="CSV validation and result report"
      className="min-w-0 space-y-4 border-t border-border pt-4">
      <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">
        {report.preview ? "Step 2 of 3 · Validation report" : "Step 3 of 3 · Import result"}
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
          {key:"reason",header:"Reason",cell:item=><span className="break-words" title={item.detail}>{item.detail}</span>,mobilePriority:"secondary"},
          {key:"membership",header:"Created student",cell:item=>item.membershipId?
            <span className="break-all font-mono text-xs" title={item.membershipId}>{item.membershipId}</span>:"—"},
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
          {pending ? "Creating students..." : "Confirm and create students"}
        </Button>
        <p className="text-xs text-muted-foreground">Import writes one student identity at a time. The existing import receipt is in Bulk import history.
          Undo is not available until an audited rollback/compensation workflow is verified.</p>
      </div> : null}
    </section> : null}
  </div>;
}
