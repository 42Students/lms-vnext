/** Faculty reschedule and cancellation act on visible published sessions only. */
export function facultyLivePublishedMutationAllowed(status:string|null|undefined){
 return status==="PUBLISHED";
}
