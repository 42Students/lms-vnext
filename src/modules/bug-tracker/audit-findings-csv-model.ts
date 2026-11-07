import { safeMetadataCsvCell } from "@/modules/shared/metadata-export-csv-cell";
export type AuditFindingCsvRow={
 publicId:string;status:string;severity:string;environment:string;issueType:string;page:string;createdAt:Date;
};
const cell = safeMetadataCsvCell;
/** Projection deliberately excludes names, description, private issue notes and attachment keys. */
export function auditFindingsCsv(rows:readonly AuditFindingCsvRow[]){
 const header=["Finding ID","Status","Severity","Environment","Issue Type","Page","Created (UTC)"];
 const data=rows.slice(0,50).map(row=>[
  row.publicId,row.status,row.severity,row.environment,row.issueType,row.page,row.createdAt.toISOString(),
 ].map(cell).join(","));
 return "\uFEFF"+[header.map(cell).join(","),...data].join("\r\n")+"\r\n";
}
