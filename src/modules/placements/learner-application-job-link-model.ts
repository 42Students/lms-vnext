import {z} from "zod";
const persistedJobId=z.string().uuid();
export function ownApplicationJobHref(jobId:unknown){
  const id=persistedJobId.safeParse(jobId);
  return id.success ? "/learn/my-placements/jobs/"+encodeURIComponent(id.data) : null;
}
