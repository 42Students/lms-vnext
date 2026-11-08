/** Navigation only. The destination still checks the signed-in recruiter's
 * selected college and drive access on every request. */
export function recruiterDriveMessageHref(jobId:string):string{
 return "/recruiter/drives/"+encodeURIComponent(jobId)+"/messages";
}
