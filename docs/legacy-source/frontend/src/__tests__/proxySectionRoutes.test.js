// BE-0209: the Super Admin section files are routable by Next; the edge answers "not found" for them.
jest.mock("next/server", () => ({
  NextResponse: {
    rewrite: (url) => ({ kind: "rewrite", url: String(url) }),
    redirect: (url) => ({ kind: "redirect", url: String(url) }),
    next: () => ({ kind: "next" }),
  },
}));

const { proxy } = require("@/proxy");

const req = (path) => ({
  nextUrl: new URL(`https://nsrit.42lms.com${path}`),
  url: `https://nsrit.42lms.com${path}`,
  headers: new Map([["host", "nsrit.42lms.com"]]),
  cookies: { get: () => undefined },
});

test.each(["/superadmin/sections/Faculty", "/superadmin/sections", "/superadmin/sections/AdminUsers?x=1", "/SuperAdmin/Sections/Jobs"])(
  "%s answers not found",
  (path) => {
    const r = proxy(req(path));
    expect(r.kind).toBe("rewrite");
    expect(r.url).toMatch(/\/404$/);
  }
);

test("a real Super Admin page is not caught by it", () => {
  const r = proxy(req("/superadmin/teachers"));
  expect(r.url || "").not.toMatch(/\/404$/);
});
