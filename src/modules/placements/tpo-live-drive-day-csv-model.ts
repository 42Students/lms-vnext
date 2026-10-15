export type TpoLiveExportRow={
 id:string;companyName:string;jobTitle:string;name:string;scheduledAt:string|null;durationMinutes:number|null;
 counts:{total:number;checkedIn:number;noShow:number;pending:number;unknown:number};
};
function cell(value:string){
 const guarded=/^[\s\uFEFF]*[=+@\-\t\r]/u.test(value)?"'"+value:value;
 return '"'+guarded.replaceAll('"','""')+'"';
}
export function serializeTpoLiveDriveDayCsv(rows:readonly TpoLiveExportRow[]):string{
 const header=["Round ID","Company","Job","Round","Scheduled at UTC","Duration minutes","Roster","Checked in","Explicit no-shows","Pending","Unrecorded"];
 return [header,...rows.map(r=>[r.id,r.companyName,r.jobTitle,r.name,r.scheduledAt??"",r.durationMinutes===null?"":String(r.durationMinutes),String(r.counts.total),String(r.counts.checkedIn),String(r.counts.noShow),String(r.counts.pending),String(r.counts.unknown)])]
 .map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
export function tpoLiveCsvHref(filters:{q:string;issue:string;sort:string}):string{
 const p=new URLSearchParams();
 if(filters.q)p.set("q",filters.q);
 p.set("issue",filters.issue);p.set("sort",filters.sort);
 return "/api/placements/tpo/drive-day/export?"+p.toString();
}
