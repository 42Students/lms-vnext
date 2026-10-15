/** A completed old quiz request cannot replace the current attempt after route changes. */
export function learnerQuizRequestCurrent(signal?:Pick<AbortSignal,"aborted">):boolean {
 return !signal?.aborted;
}
