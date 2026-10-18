/** A request receipt must come from the exact code path that observed a
 * persisted response. A query parameter or arbitrary session value never
 * becomes a success toast. Keep the producer and consumer wording in sync. */
const permittedReceiptMessages=new Set([
 "Saved. The placement cell sees the new version.",
 "Sent for review.",
 "Sent to the placement cell for review",
 "Request resent to the placement cell.",
]);
export function hrVerifiedDriveReceiptMessage(raw:unknown):string|null{
 return typeof raw==="string"&&permittedReceiptMessages.has(raw)?raw:null;
}
