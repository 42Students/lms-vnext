/** Retry is an explicit user action, never an automatic loop on private review reads. */
export function canRetryVerificationReview(error:string,loading:boolean):boolean {
 return !loading&&error.length>0;
}
