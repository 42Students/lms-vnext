import { spreadsheetCsvCell } from "@/security/csv-cell";
type TpoRegistrationEventExport={previousChoice:string|null;nextChoice:string;source:string;occurredAt:Date};
const safeCell = spreadsheetCsvCell;
export function serializeTpoRegistrationEventHistoryCsv(events:readonly TpoRegistrationEventExport[]):string{
 const rows=[["Before","After","Recorded source","Recorded at UTC"],...events.map(event=>[
  event.previousChoice??"NOT_RECORDED",event.nextChoice,event.source,event.occurredAt.toISOString(),
 ])];
 return rows.map(row=>row.map(safeCell).join(",")).join("\r\n")+"\r\n";
}
