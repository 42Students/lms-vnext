import { z } from "zod";

export const APPLICANT_NOTE_MAX_LENGTH = 2000;
export const APPLICANT_NOTE_VISIBLE_LIMIT = 50;

export type ApplicantNoteSide = "TPO" | "RECRUITER";

/**
 * Notes are append-only. `expectedLatestNoteId` is the newest note the author
 * saw for their own audience (null when there were none); a different newest
 * note means someone else wrote meanwhile and the author must re-read first.
 */
export const applicantNoteInputSchema = z
  .object({
    body: z.string().trim().min(1).max(APPLICANT_NOTE_MAX_LENGTH),
    expectedLatestNoteId: z.string().uuid().nullable(),
  })
  .strict();

export type ApplicantNoteInput = z.infer<typeof applicantNoteInputSchema>;

export type ApplicantNoteView = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export type ApplicantNotesSnapshot = {
  notes: ApplicantNoteView[];
  total: number;
  latestNoteId: string | null;
  truncated: boolean;
};

export function projectApplicantNotes(
  rows: readonly {
    id: string;
    authorUserId: string;
    authorName: string | null;
    body: string;
    createdAt: Date;
  }[],
  total: number,
  latestNoteId: string | null,
  viewerUserId: string,
): ApplicantNotesSnapshot {
  return {
    notes: rows.map((row) => ({
      id: row.id,
      authorName: row.authorName?.trim() || "Team member",
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      mine: row.authorUserId === viewerUserId,
    })),
    total,
    latestNoteId,
    truncated: total > rows.length,
  };
}

export function isApplicantNoteStale(
  currentLatestNoteId: string | null,
  expectedLatestNoteId: string | null,
): boolean {
  return currentLatestNoteId !== expectedLatestNoteId;
}
