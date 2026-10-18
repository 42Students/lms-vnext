import { describe, expect, it } from "vitest";
import {
  facultyRosterDisplayName, facultyRosterMetrics,
  facultyRosterPhotoPreview, sortFacultyRosterByRollThenName,
} from "@/modules/courses/faculty-roster-display-model";
const avatarId = "11111111-1111-4111-8111-111111111111";
const learner = (
  membershipId: string, rollNumber: string | null, displayName: string | null,
  email: string | null = null, phoneE164: string | null = null,
) => ({ membershipId, rollNumber, displayName, email, phoneE164 });
describe("FAC-ROSTER-PRIVACY-01 authorized Section roster presentation and files", () => {
  it("sorts natural roll numbers before no-roll learners and does not mutate the input", () => {
    const input = [
      learner("a", "10", "Asha"), learner("b", null, "Bala"),
      learner("c", "2", "Chandra"), learner("d", "2", "Amal"),
    ];
    expect(sortFacultyRosterByRollThenName(input).map(item => item.membershipId))
      .toEqual(["d", "c", "a", "b"]);
    expect(input.map(item => item.membershipId)).toEqual(["a", "b", "c", "d"]);
  });

  it("uses sanitized display name, permitted fallback email and stable opaque membership prefix", () => {
    expect(facultyRosterDisplayName(learner("learner-id-1234", "1", "  Asha  "))).toBe("Asha");
    expect(facultyRosterDisplayName(learner("learner-id-1234", "1", "", " test@example.org ")))
      .toBe("test@example.org");
    expect(facultyRosterDisplayName(learner("learner-id-1234", null, null)))
      .toBe("Learner learner-");
  });

  it("does not call blank whitespace contact values a contact and counts absent rolls accurately", () => {
    const data = [
      learner("a", "1", "A", "   ", null),
      learner("b", null, "B", "b@example.org", null),
      learner("c", "", "C", null, " +91 "),
    ];
    expect(facultyRosterMetrics(data)).toMatchObject({
      contacts: 2, missingRoll: 2, contactLabel: "2 contacts",
      rollLabel: "2 without a roll number",
    });
  });

  it("only surfaces a same-origin file grant with a canonical UUID in its path", () => {
    const allowed = "/api/files/" + avatarId + "/download";
    expect(facultyRosterPhotoPreview(allowed)).toBe(allowed);
    expect(facultyRosterPhotoPreview(allowed + "?token=abc123")).toBe(allowed + "?token=abc123");
    for (const value of [
      null, {}, "https://evil.example/" + allowed, "//evil.example/avatar",
      "/api/files/" + "-".repeat(36) + "/download",
      "/api/files/" + avatarId + "/../download",
      allowed + "#fragment", allowed + "?next=/attacker",
      allowed + "?redirect=https://evil.example",
      allowed + "?x=" + "a".repeat(500),
    ]) {
      expect(facultyRosterPhotoPreview(value)).toBeNull();
    }
  });
});
