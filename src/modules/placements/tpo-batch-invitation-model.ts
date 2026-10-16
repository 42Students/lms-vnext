import { z } from "zod";

export const tpoBatchDeadlineSchema = z.object({
  deadline: z.iso.date().nullable(),
  expectedVersion: z.string().min(1).max(80),
}).strict();

export const tpoBatchInvitationSchema = z.object({
  deadline: z.iso.date(),
  expectedVersion: z.string().min(1).max(80),
}).strict();

export class TpoBatchInvitationError extends Error {
  constructor(public readonly code:
    "DEADLINE_REQUIRED" | "DEADLINE_PASSED" | "NO_ELIGIBLE_STUDENTS" |
    "ELIGIBILITY_INCOMPLETE" | "EVERYONE_REGISTERED" | "BATCH_ALREADY_INVITED" |
    "BATCH_FINISHED") {
    super(code);
    this.name = "TpoBatchInvitationError";
  }
}

/** Legacy's date-only picker closes at the end of the selected day in IST. */
export function registrationDeadlineAtEndOfDay(value: string, now: Date): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new TpoBatchInvitationError("DEADLINE_REQUIRED");
  const date = new Date(value + "T23:59:59.999+05:30");
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value)
    throw new TpoBatchInvitationError("DEADLINE_REQUIRED");
  if (date.getTime() <= now.getTime()) throw new TpoBatchInvitationError("DEADLINE_PASSED");
  return date;
}

export const TPO_INVITATION_COPY = {
  dateLabel: "Register by",
  invitation: "Invite",
  move: "Move",
  reopenAndTell: "Reopen and tell them",
  clear: "Clear deadline",
  pickDate: "Pick the date first",
  markFinished: "This batch is finished",
} as const;
