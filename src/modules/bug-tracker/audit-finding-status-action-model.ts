import {z} from "zod";
import {BUG_STATUSES} from "./workflow";
export const auditFindingStatusInput=z.strictObject({
 expectedVersion:z.number().int().min(0),
 status:z.enum(BUG_STATUSES),
});
export function auditFindingStatusPayload(version:number,status:(typeof BUG_STATUSES)[number]){
 return auditFindingStatusInput.parse({expectedVersion:version,status});
}
export function canChangeAuditFindingStatus(current:string,selected:string,pending:boolean){
 return !pending&&current!==selected&&BUG_STATUSES.some(value=>value===selected);
}
