/** A CSV preview or file-read result belongs only to the unchanged draft
 * revision. A slower prior request must never authorize registering a newer
 * set of faculty rows.
 */
export function facultyCsvResponseBelongsToDraft(
 expectedRevision:number,
 currentRevision:number,
):boolean{
 return Number.isSafeInteger(expectedRevision) && expectedRevision>=0 &&
  Number.isSafeInteger(currentRevision) &&
  expectedRevision===currentRevision;
}
