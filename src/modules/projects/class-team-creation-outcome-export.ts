import {projectWorkspaceCsvCell} from "./admin-workspace-page-export-model";

export type ClassTeamCreationResultRow={
 membershipId:string;
 status:"CREATED"|"ALREADY_COVERED";
 projectId:string|null;
 title:string|null;
};

/** Export only service-returned, already authorized individual creation outcomes.
 * Never expand a roster or query another tenant to fill missing names.
 */
export function classTeamCreationOutcomeCsv(
 rows:readonly ClassTeamCreationResultRow[],
 names:ReadonlyMap<string,{displayName:string}>,
):string{
 const heading=["Learner","Student membership","Result","Workspace","Project ID"];
 const data=rows.map(row=>[
  names.get(row.membershipId)?.displayName??"",
  row.membershipId,
  row.status,
  row.title??"",
  row.projectId??"",
 ]);
 return [heading,...data].map(columns=>columns.map(projectWorkspaceCsvCell).join(","))
  .join("\r\n")+"\r\n";
}
