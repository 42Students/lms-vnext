import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Phase 11 responsive/mobile hardening closure", () => {
  test("the final responsive safety net is imported after role styles", () => {
    const imports = read("src/styles/components/components.scss");
    const marker = '@import "./responsive-hardening.scss";';
    expect(imports).toContain(marker);
    expect(imports.lastIndexOf(marker)).toBeGreaterThan(imports.lastIndexOf('@import "./learn-job-detail.scss";'));
  });

  test("phone, tablet and narrow-desktop breakpoints are explicitly covered", () => {
    const css = read("src/styles/components/_responsive-hardening.scss");
    expect(css).toContain("@media (max-width: 375px)");
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("@media (min-width: 768px) and (max-width: 1024px)");
    expect(css).toContain("@media (max-width: 1199px)");
  });

  test("tables own horizontal panning instead of widening the page", () => {
    const css = read("src/styles/components/_responsive-hardening.scss");
    expect(css).toContain(".ant-table-wrapper .ant-table-content");
    expect(css).toContain("overflow-x: auto !important");
    expect(css).toContain("overscroll-behavior-x: contain");
    expect(css).toContain("touch-action: pan-x pan-y");
    expect(css).toContain(".tpo-grid");
  });

  test("mobile overlays respect dynamic viewport and safe areas", () => {
    const css = read("src/styles/components/_responsive-hardening.scss");
    expect(css).toContain("100dvh");
    expect(css).toContain("safe-area-inset-top");
    expect(css).toContain("safe-area-inset-bottom");
    expect(css).toContain(".ant-modal-root .ant-modal");
    expect(css).toContain(".ant-drawer-root .ant-drawer-content-wrapper");
    expect(css).toContain(".ant-drawer-root:not(.ln-notification-drawer-root) .ant-drawer-body");
  });

  test("Projects modals restore bounded vertical scrolling on phones and short viewports", () => {
    const css = read("src/styles/components/_responsive-hardening.scss");
    expect(css).toContain(".learn-projects-detail__submission-modal-wrap");
    expect(css).toContain(".learn-projects-detail__member-modal-wrap");
    expect(css).toContain(".learn-projects-detail__task-modal-wrap");
    expect(css).toContain("overflow-y: auto !important");
    expect(css).toContain("max-height: calc(100dvh - 24px - env(safe-area-inset-top");
    expect(css).toContain("overscroll-behavior-y: contain");
  });

  test("mobile forms avoid keyboard zoom and touch controls keep minimum target size", () => {
    const css = read("src/styles/components/_responsive-hardening.scss");
    expect(css).toContain("font-size: 16px !important");
    expect(css).toContain("@media (pointer: coarse)");
    expect(css).toContain("min-height: 44px");
    expect(css).toContain("min-width: 44px");
  });

  test("long labels and high-zoom flex descendants can shrink/wrap", () => {
    const css = read("src/styles/components/_responsive-hardening.scss");
    expect(css).toContain("min-width: 0");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).toContain("word-break: break-word");
    expect(css).toContain(".listing-page-header__title");
    expect(css).toContain(".learn-projects__tab");
  });

  test("fixed mobile navigation already reserves safe-area/footer clearance", () => {
    const mobile = read("src/styles/components/_learn-mobile.scss");
    expect(mobile).toContain("safe-area-inset-bottom");
    expect(mobile).toContain("padding-bottom: calc(#{$learn-mobile-footer-height} + 24px");
    expect(mobile).toContain("min-height: $learn-touch-min");
  });
});
