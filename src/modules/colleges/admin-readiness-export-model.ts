import type {CollegeReadinessEvaluation} from "./readiness-model";
import {spreadsheetCsvCell} from "@/security/csv-cell";
/** Read-only persisted evidence export, never a runtime/production launch approval. */
export function buildSuperAdminReadinessCsv(college:{name:string;code:string},evaluation:CollegeReadinessEvaluation):string{
 const safe=spreadsheetCsvCell;
 const lines=[
  ["College","Code","Check","Result","Evidence","Remediation"].map(safe).join(","),
  ...evaluation.checks.map(check=>[college.name,college.code,check.label,check.status,check.evidence,check.remediation].map(safe).join(",")),
 ];
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
