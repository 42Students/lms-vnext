import {facultyResultsHref,facultyRecordedResponseRate,type FacultyResultsQuery} from "./faculty-results-model";
import {neutralizeFacultyCsvCell} from "./faculty-report-csv";
export type FacultyExportRow={
 kind:string;status:string;title:string;courseName:string;sectionName:string;
 eligible:number|null;responded:number;pending:number|null;averagePercent:number|null;
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
  // Roster availability is independent of submitted attempts. A null
  // eligible/missing count means unknown, not zero participation.
  if (!Number.isSafeInteger(row.responded)||row.responded<0 ||
      (row.eligible!==null&&(!Number.isSafeInteger(row.eligible)||
        row.eligible<0||row.responded>row.eligible)) ||
      (row.pending!==null&&(!Number.isSafeInteger(row.pending)||
        row.pending<0||(row.eligible!==null&&row.pending>row.eligible)))) {
    throw new Error("INVALID_FACULTY_RESULT_CSV_COUNTS");
  }
  lines.push([row.kind,row.status,row.title,row.courseName,row.sectionName,
   row.eligible===null?"Unknown":String(row.eligible),String(row.responded),
   row.pending===null?"Unknown":String(row.pending),
   row.eligible===null?"Unknown":String(facultyRecordedResponseRate(row.eligible,row.responded)??"Unknown"),
   facultyResultExportAverage(row.averagePercent)]);
 }
 return "\uFEFF"+lines.map(line=>line.map(facultyResultsCsvCell).join(",")).join("\r\n")+"\r\n";
}
export function facultyResultsCsvHref(query:FacultyResultsQuery):string{
 return facultyResultsHref(query).replace(/^\/teacher\/results/,"/api/courses/faculty/results/csv");
}
