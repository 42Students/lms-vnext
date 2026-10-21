import fs from "fs";
import path from "path";

describe("mobile modal and native zoom accessibility", () => {
  const responsive = fs.readFileSync(path.join(process.cwd(), "src/styles/components/_responsive-hardening.scss"), "utf8");
  const app = fs.readFileSync(path.join(process.cwd(), "src/pages/_app.js"), "utf8");

  test("Projects modals regain bounded mobile vertical scrolling", () => {
    expect(responsive).toContain(".learn-projects-detail__task-modal-wrap");
    expect(responsive).toContain("overflow-y: auto !important;");
    expect(responsive).toContain("overscroll-behavior-y: contain;");
  });

  test("native shell does not disable user zoom", () => {
    expect(app).not.toContain("maximum-scale=1");
    expect(app).not.toContain("user-scalable=no");
    expect(app).not.toContain('addEventListener("gesturestart"');
    expect(app).not.toContain('addEventListener("touchmove"');
  });
});
