import type {TpoBatchStudentViewOptions} from "./tpo-batch-student-selection-model";
function csvCell(value:string):string {
 const escaped=/^[\s\uFEFF]*[=+@\-\t\r]/u.test(value)?"'"+value:value;
 return '"'+escaped.replaceAll('"','""')+'"';
}
export function serializeTpoBatchStudentViewCsv(rows:readonly {membershipId:string;name:string;decision:string;ambiguous:boolean;source:string;registration:{choice:string|null}|null}[]):string {
 const all=[["Learner membership ID","Name","Effective decision","Needs review","Decision source","Recorded registration choice"],
  ...rows.map(row=>[row.membershipId,row.name,row.decision,row.ambiguous?"YES":"NO",row.source,row.registration?.choice??""])];
 return all.map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";
}
export function batchStudentViewExportHref(batchId:string,page:number,view:TpoBatchStudentViewOptions){
 const p=new URLSearchParams({page:String(page)});
 if(view.q)p.set("q",view.q);
 if(view.decision!=="ALL")p.set("decision",view.decision);
 if(view.source!=="ALL")p.set("source",view.source);
 if(view.registration!=="ALL")p.set("registration",view.registration);
 if(view.order!=="NAME_ASC")p.set("order",view.order);
 return "/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/students/filtered-export?"+p.toString();
}
