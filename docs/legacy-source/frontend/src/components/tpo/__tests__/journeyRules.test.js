import { bestDepth, bestText, companiesOf, filterByJourney, journeyFilterCount, splitForAdd } from "../ui/journeyRules";

const e = (jobId, company, depth, outcome, label = "x") => ({ jobId, company, depth, outcome, label });
const rows = [
  { learnerId: 1, journey: [e(10, "Infosys", 3, "NOT_SELECTED", "Not selected at Technical"), e(11, "TCS", 2, "CLEARED")], best: e(10, "Infosys", 3, "NOT_SELECTED", "Not selected at Technical") },
  { learnerId: 2, journey: [e(10, "Infosys", 4, "IN_PROGRESS")], best: e(10, "Infosys", 4, "IN_PROGRESS") },
  { learnerId: 3, journey: [e(12, "Wipro", 5, "PLACED")], best: e(12, "Wipro", 5, "PLACED") },
  { learnerId: 4, journey: [], best: null },
];
const ids = (r) => r.map((x) => x.learnerId);

describe("filterByJourney", () => {
  it("no filters keeps everyone", () => expect(ids(filterByJourney(rows, {}))).toEqual([1, 2, 3, 4]));
  it("by company", () => expect(ids(filterByJourney(rows, { company: "Infosys" }))).toEqual([1, 2]));
  it("reached at least a depth", () => expect(ids(filterByJourney(rows, { minDepth: 4 }))).toEqual([2, 3]));
  it("by outcome, where offered includes placed", () => {
    expect(ids(filterByJourney(rows, { outcome: "NOT_SELECTED" }))).toEqual([1]);
    expect(ids(filterByJourney(rows, { outcome: "OFFERED" }))).toEqual([3]);
  });
  it("conditions must hold on the SAME drive", () => {
    // student 1 reached depth 3 at Infosys and depth 2 at TCS: TCS + interview must not match
    expect(ids(filterByJourney(rows, { company: "TCS", minDepth: 3 }))).toEqual([]);
    expect(ids(filterByJourney(rows, { company: "Infosys", minDepth: 3, outcome: "NOT_SELECTED" }))).toEqual([1]);
  });
  it("students with no journey never match an active filter", () => expect(ids(filterByJourney(rows, { minDepth: 0 }))).not.toContain(4));
});

describe("helpers", () => {
  it("lists companies once, sorted", () => expect(companiesOf(rows)).toEqual(["Infosys", "TCS", "Wipro"]));
  it("counts filters", () => expect(journeyFilterCount({ company: "A", minDepth: 3, outcome: null })).toBe(2));
  it("says the best result in words", () => {
    expect(bestText(rows[0])).toBe("Infosys: Not selected at Technical");
    expect(bestText(rows[3])).toBe("");
  });
  it("sorts furthest first, nobody last", () => expect(rows.map(bestDepth)).toEqual([4, 5, 6, 0]));
  it("splits a selection into those already on the drive and the rest", () => {
    const { alreadyOn, canTry } = splitForAdd(rows, 10);
    expect(ids(alreadyOn)).toEqual([1, 2]);
    expect(ids(canTry)).toEqual([3, 4]);
  });
});
