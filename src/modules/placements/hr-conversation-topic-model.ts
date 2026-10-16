/** REC-calendar-messages-profile-R02: source of the thread's context is the scoped job read. */
export function hrRecruiterConversationTopic(jobId: string | null, jobTitle: string | null): string {
 return jobId ? (jobTitle?.trim() || "Hiring drive") : "General";
}
export function hrRecruiterConversationDriveHref(jobId: string | null): string | null {
 return jobId ? "/recruiter/drives/"+encodeURIComponent(jobId)+"?tab=messages" : null;
}
