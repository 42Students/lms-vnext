import { describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script without types
import { scanFile } from "../../scripts/ui-consistency-rules.mjs";

const rules = (path: string, source: string) => scanFile(path, source).map((f: { rule: string }) => f.rule);

describe("ui consistency rules", () => {
  it("flags raw controls outside the shared ui folder only", () => {
    expect(rules("src/components/x.tsx", "<button>a</button><table></table><h1>t</h1>")).toEqual(["raw-control", "raw-control", "raw-control"]);
    expect(rules("src/components/ui/button.tsx", "<button>a</button>")).toEqual([]);
    expect(rules("src/components/x.tsx", "<Button>a</Button><DataTable />")).toEqual([]);
  });
  it("flags hex colors but not anchors or comments", () => {
    expect(rules("src/components/x.css", ".a{color:#0a7c88}")).toEqual(["hex-color"]);
    expect(rules("src/components/x.tsx", '<Link href="#abc">x</Link> // #ffffff')).toEqual([]);
    expect(rules("src/app/globals.css", ":root{--a:#0a7c88}")).toEqual([]);
  });
  it("flags off-scale font sizes and radii", () => {
    expect(rules("src/x.css", "a{font-size:15px}b{font-size:14px}")).toEqual(["font-size-off-scale"]);
    expect(rules("src/x.tsx", 'className="text-[13px] text-[17px] rounded-[9px] rounded-[8px]"')).toEqual(["font-size-off-scale", "radius-off-scale"]);
    expect(rules("src/x.css", "a{border-radius:9px}b{border-radius:12px}")).toEqual(["radius-off-scale"]);
  });
  it("flags font families other than the Inter stack", () => {
    expect(rules("src/x.css", "a{font-family:Lato,Arial}")).toEqual(["font-family-off"]);
    expect(rules("src/x.css", "a{font-family:var(--font-inter), Inter, sans-serif}b{font-family:inherit}")).toEqual([]);
  });
});
