import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Phase 10 motion and micro-interaction closure contracts", () => {
  test("structural route motion is opacity-only and honors reduced motion globally", () => {
    const motion = read("src/styles/components/_motion.scss");
    const accessibility = read("src/styles/components/_accessibility.scss");
    expect(motion).toContain(".lms-route-surface.is-route-transitioning");
    expect(motion).not.toMatch(/\.lms-route-surface\.is-route-transitioning\s*\{[^}]*transform:/s);
    expect(accessibility).toContain("@media (prefers-reduced-motion: reduce)");
  });

  test("cards, buttons, switches and interactive chips all expose immediate feedback", () => {
    expect(read("src/styles/components/_cards.scss")).toContain(".ant-card.ant-card-hoverable");
    expect(read("src/styles/components/_button.scss")).toContain("&:active:not(:disabled)");
    const antd = read("src/styles/components/_antddesign.scss");
    expect(antd).toContain(".ant-switch");
    expect(antd).toContain('.ant-tag[role="button"]');
    expect(antd).toContain('[aria-pressed="true"]');
  });

  test("dropdown/popover/collapse timing is tokenized instead of page-specific", () => {
    const antd = read("src/styles/components/_antddesign.scss");
    expect(antd).toContain('.ant-dropdown[class*="ant-slide-up-"]');
    expect(antd).toContain('.ant-popover[class*="ant-zoom-big-fast-"]');
    expect(antd).toContain(".ant-motion-collapse");
    expect(antd).toContain("$duration-fast");
    expect(antd).toContain("$duration-normal");
    expect(antd).toContain("$ease-std");
  });

  test("persistent sidebar motion is restrained and its collapsed rail cannot shrink", () => {
    const source = read("src/styles/layouts/sidenav.scss");
    expect(source).toContain("transition: width $duration-fast $ease-std");
    expect(source).toContain("flex-shrink: 0");
    expect(source).toContain("min-width: 6rem");
    expect(source).not.toContain("will-change: width");
  });
});
