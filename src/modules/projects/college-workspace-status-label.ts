/** COL-projects-08 / OD-25: customer-facing legacy words without changing persisted status. */
export function collegeWorkspaceStatusLabel(
 status:string, riskReasons:readonly string[]=[],
):string {
 if(status==="ARCHIVED")return "Archived";
 if(status==="COMPLETED")return "Ready";
 if(status==="PLANNED")return "Planned";
 if(status==="ACTIVE")return riskReasons.includes("Active blocker")?"Blocked":"In progress";
 return status.toLowerCase().replaceAll("_"," ").replace(/^./,character=>character.toUpperCase());
}
