import { describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script without types
import { scanFile } from "../../scripts/ui-consistency-rules.mjs";

const rules = (path: string, source: string) => scanFile(path, source).map((f: { rule: string }) => f.rule);

describe("ui consistency rules: extended categories", () => {
  it("flags colors that bypass tokens", () => {
    expect(rules("src/x.css", ".a{color:rgba(0,0,0,.5)}")).toContain("color-literal");
    expect(rules("src/x.css", ".a{background:white}")).toContain("color-literal");
    expect(rules("src/x.css", ".a{color:var(--lms-heading)}")).toEqual([]);
    expect(rules("src/x.tsx", 'className="text-slate-500 bg-white text-[color:var(--lms-heading)]"')).toEqual(["palette-class", "palette-class"]);
  });
  it("flags off-scale typography", () => {
    expect(rules("src/x.css", "a{font-weight:650}b{font-weight:600}")).toEqual(["font-weight-off-scale"]);
    expect(rules("src/x.css", "a{line-height:1.55}b{line-height:1.5}c{line-height:22px}")).toEqual(["line-height-off-scale"]);
    expect(rules("src/x.css", "a{letter-spacing:.07em}b{letter-spacing:.08em}")).toEqual(["letter-spacing-off-scale"]);
    expect(rules("src/x.tsx", 'className="font-[650] leading-[23px] tracking-[0.07em] font-semibold"')).toEqual(["font-weight-off-scale", "line-height-off-scale", "letter-spacing-off-scale"]);
  });
  it("flags spacing off the 4px grid", () => {
    expect(rules("src/x.css", "a{padding:9px 16px}b{margin:0 auto}c{gap:12px}")).toEqual(["spacing-off-grid"]);
    expect(rules("src/x.tsx", 'className="p-[13px] gap-[12px] px-3.5 py-1.5"')).toEqual(["spacing-off-grid", "spacing-off-grid"]);
  });
  it("flags shadow, z-index, important and motion literals", () => {
    expect(rules("src/x.css", "a{box-shadow:0 1px 2px #000}")).toContain("shadow-literal");
    expect(rules("src/x.css", "a{box-shadow:var(--lms-shadow-sm)}")).toEqual([]);
    expect(rules("src/x.css", "a{z-index:70}b{z-index:var(--lms-z-modal)}c{z-index:1}")).toEqual(["z-index-literal"]);
    expect(rules("src/x.css", "a{color:var(--lms-heading)!important}")).toEqual(["important"]);
    expect(rules("src/x.tsx", 'className="!w-20 hover:!px-2" const x = a && !b')).toEqual(["important", "important"]);
    expect(rules("src/x.css", "a{transition:color .2s ease}b{transition:color var(--lms-motion-fast) var(--lms-motion-ease)}")).toEqual(["motion-literal"]);
    expect(rules("src/x.css", "@keyframes spin{from{opacity:0}}")).toEqual(["keyframes-local"]);
    expect(rules("src/styles/motion.css", "@keyframes spin{from{opacity:0}}")).toEqual([]);
  });
  it("flags raw elements and arbitrary breakpoints", () => {
    expect(rules("src/x.tsx", "<h2>t</h2><a href=\"/x\">y</a><img src=\"a\" />")).toEqual(["raw-heading", "raw-link", "raw-image"]);
    expect(rules("src/x.tsx", 'className="min-[768px]:flex md:flex max-[767px]:hidden"')).toEqual(["breakpoint-off", "breakpoint-off"]);
    expect(rules("src/x.css", "@media (max-width: 767px){a{b:c}} @media (max-width: 800px){a{b:c}}")).toEqual(["breakpoint-off"]);
  });
  it("applies css checks to style objects", () => {
    expect(rules("src/x.tsx", "<div style={{ fontSize: 15, padding: 9, color: 'var(--lms-heading)' }} />")).toEqual(["font-size-off-scale", "spacing-off-grid"]);
  });
  it("does not count !important inside print or reduced-motion blocks", () => {
    expect(rules("src/x.css", "a{color:var(--x)!important}@media print{b{display:none!important}}@media (prefers-reduced-motion: reduce){c{animation:none!important}}")).toEqual(["important"]);
  });
});
