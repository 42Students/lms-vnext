import { CACHE } from "@/security/responses";
/** Capability URLs must never be cached, indexed or forwarded as referrers. */
export function companyShareCsvResponseHeaders(){
 return {
  "Content-Type":"text/csv; charset=utf-8",
  "Content-Disposition":'attachment; filename="company-shortlisted-applicants.csv"',
  "Cache-Control":CACHE.PRIVATE,
  "X-Content-Type-Options":"nosniff",
  "Referrer-Policy":"no-referrer",
  "X-Robots-Tag":"noindex, nofollow, noarchive",
 } as const;
}
