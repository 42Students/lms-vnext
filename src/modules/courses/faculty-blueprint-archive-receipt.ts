/** An archive response is not confirmation merely because the HTTP status is 200.
 * Match the exact item, expected scope and persisted archived state before
 * hiding a Blueprint row. The server remains the sole mutation authority. */
export function facultyBlueprintArchiveReceiptMatches(
  kind:"CONTENT"|"ASSIGNMENT"|"QUIZ",
  itemId:string,deliveryId:string,payload:unknown,
):boolean{
 if(!payload||typeof payload!=="object"||Array.isArray(payload))return false;
 const record=payload as Record<string,unknown>;
 const field=kind==="CONTENT"?"content":kind==="QUIZ"?"quiz":"assignment";
 const row=record[field];
 if(!row||typeof row!=="object"||Array.isArray(row))return false;
 const value=row as Record<string,unknown>;
 return value.id===itemId&&value.status==="ARCHIVED"&&
   (kind==="CONTENT"||value.deliveryId===deliveryId);
}
