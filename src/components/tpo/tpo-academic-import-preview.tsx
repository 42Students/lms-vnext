"use client";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {DataTable} from "@/components/ui/data-table";
import {StatusBadge} from "@/components/ui/status-badge";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useState} from "react";
import {parseTpoAcademicPreviewCsv,previewTpoAcademicPageMatches} from "@/modules/placements/tpo-academic-preview-import-model";
export function TpoAcademicImportPreview({activeIds}:{activeIds:readonly string[]}){
 const [text,setText]=useState("studentCode,cgpa,activeBacklogs\n");
 type AcademicPreviewRow=ReturnType<typeof parseTpoAcademicPreviewCsv>[number]&{matchedOnCurrentPage:boolean};
 const [rows,setRows]=useState<AcademicPreviewRow[]|null>(null);
 const [error,setError]=useState("");
 function preview(){
  try{
   const parsed=parseTpoAcademicPreviewCsv(text);
   setRows(previewTpoAcademicPageMatches(parsed,activeIds));
   setError("");
  }catch(err){setRows(null);setError(err instanceof Error?err.message:"Invalid CSV");}
 }
 return <section className="min-w-0 space-y-3 border-y border-border py-3">
  <h2 className="text-base font-semibold text-foreground">Preview academic CSV</h2>
  <p className="text-xs text-muted-foreground print:hidden">Paste academic rows → Validate this-page preview → Review unmatched learner IDs. Nothing is saved.</p>
  <details className="min-w-0 text-[13px] text-[var(--lms-body-text)] print:hidden"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-[var(--lms-primary-text)] sm:min-h-9">CSV format and limits</summary><p className="mt-1 break-words leading-5">Strict studentCode,cgpa,activeBacklogs format. This checks IDs only against the 25 active learners on this page, never the whole batch. No changes are saved and no marksheets are uploaded.</p></details>
  <label className="block text-sm print:hidden">CSV data<Textarea value={text} onChange={e=>{setText(e.target.value);setRows(null);}} rows={5} maxLength={50000} className="mt-1 min-h-32 w-full min-w-0 font-mono text-sm [overflow-wrap:anywhere]"/></label>
  <Button variant="primary" type="button" onClick={preview} className="min-h-11 w-full sm:w-auto md:min-h-9 print:hidden">Validate this-page preview</Button>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {rows?<div className="min-w-0 space-y-3 text-[13px]"><p role="status" className="min-w-0 break-words text-[var(--lms-body-text)]">{rows.filter(row=>row.matchedOnCurrentPage).length} matched this page; {rows.filter(row=>!row.matchedOnCurrentPage).length} outside this page or not in the cohort.</p>
   <div className="max-h-64 min-w-0 overflow-y-auto overscroll-contain print:max-h-none print:overflow-visible"><DataTable caption="Academic CSV preview for current page" rows={rows} getRowKey={row=>row.studentCode} empty={<p>No academic records to preview.</p>} columns={[{key:"student",header:"Student ID",mobilePriority:"primary",cell:row=><span className="break-all font-mono">{row.studentCode}</span>},{key:"match",header:"Match",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.matchedOnCurrentPage?"success":"warning"}>{row.matchedOnCurrentPage?"Matched current page":"Unverified outside current page"}</StatusBadge>},{key:"cgpa",header:"CGPA",mobilePriority:"secondary",cell:row=>row.cgpa},{key:"backlogs",header:"Active backlogs",mobilePriority:"secondary",cell:row=>row.activeBacklogs}]}/></div>
   <p className="text-xs text-muted-foreground">No import/commit action exists here. Review against the authorized records before correcting academic evidence through approved workflows.</p>
  </div>:null}
 </section>;
}
