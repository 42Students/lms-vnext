/** Legacy HR URLs remain supported; canonical employer links use Recruiter naming. */
export const RECRUITER_ROUTE_ALIASES = {
  home: "/recruiter/home",
  drives: "/recruiter/drives",
  newDrive: "/recruiter/drives/new",
  calendar: "/recruiter/calendar",
  messages: "/recruiter/messages",
  company: "/recruiter/company",
  profile: "/recruiter/profile",
} as const;
export function recruiterDriveDetailHref(jobId: string) {
  if (!/^[a-f0-9-]{36}$/i.test(jobId)) throw new Error("INVALID_JOB_ID");
  return `/recruiter/drives/${jobId}`;
}
