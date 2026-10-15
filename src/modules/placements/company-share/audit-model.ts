export function companyShareAuditTotals(events: readonly {shareId:string; eventKind:string; count:number}[]) {
 const byId=new Map<string,{views:number;exports:number}>();
 for(const event of events){
  const current=byId.get(event.shareId)??{views:0,exports:0};
  if(event.eventKind==="VIEW")current.views+=event.count;
  if(event.eventKind==="CSV")current.exports+=event.count;
  byId.set(event.shareId,current);
 }
 return byId;
}
