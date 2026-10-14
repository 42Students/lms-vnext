const MAX_ROWS=200;
const cell=(value:string):string=>{
 const text=value.slice(0,240);
 const safe=/^\s*[=+@\-]/.test(text)?"'"+text:text;
 return '"'+safe.replaceAll('"','""')+'"';
};
/** Only rows in the learner's current authorized UI selection are exported. */
export function learnerAttendanceHistoryCsv(rows:readonly {
 title:string;courseCode:string;startsAt:string;status:string;
 facultyName:string|null;location:string|null;
}[]):{content:string;truncated:boolean} {
 const selected=rows.slice(0,MAX_ROWS);
 const lines=selected.map(row=>[
  row.courseCode,row.title,row.startsAt,row.status,row.facultyName??"",row.location??"",
 ].map(cell).join(","));
 return {content:["Course code,Session,Starts UTC,Attendance,Faculty,Location",...lines].join("\r\n")+"\r\n",truncated:rows.length>MAX_ROWS};
}
