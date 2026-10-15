/** Role-specific checks already read from authorized published job details.
 * No independent placement registration/consent status is supplied or inferred. */
export type RoleEvidenceRow={
 roleOption:{id:string;title:string};
 eligibility:{checks:readonly {status:string}[]};
 canApply:boolean;deadlinePassed:boolean;
};
export function learnerDriveEvidenceRequirements(rows:readonly RoleEvidenceRow[]){
 return rows.map(row=>({
  id:row.roleOption.id,title:row.roleOption.title,
  checked:row.eligibility.checks.length,
  passed:row.eligibility.checks.filter(check=>check.status==="PASS").length,
  failed:row.eligibility.checks.filter(check=>check.status==="FAIL").length,
  missing:row.eligibility.checks.filter(check=>check.status==="MISSING").length,
  actionable:row.canApply&&!row.deadlinePassed,
 }));
}
