/** Confirm that the exact authorized lesson item was archived.
 * An unrelated, stale or error-shaped 2xx JSON payload is not a save receipt.
 */
export function facultyBlueprintArchiveReceiptMatches(
 kind:"CONTENT"|"ASSIGNMENT"|"QUIZ",id:string,raw:unknown,
):boolean{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const key=kind==="CONTENT"?"content":kind==="ASSIGNMENT"?"assignment":"quiz";
 const value=(raw as Record<string,unknown>)[key];
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const item=value as Record<string,unknown>;
 return item["id"]===id&&item["status"]==="ARCHIVED";
}
