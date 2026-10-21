import { deadlineMs, isPastDeadline } from "../dateUtils";

// LRN-X-03: zone-less deadlines are India time on every device, matching the server.
describe("deadlineMs", () => {
  const expected = Date.UTC(2026, 9, 6, 12, 30, 0); // 18:00 IST = 12:30 UTC
  it("reads a zone-less string and a Jackson array as India time", () => {
    expect(deadlineMs("2026-10-06T18:00:00")).toBe(expected);
    expect(deadlineMs([2026, 10, 6, 18, 0])).toBe(expected);
  });
  it("uses an explicit zone as given", () => {
    expect(deadlineMs("2026-10-06T12:30:00Z")).toBe(expected);
    expect(deadlineMs("2026-10-06T18:00:00+05:30")).toBe(expected);
  });
  it("decides past/not past at the server's moment", () => {
    expect(isPastDeadline("2026-10-06T18:00:00", expected - 1000)).toBe(false);
    expect(isPastDeadline("2026-10-06T18:00:00", expected + 1000)).toBe(true);
    expect(isPastDeadline(null)).toBe(false);
  });
});
