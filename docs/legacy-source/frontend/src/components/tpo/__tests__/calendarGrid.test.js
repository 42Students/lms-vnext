import { dj } from "../dj";
import { HOUR_PX, GRID_START_HOUR, eventBox, isAllDay, layoutDay, nowOffset, slotFromOffset } from "../ui/calendarGrid";

const at = (h, m = 0) => `2026-10-12T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;

describe("eventBox", () => {
  it("places a 9:30 round 2.5 hours below the 7:00 start, one hour tall by default", () => {
    const b = eventBox({ type: "ROUND", startsAt: at(9, 30) });
    expect(b.top).toBe(2.5 * HOUR_PX);
    expect(b.height).toBe(HOUR_PX);
  });
  it("uses the real end time when there is one (a long event is as tall as it runs)", () => {
    expect(eventBox({ type: "ROUND", startsAt: at(10), endsAt: at(12) }).height).toBe(2 * HOUR_PX);
  });
  it("a follow-up is half an hour, and a tiny event still has a clickable height", () => {
    expect(eventBox({ type: "FOLLOW_UP", startsAt: at(11) }).height).toBe(HOUR_PX / 2);
    expect(eventBox({ type: "ROUND", startsAt: at(11), endsAt: at(11, 5) }).height).toBeGreaterThanOrEqual(22);
  });
  it("an event before the first hour is clamped into the grid, not lost", () => {
    expect(eventBox({ type: "ROUND", startsAt: at(5) }).top).toBe(0);
  });
});

describe("layoutDay", () => {
  it("overlapping events get their own lanes, others stay full width", () => {
    const laid = layoutDay([
      { id: 1, type: "ROUND", startsAt: at(9), endsAt: at(10) },
      { id: 2, type: "TALK", startsAt: at(9, 30), endsAt: at(10, 30) },
      { id: 3, type: "ROUND", startsAt: at(13), endsAt: at(14) },
    ]);
    const by = Object.fromEntries(laid.map((l) => [l.event.id, l]));
    expect([by[1].lane, by[2].lane]).toEqual([0, 1]);
    expect(by[1].lanes).toBe(2);
    expect(by[3]).toMatchObject({ lane: 0, lanes: 1 });
  });
  it("deadlines and blocked dates are all-day and never take a time lane", () => {
    expect(isAllDay({ type: "DEADLINE" })).toBe(true);
    expect(layoutDay([{ id: 9, type: "DEADLINE", startsAt: at(10) }])).toEqual([]);
  });
});

describe("slotFromOffset / nowOffset", () => {
  const day = dj("2026-10-12T00:00:00");
  it("turns a click into a time snapped to 15 minutes", () => {
    expect(slotFromOffset(day, 0).format("HH:mm")).toBe(`0${GRID_START_HOUR}:00`);
    expect(slotFromOffset(day, HOUR_PX * 2 + 14).format("HH:mm")).toBe("09:15");
    expect(slotFromOffset(day, HOUR_PX * 2 + 6).format("HH:mm")).toBe("09:00");
    expect(slotFromOffset(day, -50).format("HH:mm")).toBe("07:00");
    expect(slotFromOffset(day, 99999).format("HH:mm")).toBe("20:45");
  });
  it("now is a pixel offset inside the grid, or null outside it", () => {
    expect(nowOffset(dj("2026-10-12T08:00:00"))).toBe(HOUR_PX);
    expect(nowOffset(dj("2026-10-12T23:00:00"))).toBeNull();
    expect(nowOffset(dj("2026-10-12T03:00:00"))).toBeNull();
  });
});
