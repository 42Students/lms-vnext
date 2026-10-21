import { generateSlots, toMinutes, MAX_SLOTS } from "../ui/slotGenerator";
import { parseRolls, matchRolls, buildResultRows } from "../ui/rollParser";

describe("generateSlots", () => {
  const base = { date: "2026-10-12", start: "09:00", end: "11:00", lengthMin: 20 };
  it("fills the window with back-to-back slots", () => {
    const { slots, error } = generateSlots(base);
    expect(error).toBeNull();
    expect(slots).toHaveLength(6);
    expect(slots[0]).toMatchObject({ startsAt: "2026-10-12T09:00:00", endsAt: "2026-10-12T09:20:00", capacity: 1 });
    expect(slots[5].endsAt).toBe("2026-10-12T11:00:00");
  });
  it("does not create a slot that runs past the end", () => {
    const { slots } = generateSlots({ ...base, end: "10:50" });
    expect(slots).toHaveLength(5);
    expect(slots[4].endsAt).toBe("2026-10-12T10:40:00");
  });
  it("runs every panel on the same grid", () => {
    const { slots } = generateSlots({ ...base, rooms: ["Panel A", "Panel B"] });
    expect(slots).toHaveLength(12);
    expect(slots.filter((s) => s.room === "Panel B")).toHaveLength(6);
    expect(slots[0].startsAt).toBe(slots[1].startsAt);
    expect(slots[0].panel).toBe("Panel A");
  });
  it("leaves a break after every N slots and a gap between slots", () => {
    const { slots } = generateSlots({ ...base, end: "12:00", breakEvery: 3, breakMin: 30 });
    expect(slots[2].endsAt).toBe("2026-10-12T10:00:00");
    expect(slots[3].startsAt).toBe("2026-10-12T10:30:00");
    const gapped = generateSlots({ ...base, gapMin: 5 }).slots;
    expect(gapped[1].startsAt).toBe("2026-10-12T09:25:00");
  });
  it("says what is wrong in plain words", () => {
    expect(generateSlots({ ...base, date: "" }).error).toMatch(/date/i);
    expect(generateSlots({ ...base, start: "9am" }).error).toMatch(/time/i);
    expect(generateSlots({ ...base, end: "08:00" }).error).toMatch(/after/i);
    expect(generateSlots({ ...base, lengthMin: 1 }).error).toMatch(/between 5 and 480/);
    expect(generateSlots({ ...base, start: "09:00", end: "09:10", lengthMin: 20 }).error).toMatch(/No slot fits/);
    expect(generateSlots({ ...base, start: "00:00", end: "23:59", lengthMin: 5, rooms: ["a", "b"] }).error).toMatch(new RegExp(String(MAX_SLOTS)));
  });
  it("capacity defaults to one and is a whole number", () => {
    expect(generateSlots({ ...base, capacity: 40 }).slots[0].capacity).toBe(40);
    expect(generateSlots({ ...base, capacity: 0 }).slots[0].capacity).toBe(1);
  });
  it("toMinutes", () => {
    expect(toMinutes("09:30")).toBe(570);
    expect(toMinutes("24:00")).toBeNull();
    expect(toMinutes("")).toBeNull();
  });
});

describe("pasted roll numbers", () => {
  it("splits on anything, upper-cases and removes duplicates", () => {
    expect(parseRolls("21cs001, 21CS002\n21cs003;  21CS001")).toEqual(["21CS001", "21CS002", "21CS003"]);
    expect(parseRolls("1. 21CS001\n2) 21CS002")).toEqual(["21CS001", "21CS002"]);
    expect(parseRolls("  \n ")).toEqual([]);
  });
  const applicants = [{ applicationId: 1, rollNumber: "21CS001" }, { applicationId: 2, rollNumber: "21cs002" }, { applicationId: 3, rollNumber: null, publicRef: "A3" }];
  it("matches case-insensitively and reports the rest", () => {
    const { matched, unmatched } = matchRolls(["21CS001", "21CS002", "99XX999"], applicants);
    expect(matched.map((a) => a.applicationId)).toEqual([1, 2]);
    expect(unmatched).toEqual(["99XX999"]);
  });
  it("builds import rows, falling back to the application id when there is no roll number", () => {
    const rows = buildResultRows({ 1: "PASS", 2: "FAIL", 3: "HOLD", 9: "PASS", 4: "" }, applicants);
    expect(rows).toEqual([{ roll: "21CS001", outcome: "PASS" }, { roll: "21cs002", outcome: "FAIL" }, { applicationId: 3, outcome: "HOLD" }]);
  });
});
