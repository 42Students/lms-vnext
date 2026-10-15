/** A new candidate set invalidates feedback from the previous submitted batch. */
export function emptyVerificationBulkFeedback(){
 return {pendingAction:null,reason:"",error:"",result:null} as const;
}
