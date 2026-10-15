import {announcementVisibilityAt} from "./visibility-model";
export type AnnouncementCsvRow={
 id:string;receiverType:string;title:string;createdAt:Date;scheduledAt:Date|null;
 expiresAt:Date|null;deletedAt:Date|null;isPinned:boolean;version:number;
};
function csvCell(value:string){
 const flattened=value.replace(/[\r\n\t]/g," ");
 const safe=/^[\s\uFEFF]*[=+\-@]/u.test(flattened)?"'"+flattened:flattened;
 return '"'+safe.replaceAll('"','""')+'"';
}
/** Audited metadata only: no message, sender ID, student contact or deletion actor. */
export function announcementHistoryCsv(rows:readonly AnnouncementCsvRow[],now:number){
 const headers=["Notice ID","Audience","Title","Visibility","Pinned","Created (UTC)","Scheduled (UTC)","Expires (UTC)","Version"];
 const data=rows.slice(0,50).map(row=>[
  row.id,row.receiverType,row.title,announcementVisibilityAt(row,now),
  row.isPinned?"Yes":"No",row.createdAt.toISOString(),
  row.scheduledAt?.toISOString()??"",row.expiresAt?.toISOString()??"",String(row.version),
 ]);
 return [headers,...data].map(record=>record.map(csvCell).join(",")).join("\r\n")+"\r\n";
}
