"use client";

/** A shared in-tab mutation lock for the selected placement job. Each settings
 * control retains its own pending state, while this gate prevents an archive,
 * deadline change or published edit racing one another in the same workspace.
 * The server's CAS and college permissions remain the source of truth across tabs.
 */
const lockedJobs=new Set<string>();
export function beginDriveMutation(jobId:string):boolean {
 if(lockedJobs.has(jobId))return false;
 lockedJobs.add(jobId);return true;
}
export function endDriveMutation(jobId:string):void {
 lockedJobs.delete(jobId);
}
