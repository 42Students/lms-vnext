/** Synchronous in-flight latch protects against double-clicks before React commits state. */
export function mayBeginClassTeamCreation(inFlight:boolean,ready:boolean){
 return !inFlight&&ready;
}
