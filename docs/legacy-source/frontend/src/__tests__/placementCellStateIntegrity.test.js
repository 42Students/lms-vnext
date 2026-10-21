import fs from "fs";
import path from "path";

const src = fs.readFileSync(path.join(process.cwd(), "src/components/Placements/PlacementCellContent.js"), "utf8");
const offer = fs.readFileSync(path.join(process.cwd(), "src/components/Placements/student/OfferCard.jsx"), "utf8");

test("placement-cell overview and offer impact require verified payload shapes", () => {
  expect(src).toContain("const validOverview = (v) =>");
  expect(src).toContain("if (!validOverview(r?.data))");
  // Offers moved to their own tab (14 Oct 2026); the impact check moved with them.
  expect(offer).toContain("const validPreview = (v) =>");
  expect(offer).toContain("validPreview(r?.data?.data)");
});

test("consequential writes are single-flight and a failed accept stays recoverable", () => {
  expect(src).toContain("const actionRef = useRef(false)");
  expect(src).toContain("if (actionRef.current) return false");
  expect(offer).toContain("if (guard.current) return false;");
  expect(offer).toContain("if (await respond(true)) setPreview(null);");
  expect(offer).toContain("okButtonProps={{ disabled: busy || !preview?.data }}");
});

test("a new-request draft requires explicit discard", () => {
  expect(src).toContain("Discard this request?");
  expect(src).toContain("Your unsent request details will be lost.");
  expect(src).toContain("onValuesChange={() => setRequestDirty(true)}");
});
