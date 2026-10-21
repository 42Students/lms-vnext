import moment from "moment";
import { parsePlacementUtcDateTime, placementDateTimeToIso, parsePlacementCalendarDate, formatPlacementDateTime } from "@/utils/placementDateTime";
import { findConflictingInterviews } from "@/utils/interviewConflicts";
import { dj } from "@/components/tpo/dj";

describe("placement date/time contract", () => {
  test("Java arrays and Z strings resolve to the same instant", () => {
    const a = parsePlacementUtcDateTime([2026, 10, 2, 10, 15, 30, 123000000]);
    const b = parsePlacementUtcDateTime("2026-10-02T10:15:30.123Z");
    expect(a).not.toBeNull();
    expect(a.valueOf()).toBe(b.valueOf());
    expect(a.valueOf()).toBe(Date.parse("2026-10-02T10:15:30.123Z"));
  });

  test("offset-bearing timestamps preserve their instant", () => {
    expect(parsePlacementUtcDateTime("2026-10-02T15:45:00+05:30").valueOf())
      .toBe(Date.parse("2026-10-02T10:15:00Z"));
  });

  test("array-to-ISO conversion is UTC, not browser-local", () => {
    expect(placementDateTimeToIso([2026, 10, 2, 10, 15, 30])).toBe("2026-10-02T10:15:30.000Z");
  });

  test("bare all-day dates preserve the selected civil day", () => {
    expect(parsePlacementCalendarDate("2026-10-02").format("YYYY-MM-DD")).toBe("2026-10-02");
  });

  test("impossible array dates fail closed", () => {
    expect(parsePlacementUtcDateTime([2026, 2, 30, 10, 0])).toBeNull();
    expect(parsePlacementUtcDateTime([2026, 13, 1, 10, 0])).toBeNull();
  });

  test("TPO dayjs helper interprets Java arrays as UTC instants", () => {
    expect(dj([2026, 10, 2, 10, 15, 30]).valueOf()).toBe(Date.parse("2026-10-02T10:15:30Z"));
  });

  test("conflict detection supports Java-array timestamps", () => {
    const conflicts = findConflictingInterviews([{
      id: 1,
      interviewStatus: "SCHEDULED",
      scheduledDate: [2026, 10, 2, 10, 0, 0],
      durationMinutes: 60,
      learner: { id: 99 },
      job: { companyName: "Acme" },
    }], {
      learnerId: 99,
      companyName: "Acme",
      scheduledDate: "2026-10-02T10:30:00Z",
      durationMinutes: 60,
    });
    expect(conflicts.map((r) => r.id)).toEqual([1]);
  });

  test("formats Java timestamp arrays through the same UTC contract", () => {
    const expected = parsePlacementUtcDateTime([2026, 10, 2, 10, 15, 30]).format("DD MMM YYYY, hh:mm A");
    expect(formatPlacementDateTime([2026, 10, 2, 10, 15, 30])).toBe(expected);
  });

  test("Moment inputs retain the same instant", () => {
    const source = moment.utc("2026-10-02T10:15:00Z");
    expect(parsePlacementUtcDateTime(source).valueOf()).toBe(source.valueOf());
  });
});

describe("momentFromApi", () => {
  const { momentFromApi } = require("@/utils/placementDateTime");
  it("reads the array form as the stored UTC time, not a month late", () => {
    const m = momentFromApi([2026, 10, 12, 7, 21]);
    expect(m.utc().format("YYYY-MM-DD HH:mm")).toBe("2026-10-12 07:21");
  });
  it("leaves strings and dates exactly as moment() reads them", () => {
    expect(momentFromApi("2026-10-12T07:21:00Z").utc().format("HH:mm")).toBe("07:21");
    expect(momentFromApi("2026-10-12").format("YYYY-MM-DD")).toBe("2026-10-12");
  });
  it("a bad array is an invalid moment, never a wrong date", () => {
    expect(momentFromApi([2026, 13, 40]).isValid()).toBe(false);
  });
});
