type TpoRegistrationEventExport={previousChoice:string|null;nextChoice:string;source:string;occurredAt:Date};
function safeCell(value:string):string{
 const guarded=/^[\s\uFEFF]*[=+@\-\t\r]/u.test(value)?"'"+value:value;
 return '"'+guarded.replaceAll('"','""')+'"';
}
export function serializeTpoRegistrationEventHistoryCsv(events:readonly TpoRegistrationEventExport[]):string{
 const rows=[["Before","After","Recorded source","Recorded at UTC"],...events.map(event=>[
  event.previousChoice??"NOT_RECORDED",event.nextChoice,event.source,event.occurredAt.toISOString(),
 ])];
 return rows.map(row=>row.map(safeCell).join(",")).join("\r\n")+"\r\n";
}
