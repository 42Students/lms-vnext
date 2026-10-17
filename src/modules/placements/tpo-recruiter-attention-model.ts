export type RecruiterAttentionChip =
  | "OVERDUE" | "NO_NEXT_STEP" | "QUIET" | "BOUNCED" | "UNVERIFIED";

export const RECRUITER_ATTENTION_LABELS: Readonly<Record<RecruiterAttentionChip, string>> = {
  OVERDUE: "Overdue",
  NO_NEXT_STEP: "No next step",
  QUIET: "Quiet",
  BOUNCED: "Bounced",
  UNVERIFIED: "Unverified",
};

/** Legacy's follow-up 'Overdue' means earlier than today in IST, not merely before now. */
export function recruiterAttentionFromPersistedFacts(input: {
  createdAt: Date;
  lastContactAt: Date | null;
  lastActivityAt?: Date | null;
  stage?: string;
  nextFollowupAt: Date | null;
  inviteBouncedAt: Date | null;
  inviteSentAt: Date | null;
  recruiterUserId: string | null;
  manualStage: string;
  unsubscribedAt: Date | null;
}, now: Date): { chips: RecruiterAttentionChip[]; quietDays: number } {
  if (input.manualStage === "NOT_NOW" || input.unsubscribedAt) return { chips: [], quietDays: 0 };
  const days = (at: Date) => {
    const localDay = (d: Date) => {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
      }).formatToParts(d);
      const p = (kind: string) => parts.find(x => x.type === kind)?.value ?? "00";
      return Date.parse(`${p("year")}-${p("month")}-${p("day")}T00:00:00Z`);
    };
    return Math.max(0, Math.floor((localDay(now) - localDay(at)) / 86_400_000));
  };
  const chips: RecruiterAttentionChip[] = [];
  if (input.nextFollowupAt && days(input.nextFollowupAt) > 0) chips.push("OVERDUE");
  if (!input.nextFollowupAt && input.stage !== "RECRUITED") chips.push("NO_NEXT_STEP");
  const quietDays = days(input.lastActivityAt ?? input.lastContactAt ?? input.createdAt);
  if (quietDays >= 14) chips.push("QUIET");
  if (input.inviteBouncedAt) chips.push("BOUNCED");
  // Invitation sent to a contact who has not joined remains unverified.
  if (input.inviteSentAt && !input.recruiterUserId) chips.push("UNVERIFIED");
  return { chips, quietDays };
}
