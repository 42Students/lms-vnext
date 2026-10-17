export type TpoExportRequestRow={id:string;studentName:string;requestType:string;status:string;jobTitle:string;companyName:string;requestedAt:Date;reason?:string;decisionNote?:string|null;decidedAt?:Date|null;decidedBy?:string|null};
function csvCell(value:string){
 const safe=/^[\s\uFEFF]*[=+\-@\t\r]/u.test(value)?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function toTpoRequestsPageCsv(rows:readonly TpoExportRequestRow[]):string{
 const columns=["Request ID","Student","Type","Status","Job","Company","Requested at (UTC)","What they asked","Why","Decided by","Decided on (UTC)"];
 return [columns,...rows.map(r=>[r.id,r.studentName,r.requestType,r.status,r.jobTitle,r.companyName,r.requestedAt.toISOString(),r.reason??"",r.decisionNote??"",r.decidedBy??"",r.decidedAt?.toISOString()??""])]
  .map(row=>row.map(v=>csvCell(v)).join(",")).join("\r\n")+"\r\n";
}
export function tpoRequestsExportHref(query:{status:string;requestType:string;sort:string;age:string;search:string;page:number;pageSize:number}):string{
 const p=new URLSearchParams();
 p.set("status",query.status);
 p.set("requestType",query.requestType);
 p.set("sort",query.sort);
 p.set("age",query.age);
 if(query.search)p.set("search",query.search);
 p.set("page",String(query.page));p.set("pageSize",String(query.pageSize));
 return "/api/placements/tpo/requests/export?"+p.toString();
}
