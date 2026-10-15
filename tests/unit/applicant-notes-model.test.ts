import { describe, expect, it } from "vitest";
import {
  APPLICANT_NOTE_MAX_LENGTH,
  applicantNoteInputSchema,
  isApplicantNoteStale,
  projectApplicantNotes,
} from "@/modules/placements/applicant-notes-model";

const id = "11111111-1111-4111-8111-111111111111";

describe("applicant notes model", () => {
  it("trims, bounds and strictly shapes a note write", () => {
    expect(applicantNoteInputSchema.parse({ body: "  hello  ", expectedLatestNoteId: null }).body).toBe("hello");
    expect(applicantNoteInputSchema.safeParse({ body: "   ", expectedLatestNoteId: null }).success).toBe(false);
    expect(applicantNoteInputSchema.safeParse({ body: "x".repeat(APPLICANT_NOTE_MAX_LENGTH + 1), expectedLatestNoteId: null }).success).toBe(false);
    expect(applicantNoteInputSchema.safeParse({ body: "ok", expectedLatestNoteId: "not-a-uuid" }).success).toBe(false);
    expect(applicantNoteInputSchema.safeParse({ body: "ok" }).success).toBe(false);
    expect(applicantNoteInputSchema.safeParse({ body: "ok", expectedLatestNoteId: null, collegeId: "x" }).success).toBe(false);
  });

  it("treats any difference from the seen latest note as stale", () => {
    expect(isApplicantNoteStale(null, null)).toBe(false);
    expect(isApplicantNoteStale(id, id)).toBe(false);
    expect(isApplicantNoteStale(id, null)).toBe(true);
    expect(isApplicantNoteStale(null, id)).toBe(true);
  });

  it("projects author labels, ownership and truncation without extra fields", () => {
    const snapshot = projectApplicantNotes(
      [
        { id, authorUserId: "u1", authorName: " Asha ", body: "b", createdAt: new Date("2026-10-15T05:00:00.000Z") },
        { id: "22222222-2222-4222-8222-222222222222", authorUserId: "u2", authorName: null, body: "c", createdAt: new Date("2026-10-14T05:00:00.000Z") },
      ],
      5,
      id,
      "u1",
    );
    expect(snapshot.truncated).toBe(true);
    expect(snapshot.notes.map((note) => [note.authorName, note.mine])).toEqual([["Asha", true], ["Team member", false]]);
    expect(Object.keys(snapshot.notes[0]!).sort()).toEqual(["authorName", "body", "createdAt", "id", "mine"]);
  });
});
