/** HR-WORKSPACE-CONTACT-18.
 * Round participation does not itself authorize contact disclosure.
 * Only an explicitly enabled relationship column grants access to email.
 * The caller must have already scoped the employer, college and job.
 */
export function recruiterSharedRoundParticipantEmail(
  email: string | null,
  shareColumns: readonly string[] | null | undefined,
): string | null {
  return shareColumns?.includes("email") === true ? email : null;
}
