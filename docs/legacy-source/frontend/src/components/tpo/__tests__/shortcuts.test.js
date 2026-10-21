import { isTypingTarget, resolveShortcut } from "../ui/shortcuts";

const press = (key, extra = {}) => resolveShortcut({ key, ...extra });

describe("shortcuts", () => {
  it("? opens help", () => expect(press("?")).toEqual({ action: "help" }));
  it("g then a letter goes to a page, only if pressed together", () => {
    const first = press("g");
    expect(first).toEqual({ action: "pending", key: "g" });
    expect(press("d", { prevKey: "g", prevAt: 1000, now: 1500 })).toEqual({ action: "go", href: "/tpo/drives" });
    expect(press("d", { prevKey: "g", prevAt: 1000, now: 3000 })).toBeNull(); // too slow
    expect(press("x", { prevKey: "g", prevAt: 1000, now: 1200 })).toBeNull();
  });
  it("n then l/d starts something new", () => {
    expect(press("l", { prevKey: "n", prevAt: 10, now: 100 })).toEqual({ action: "go", href: "/tpo/recruiters?add=1" });
    expect(press("d", { prevKey: "n", prevAt: 10, now: 100 })).toEqual({ action: "go", href: "/tpo/drives/new" });
  });
  it("never fires while typing or with a modifier (Ctrl+K belongs to search)", () => {
    expect(press("?", { typing: true })).toBeNull();
    expect(press("g", { typing: true })).toBeNull();
    expect(press("k", { modifiers: true })).toBeNull();
  });
  it("knows what counts as typing", () => {
    expect(isTypingTarget({ tagName: "INPUT" })).toBe(true);
    expect(isTypingTarget({ tagName: "textarea" })).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: "BUTTON" })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
