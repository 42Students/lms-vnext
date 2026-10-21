export type CollegeContentExportRow={
 title:string;course:string;lesson:string;status:string;scope:string;visible:string;details:string;
 // Legacy lesson-content export columns; never expose storage key or URL.
 id?:string;type?:string;sequence?:number;points?:number;
 deadline?:string;durationSeconds?:number|null;active?:boolean;enabled?:boolean;
};
/** RFC4180 quoting with spreadsheet formula protection. */
export function collegeContentCsv(rows:readonly CollegeContentExportRow[]):string{
 const safe=(v:string)=>'"'+(/^[\s]*[=+@-]/.test(v)?"'"+v:v).replaceAll('"','""')+'"';
 const columns=["Title","Course","Lesson","Status","Scope","Student visibility","Details"];
 return [columns.map(safe).join(","),...rows.map(row=>
  [row.title,row.course,row.lesson,row.status,row.scope,row.visible,row.details].map(safe).join(","))].join("\r\n")+"\r\n";
}

/** Exact legacy column sequence from the admin Existing Content export. The
 * historical client exported only the current filtered page, same as this
 * bounded tenant-authorized aggregate. No private storage references.
 */
export function legacyLessonContentCsv(rows:readonly CollegeContentExportRow[]):string{
 const safe=(value:string)=>'"'+(/^[\s]*[=+@-]/.test(value)?"'"+value:value).replaceAll('"','""')+'"';
 const columns=["id","title","type","sequence","points","deadline","durationSeconds","active","enabled"];
 const data=rows.map(row=>[
  row.id??"",row.title,row.type??"",String(row.sequence??""),String(row.points??""),
  row.deadline??"",String(row.durationSeconds??""),
  row.active===false?"no":"yes",row.enabled===false?"no":"yes",
 ]);
 return [columns.map(safe).join(","),...data.map(row=>row.map(safe).join(","))].join("\r\n")+"\r\n";
}
