import { describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script without types
import { auditSamples, rgbKey, summarize, tokenRgbSet } from "../../scripts/ui-style-audit-core.mjs";

const options = { tokenColors: tokenRgbSet("a{color:#0a7c88;background:#f1f4f9}"), motionTokens: [150, 250, 350], shadowTokens: ["none"], zTokens: [100] };
const sample = (style: Record<string, unknown>) => ({ route: "/x", selector: "div", style });

describe("ui style audit core", () => {
  it("parses computed colors", () => {
    expect(rgbKey("rgb(10, 124, 136)")).toBe("10,124,136");
    expect(rgbKey("rgba(10, 124, 136, 0.15)")).toBe("10,124,136");
    expect(rgbKey("color(srgb 0.0392 0.4863 0.5333 / 0.15)")).toBe("10,124,136");
    expect(rgbKey("rgba(0, 0, 0, 0)")).toBeNull();
  });
  it("accepts on-system values", () => {
    const f = auditSamples([sample({ fontSize: "14px", fontWeight: "600", lineHeight: "20px", borderRadius: "10px", color: "rgb(10, 124, 136)", spacings: ["8px", "12px", "0px"], durations: ["0.15s"], fontFamily: "Inter, sans-serif" })], options);
    expect(f).toEqual([]);
  });
  it("flags off-system values with counts", () => {
    const f = auditSamples([
      sample({ fontSize: "15px", fontWeight: "650", borderRadius: "9px", color: "rgb(1, 2, 3)", spacings: ["9px"], durations: ["0.2s"], fontFamily: "Lato, Arial", zIndex: "70", boxShadow: "rgba(0, 0, 0, 0.2) 0px 2px 8px 0px" }),
      sample({ fontSize: "15px" }),
    ], options);
    const kinds = f.map((x: { kind: string }) => x.kind).sort();
    expect(kinds).toEqual(["borderRadius", "boxShadow", "color", "fontFamily", "fontSize", "fontWeight", "motion", "spacing", "zIndex"]);
    expect(f.find((x: { kind: string }) => x.kind === "fontSize").count).toBe(2);
    expect(summarize(f).distinctOffSystemValues).toBe(9);
  });
});
