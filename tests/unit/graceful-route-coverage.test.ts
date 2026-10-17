import { describe, expect, it } from "vitest";
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";

function routeSegments(root: string): string[] {
  const output: string[] = [];
  function visit(dir: string) {
    const items = readdirSync(dir, { withFileTypes: true });
    if (items.some((item) => item.isFile() && (item.name === "page.tsx" || item.name === "layout.tsx"))) {
      output.push(dir);
    }
    for (const item of items) if (item.isDirectory()) visit(path.join(dir, item.name));
  }
  visit(root);
  return output;
}

/** Next App Router inherits loading/error boundaries from ancestor layouts.
 * A leaf need not duplicate one if its parent already catches failures. */
function hasInheritedBoundary(dir:string,filename:"loading.tsx"|"error.tsx"){
 let current=dir;
 while(current==="src/app"||current.startsWith("src/app"+path.sep)){
  if(existsSync(path.join(current,filename)))return true;
  if(current==="src/app")break;
  current=path.dirname(current);
 }
 return false;
}

describe("route error and loading coverage", () => {
  it("GR-19 GR-20 root and authenticated layouts explicitly supply inherited boundaries",()=>{
    for(const root of ["src/app","src/app/(authenticated)"]){
      expect(existsSync(path.join(root,"loading.tsx")),root).toBe(true);
      expect(existsSync(path.join(root,"error.tsx")),root).toBe(true);
    }
  });
  it("GR-19 every page/layout segment has a bounded loading fallback", () => {
    const missing = routeSegments("src/app").filter((dir) => !hasInheritedBoundary(dir, "loading.tsx"));
    expect(missing, `Missing loading boundaries: ${missing.join(", ")}`).toEqual([]);
  });
  it("GR-20 every page/layout segment has a customer-safe retry boundary", () => {
    const missing = routeSegments("src/app").filter((dir) => !hasInheritedBoundary(dir, "error.tsx"));
    expect(missing, `Missing error boundaries: ${missing.join(", ")}`).toEqual([]);
  });
});
