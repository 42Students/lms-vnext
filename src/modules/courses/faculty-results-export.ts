import {facultyResultsHref,facultyRecordedResponseRate,type FacultyResultsQuery} from "./faculty-results-model";
import {neutralizeFacultyCsvCell} from "./faculty-report-csv";
export type FacultyExportRow={
 kind:string;status:string;title:string;courseName:string;sectionName:string;
 eligible:number;responded:number;pending:number;averagePercent:number|null;
};
/** Prevent formula execution even when a persisted assessment title starts with = or @. */
export function facultyResultsCsvCell(value:string|number|null):string{
 const text=String(value??"").replace(/[\u0000-\u001f\u007f-\u009f]/g," ");
 const safe=neutralizeFacultyCsvCell(text);
 return '"'+safe.replaceAll('"','""')+'"';
}
export function facultyResultExportAverage(value:number|null):string{
 return value===null || !Number.isFinite(value) || value<0 || value>100 ? "Unknown" : String(value);
}
export function facultyResultsPageCsv(rows:readonly FacultyExportRow[]):string{
 if(rows.length>10)throw new Error("RESULT_CSV_PAGE_TOO_LARGE");
 const lines=[["Type","Status","Assessment","Course","Section","Eligible","Responded","Missing","Response rate (%)","Average graded score (%)"]];
 for(const row of rows){
  if (![row.eligible,row.responded,row.pending].every(n=>Number.isSafeInteger(n)&&n>=0) ||
      row.responded>row.eligible || row.pending>row.eligible) {
    throw new Error("INVALID_FACULTY_RESULT_CSV_COUNTS");
  }
  lines.push([row.kind,row.status,row.title,row.courseName,row.sectionName,
   String(row.eligible),String(row.responded),String(row.pending),
   String(facultyRecordedResponseRate(row.eligible,row.responded)??"Unknown"),
   facultyResultExportAverage(row.averagePercent)]);
 }
 return "\uFEFF"+lines.map(line=>line.map(facultyResultsCsvCell).join(",")).join("\r\n")+"\r\n";
}
export function facultyResultsCsvHref(query:FacultyResultsQuery):string{
 return facultyResultsHref(query).replace(/^\/teacher\/results/,"/api/courses/faculty/results/csv");
}
