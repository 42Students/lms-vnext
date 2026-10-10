import { describe, expect, it } from "vitest";
import {
  parsePeoplePage,
  peoplePageState,
  PEOPLE_PAGE_SIZE,
} from "@/modules/admin-ui/people-pagination";

describe("W06 People directory server-side pagination contract", () => {
  it("defaults malformed, negative, fractional, oversized, or tampered pages", () => {
    for (const input of [
      undefined, "", "0", "-1", "3.5", "abc", "1e4", "99999999", "1&collegeId=other", " 2",
    ]) expect(parsePeoplePage(input)).toBe(1);
    expect(parsePeoplePage("2")).toBe(2);
  });

  it("does not hide records beyond the first 100 and produces stable offsets", () => {
    expect(PEOPLE_PAGE_SIZE).toBe(50);
    const first = peoplePageState(1, 125);
    expect(first).toMatchObject({ page: 1, pages: 3, offset: 0, last: 50, hasNext: true });
    const second = peoplePageState(2, 125);
    expect(second).toMatchObject({ page: 2, offset: 50, first: 51, last: 100 });
    expect(peoplePageState(3, 125)).toMatchObject({ offset: 100, first: 101, last: 125, hasNext: false });
  });

  it("clamps stale page when changing selected college, never invents totals", () => {
    expect(peoplePageState(8, 12)).toMatchObject({ page: 1, offset: 0, pages: 1 });
    expect(peoplePageState(50, 0)).toMatchObject({ page: 1, first: 0, last: 0, hasNext: false });
    expect(peoplePageState(2, 50)).toMatchObject({ page: 1, pages: 1 });
  });
});
