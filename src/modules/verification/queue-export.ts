import { spreadsheetCsvCell } from "@/security/csv-cell";
export const MAX_VERIFICATION_EXPORT_ROWS=1000;
export type VerificationExportRow={learnerName:string;section:string;status:string;submittedAt:string;reviewedAt:string;reviewedBy?:string;educationEntryCount?:number;missingDocumentCount?:number;attentionFlags?:string};
const safeCell = spreadsheetCsvCell;
export function verificationCsv(rows:readonly VerificationExportRow[]):{csv:string;truncated:boolean}{
 const selected=rows.slice(0,MAX_VERIFICATION_EXPORT_ROWS);
 const headers=["Learner","Section","Status","Submitted (IST)","Reviewed (IST)","Reviewed by","Education entries submitted","Rows without marksheet","Attention cues"];
 const lines=[headers.map(safeCell).join(","),
 ...selected.map(r=>[r.learnerName,r.section,r.status,r.submittedAt,r.reviewedAt,r.reviewedBy??"",r.educationEntryCount===undefined?"":String(r.educationEntryCount),r.missingDocumentCount===undefined?"":String(r.missingDocumentCount),r.attentionFlags??""].map(safeCell).join(","))];
 const truncated=rows.length>MAX_VERIFICATION_EXPORT_ROWS;
 if(truncated) lines.push('"TRUNCATED","Showing first 1000 rows"');
 return {csv:"\uFEFF"+lines.join("\r\n")+"\r\n",truncated};
}
