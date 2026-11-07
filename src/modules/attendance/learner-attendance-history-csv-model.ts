import {spreadsheetCsvCell} from "@/security/csv-cell";

const MAX_ROWS=200;
const cell=(value:string):string=>spreadsheetCsvCell(value.slice(0,240));
/** Only rows in the learner's current authorized UI selection are exported. */
export function learnerAttendanceHistoryCsv(rows:readonly {
 title:string;courseCode:string;startsAt:string;status:string;
 facultyName:string|null;location:string|null;
}[]):{content:string;truncated:boolean} {
 const selected=rows.slice(0,MAX_ROWS);
 const lines=selected.map(row=>[
  row.courseCode,row.title,row.startsAt,row.status,row.facultyName??"",row.location??"",
 ].map(cell).join(","));
 return {content:"\uFEFF"+["Course code,Session,Starts UTC,Attendance,Faculty,Location",...lines].join("\r\n")+"\r\n",truncated:rows.length>MAX_ROWS};
}
