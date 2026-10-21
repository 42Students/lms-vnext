import {
  getRouteScrollStorageKey,
  readRouteScroll,
  writeRouteScroll,
} from "../useRouteScrollRestoration";

describe("route scroll restoration storage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  test("stores scroll per full route including query state", () => {
    writeRouteScroll("/learn/projects?page=3&status=active", { x: 12, y: 840 });

    expect(readRouteScroll("/learn/projects?page=3&status=active")).toEqual({
      x: 12,
      y: 840,
    });
    expect(readRouteScroll("/learn/projects?page=1")).toBeNull();
  });

  test("rejects malformed stored positions safely", () => {
    window.sessionStorage.setItem(
      getRouteScrollStorageKey("/learn/courses"),
      JSON.stringify({ x: "bad", y: 100 })
    );

    expect(readRouteScroll("/learn/courses")).toBeNull();
  });

  test("normalizes negative coordinates instead of restoring outside the document", () => {
    writeRouteScroll("/tpo/drives", { x: -50, y: -10 });
    expect(readRouteScroll("/tpo/drives")).toEqual({ x: 0, y: 0 });
  });
});
