/** A grading deep link may select only a submission in the currently
 * authorized, active status filter. An invalid or stale student query may
 * fall back to the first visible submission, never leak a hidden row.
 */
export function facultyGradingSelectedSubmission<T extends {id:string}>(
 visible:readonly T[],requestedId:string|undefined,
):T|null{
 return visible.find(row=>row.id===requestedId)??visible[0]??null;
}
