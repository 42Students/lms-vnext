/** A delivery count is meaningful only after the server verifies the exact
 * preview audience, authorization, deadline and cooldown. Guard the UI against
 * malformed success payloads; never claim a reminder was sent on HTTP 200 alone.
 */
export type TpoReminderPreview={
 count:number;day:string;alreadySent:boolean;allowed:boolean;
 reason:string|null;previewToken:string|null;
};
export type TpoReminderReceipt={
 reminded:number;alreadySent:boolean;reason:string|null;
};
function record(value:unknown):value is Record<string,unknown>{
 return typeof value==="object"&&value!==null&&!Array.isArray(value);
}
export function parseTpoReminderPreview(value:unknown):TpoReminderPreview|null{
 if(!record(value)||!Number.isSafeInteger(value["count"])||typeof value["count"]!=="number"||
  value["count"]<0||typeof value["day"]!=="string"||
  !/^\d{4}-\d{2}-\d{2}$/.test(value["day"])||
  typeof value["allowed"]!=="boolean"||typeof value["alreadySent"]!=="boolean"||
  (value["reason"]!==null&&typeof value["reason"]!=="string")||
  (value["previewToken"]!==null&&typeof value["previewToken"]!=="string"))return null;
 if(value["allowed"]&&!value["alreadySent"]&&value["count"]>0&&!value["previewToken"])return null;
 return {count:value["count"],day:value["day"],allowed:value["allowed"],
  alreadySent:value["alreadySent"],reason:value["reason"],previewToken:value["previewToken"]};
}
export function tpoReminderReceiptMessage(raw:unknown,expectedCount:number):string|null{
 if(!record(raw)||!Number.isSafeInteger(raw["reminded"])||typeof raw["reminded"]!=="number"||
  raw["reminded"]<0||raw["reminded"]>expectedCount||typeof raw["alreadySent"]!=="boolean"||
  (raw["reason"]!==null&&typeof raw["reason"]!=="string"))return null;
 if(raw["alreadySent"]){
  if(raw["reminded"]!==0)return null;
  return "Already reminded within the past 20 hours";
 }
 return raw["reminded"]+" eligible registered students were reminded in-app.";
}
