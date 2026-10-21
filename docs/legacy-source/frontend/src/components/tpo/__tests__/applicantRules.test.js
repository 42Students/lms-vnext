import { BOARD_COLUMNS, activeFilterCount, canMove, filterApplicants, matchLettersToOffers, moveConsequence } from "../ui/applicantRules";

const rows = [
  { applicationId: 1, branch: "CSE", cgpa: 8.2, backlogs: 0, hasResume: true, skillMatch: 80, stage: "APPLIED" },
  { applicationId: 2, branch: "ECE", cgpa: 6.4, backlogs: 2, hasResume: true, skillMatch: 30, stage: "APPLIED" },
  { applicationId: 3, branch: "CSE", cgpa: null, backlogs: null, hasResume: false, skillMatch: null, stage: "SHORTLISTED" },
  { applicationId: 4, branch: "MECH", cgpa: 7.5, backlogs: 1, hasResume: false, skillMatch: 55, stage: "INTERVIEW" },
];
const ids = (r) => r.map((x) => x.applicationId);

describe("filterApplicants", () => {
  it("no filters keeps everyone", () => expect(ids(filterApplicants(rows, {}))).toEqual([1, 2, 3, 4]));
  it("branch is a multi-select", () => expect(ids(filterApplicants(rows, { branches: ["CSE", "MECH"] }))).toEqual([1, 3, 4]));
  it("minimum CGPA excludes students with no CGPA on record", () => expect(ids(filterApplicants(rows, { minCgpa: 7 }))).toEqual([1, 4]));
  it("a backlog filter (removed: the LMS has no source for backlogs) filters nothing", () => expect(ids(filterApplicants(rows, { maxBacklogs: 1 }))).toEqual([1, 2, 3, 4]));
  it("resume has / none", () => {
    expect(ids(filterApplicants(rows, { resume: "has" }))).toEqual([1, 2]);
    expect(ids(filterApplicants(rows, { resume: "none" }))).toEqual([3, 4]);
  });
  it("filters combine", () => expect(ids(filterApplicants(rows, { branches: ["CSE"], minCgpa: 8, resume: "has", minSkill: 70 }))).toEqual([1]));
  it("counts what is switched on", () => {
    expect(activeFilterCount({})).toBe(0);
    expect(activeFilterCount({ branches: ["CSE"], minCgpa: 7, resume: "has" })).toBe(3);
    expect(activeFilterCount({ resume: "any", minCgpa: "" })).toBe(0);
  });
});

describe("board moves", () => {
  it("allows moves to a drop column, never out of a final stage or onto itself or onto Applied", () => {
    expect(canMove("APPLIED", "SHORTLISTED")).toBe(true);
    expect(canMove("SHORTLISTED", "INTERVIEW")).toBe(true);
    expect(canMove("INTERVIEW", "REJECTED")).toBe(true);
    expect(canMove("SHORTLISTED", "SHORTLISTED")).toBe(false);
    expect(canMove("SHORTLISTED", "APPLIED")).toBe(false);
    expect(canMove("OFFERED", "REJECTED")).toBe(false);
    expect(canMove("HIRED", "INTERVIEW")).toBe(false);
    expect(canMove("APPLIED", "NOPE")).toBe(false);
  });
  it("every stage an applicant can be in has a column, so nobody disappears from the board", () => {
    const keys = BOARD_COLUMNS.map((c) => c.key);
    ["APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "WAITLISTED", "OFFERED", "HIRED", "REJECTED", "WITHDRAWN"].forEach((s) => expect(keys).toContain(s));
    expect(canMove("APPLIED", "OFFERED")).toBe(false);
    expect(canMove("APPLIED", "WAITLISTED")).toBe(false);
  });
  it("says who is told", () => {
    expect(moveConsequence("SHORTLISTED", 1)).toBe("1 student will be told they are shortlisted.");
    expect(moveConsequence("REJECTED", 12)).toMatch(/^12 students will be told they were not selected/);
  });
});

describe("matchLettersToOffers", () => {
  const offers = [{ offerId: 1, rollNumber: "21CS001" }, { offerId: 2, rollNumber: "21CS0011" }, { offerId: 3, rollNumber: "21EC007" }, { offerId: 4, rollNumber: null }];
  const f = (name) => ({ name });
  it("matches a roll number as a whole token, in any common naming", () => {
    const { matches, unmatched } = matchLettersToOffers([f("21cs001.pdf"), f("Offer_21EC007_final.PDF"), f("21CS0011-offer.pdf"), f("random.pdf")], offers);
    expect(matches.map((m) => [m.file.name, m.offer.offerId])).toEqual([["21cs001.pdf", 1], ["Offer_21EC007_final.PDF", 3], ["21CS0011-offer.pdf", 2]]);
    expect(unmatched.map((x) => x.name)).toEqual(["random.pdf"]);
  });
  it("a file naming two students, or a second file for the same student, is ambiguous and never attached", () => {
    const { matches, ambiguous } = matchLettersToOffers([f("21CS001_21EC007.pdf"), f("21CS001.pdf"), f("21CS001 (1).pdf")], offers);
    expect(matches.map((m) => m.offer.offerId)).toEqual([1]);
    expect(ambiguous.map((x) => x.name)).toEqual(["21CS001_21EC007.pdf", "21CS001 (1).pdf"]);
  });
});
