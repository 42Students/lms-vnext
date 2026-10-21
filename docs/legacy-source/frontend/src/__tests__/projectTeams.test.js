import { moveLearner, splitIntoTeams, teamTitle } from "@/utils/projectTeams";

const learners = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, rollNumber: `21CS${String(i + 1).padStart(3, "0")}` }));

describe("splitting a class into project teams", () => {
  test("team sizes differ by at most one (no lonely last team)", () => {
    const teams = splitIntoTeams(learners(23), 5);
    expect(teams.map((t) => t.length)).toEqual([5, 5, 5, 4, 4]);
  });

  test("everyone lands in exactly one team", () => {
    const teams = splitIntoTeams(learners(37), 6, { order: "random", seed: 9 });
    const ids = teams.flat().map((l) => l.id).sort((a, b) => a - b);
    expect(ids).toEqual(learners(37).map((l) => l.id));
  });

  test("roll order is numeric-aware and stable", () => {
    const list = [{ id: 1, rollNumber: "21CS10" }, { id: 2, rollNumber: "21CS2" }, { id: 3, rollNumber: "21CS1" }];
    expect(splitIntoTeams(list, 3)[0].map((l) => l.id)).toEqual([3, 2, 1]);
  });

  test("random order is repeatable for the same seed and differs for another", () => {
    const a = splitIntoTeams(learners(20), 4, { order: "random", seed: 3 }).flat().map((l) => l.id);
    const b = splitIntoTeams(learners(20), 4, { order: "random", seed: 3 }).flat().map((l) => l.id);
    const c = splitIntoTeams(learners(20), 4, { order: "random", seed: 4 }).flat().map((l) => l.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  test("moving a learner never duplicates them", () => {
    const teams = splitIntoTeams(learners(6), 3);
    const moved = moveLearner(teams, 1, 1);
    expect(moved[0].map((l) => l.id)).toEqual([2, 3]);
    expect(moved[1].map((l) => l.id)).toEqual([4, 5, 6, 1]);
    expect(moved.flat()).toHaveLength(6);
  });

  test("titles", () => {
    expect(teamTitle("Library App", 2)).toBe("Library App - Team 3");
  });

  test("empty class gives no teams", () => {
    expect(splitIntoTeams([], 5)).toEqual([]);
  });
});
