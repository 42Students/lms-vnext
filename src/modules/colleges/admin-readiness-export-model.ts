import type {CollegeReadinessEvaluation} from "./readiness-model";
/** Read-only persisted evidence export, never a runtime/production launch approval. */
export function buildSuperAdminReadinessCsv(college:{name:string;code:string},evaluation:CollegeReadinessEvaluation):string{
 const safe=(value:string)=>{
  const firstVisible=value.replace(/^[\s\p{Cc}\p{Cf}\p{Mn}]*/u,"");
  const neutralized=/^[=+@-]/u.test(firstVisible) ? "'"+value : value;
  return '"'+neutralized.replace(/"/g,'""')+'"';
 };
 const lines=[
  ["College","Code","Check","Result","Evidence","Remediation"].map(safe).join(","),
  ...evaluation.checks.map(check=>[college.name,college.code,check.label,check.status,check.evidence,check.remediation].map(safe).join(",")),
 ];
 return lines.join(String.fromCharCode(13,10))+String.fromCharCode(13,10);
}
