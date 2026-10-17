export type CollegeContentExportRow={
 title:string;course:string;lesson:string;status:string;scope:string;visible:string;details:string;
};
/** RFC4180 quoting with spreadsheet formula protection. */
export function collegeContentCsv(rows:readonly CollegeContentExportRow[]):string{
 const safe=(v:string)=>'"'+(/^[\s]*[=+@-]/.test(v)?"'"+v:v).replaceAll('"','""')+'"';
 const columns=["Title","Course","Lesson","Status","Scope","Student visibility","Details"];
 return [columns.map(safe).join(","),...rows.map(row=>
  [row.title,row.course,row.lesson,row.status,row.scope,row.visible,row.details].map(safe).join(","))].join("\r\n")+"\r\n";
}
