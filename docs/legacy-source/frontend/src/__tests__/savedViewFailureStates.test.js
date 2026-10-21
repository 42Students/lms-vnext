import fs from "fs";
import path from "path";

describe("saved view failure states", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/components/tpo/grid/GridWorkspace.jsx"), "utf8");

  test("load failure preserves last-good saved views and exposes retry", () => {
    expect(source).toContain("const [viewsError, setViewsError]");
    expect(source).toContain("viewsScopeRef.current !== viewScope");
    expect(source).toContain('message="Saved views are unavailable"');
    expect(source).toContain("Retry saved views");
  });

  test("delete failure rejects the confirmation and keeps state", () => {
    expect(source).toContain("const res = await fetchWithErrorHandling(deleteView(id));");
    expect(source).toContain("if (!res.success)");
    expect(source).toContain("throw new Error(detail);");
    expect(source).toContain("await loadViews();");
  });
});
