import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
const persistedJobId=zUuid;
export function ownApplicationJobHref(jobId:unknown){
  const id=persistedJobId.safeParse(jobId);
  return id.success ? "/learn/my-placements/jobs/"+encodeURIComponent(id.data) : null;
}
