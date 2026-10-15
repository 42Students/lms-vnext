export function recruiterDriveThreads<T extends {jobId:string|null}>(
 threads:readonly T[],jobId:string,
):T[]{return threads.filter(thread=>thread.jobId===jobId);}
