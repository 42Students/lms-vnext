/** PR-S2-01: explicit no-carry-over policy until task provenance migration lands.
 * Closing a sprint must never strand a still-open task on a completed sprint.
 */
export function mayCloseProjectSprint(openTaskCount: number): boolean {
  return Number.isInteger(openTaskCount) && openTaskCount === 0;
}
