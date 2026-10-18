import {facultyResponseFollowUpHref,type FacultyResponseFollowUpQuery} from "./faculty-response-followup-model";
import {neutralizeFacultyCsvCell} from "./faculty-report-csv";
type ExportRow={
 kind:string;title:string;courseName:string;sectionName:string;
 dueAt:Date|null;missingCount:number;hiddenCount:number;
};
/** Export only aggregate follow-up counts; never names, rolls, phones, emails or private IDs. */
export function facultyFollowUpPageCsv(rows:readonly ExportRow[]):string{
 if(rows.length>10)throw new Error("FOLLOWUP_CSV_PAGE_TOO_LARGE");
 const quote=(value:string)=>{ const normalized=value.replace(/[\u0000-\u001f\u007f-\u009f]/g," "); return '"'+neutralizeFacultyCsvCell(normalized).replaceAll('"','""')+'"'; };
 const lines=[["Type","Assessment","Course","Section","Due UTC","Missing responses","Additional hidden in preview"]];
 for(const row of rows){
  if (![row.missingCount,row.hiddenCount].every(n=>Number.isSafeInteger(n)&&n>=0) || row.hiddenCount>row.missingCount) throw new Error("INVALID_FOLLOWUP_CSV_COUNTS");
  lines.push([row.kind,row.title,row.courseName,row.sectionName,
   row.dueAt && Number.isFinite(row.dueAt.getTime()) ? row.dueAt.toISOString() : "Unknown",String(row.missingCount),String(row.hiddenCount)]);
 }
 return "\uFEFF"+lines.map(line=>line.map(quote).join(",")).join("\r\n")+"\r\n";
}
export function facultyFollowUpCsvHref(query:FacultyResponseFollowUpQuery):string{
 return facultyResponseFollowUpHref(query).replace(/^\/teacher\/response-followups/,"/api/courses/faculty/response-followups/csv");
}
