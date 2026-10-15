export function recruiterDriveThreads<T extends {jobId:string|null;recruiterUserId:string}>(
 threads:readonly T[],jobId:string,recruiterUserId:string,
):T[]{return threads.filter(thread=>
 thread.jobId===jobId&&thread.recruiterUserId===recruiterUserId);
}
