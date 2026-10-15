/** Only a signed PUT can be safely cancelled; final submission may already be persisted. */
export function learnerFileUploadMayCancel(action:"UPLOAD"|"SUBMIT"|null):boolean {
 return action==="UPLOAD";
}
