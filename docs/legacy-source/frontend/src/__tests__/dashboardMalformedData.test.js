import { homeRows, nextUp } from "@/components/tpo/home/homeRows";

describe("dashboard malformed-data containment", () => {
  test("TPO home ignores null and primitive entries instead of crashing the page", () => {
    const malformed = {
      needsYou: [null, "bad", { type: "REQUESTS", count: 2, priority: 1, title: "Review requests", link: "/tpo/requests" }],
      batches: [null, "bad"],
      checklist: [null, { done: false, label: "Set up batches", link: "/tpo/batches" }],
      thisWeek: [null, "bad", { title: "Drive day", startsAt: "2026-10-07T10:00:00" }],
      numbers: "unexpected",
    };

    expect(() => homeRows(malformed)).not.toThrow();
    expect(() => nextUp(malformed)).not.toThrow();
    expect(homeRows(malformed)).toHaveLength(7);
    expect(nextUp(malformed)?.title).toBe("Review requests");
  });

  test("non-object dashboard payload still resolves to safe empty dashboard rows", () => {
    expect(() => homeRows("unexpected")).not.toThrow();
    expect(homeRows("unexpected")).toHaveLength(7);
    expect(nextUp("unexpected")).toBeNull();
  });
});
