import { getSafeInternalReturnPath, isSameSiteRelativePath, withReturnTo } from "@/utils/navigationContext";

// A return path must never send someone to another site (open redirect).
describe("return paths stay on this site", () => {
  test.each([
    "//evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "/" + String.fromCharCode(92) + "evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "",
  ])("rejects %j", (value) => {
    expect(isSameSiteRelativePath(value)).toBe(false);
    expect(getSafeInternalReturnPath(value, { fallback: "/home" })).toBe("/home");
  });

  test("keeps a normal internal path with its query", () => {
    expect(getSafeInternalReturnPath("/tpo/batches?tab=open", { fallback: "/" })).toBe("/tpo/batches?tab=open");
  });

  test("withReturnTo drops an unsafe return path", () => {
    expect(withReturnTo("/tpo/drives/5", "/\t/evil.com")).toBe("/tpo/drives/5");
  });
});
