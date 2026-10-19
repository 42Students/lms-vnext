"use client";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
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
 return <section className="space-y-3">
  <h2 className="font-semibold">Preview academic CSV</h2>
  <p className="text-xs text-muted-foreground">Strict studentCode,cgpa,activeBacklogs format. This checks IDs only against the 25 active learners on this page, never the whole batch. No changes are saved and no marksheets are uploaded.</p>
  <label className="block text-sm">CSV data<Textarea value={text} onChange={e=>{setText(e.target.value);setRows(null);}} rows={5} maxLength={50000} className="mt-1 font-mono text-xs"/></label>
  <Button variant="secondary" type="button" onClick={preview} >Validate this-page preview</Button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {rows?<div role="status" className="space-y-2 text-sm"><p>{rows.filter(row=>row.matchedOnCurrentPage).length} matched this page; {rows.filter(row=>!row.matchedOnCurrentPage).length} outside this page or not in the cohort.</p>
   <ul className="max-h-64 space-y-1 overflow-auto">{rows.map(row=><li key={row.studentCode} className="break-all">{row.studentCode} — {row.matchedOnCurrentPage?"Matched current page":"Unverified outside current page"} · CGPA {row.cgpa} · Active backlogs {row.activeBacklogs}</li>)}</ul>
   <p className="text-xs text-muted-foreground">No import/commit action exists here. Review against the authorized records before correcting academic evidence through approved workflows.</p>
  </div>:null}
 </section>;
}
