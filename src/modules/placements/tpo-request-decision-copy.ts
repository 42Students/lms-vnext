/** Routine schedule and extension approvals are a single action in the legacy TPO inbox.
 * Consequential decisions require explicit confirmation and explanation. */
export function tpoRequestNeedsConfirmation(requestType:string):boolean {
 return !["ROUND_RESCHEDULE","OFFER_EXTENSION"].includes(requestType);
}
export const TPO_REQUESTS_LEGACY_DESCRIPTION=
 "What students have asked you to decide: withdrawals, off-campus offers, registration changes and disputes. Urgent ones come first.";
