import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx"),"utf8");
it("UX-college-college-electives-slot-id-allocate-01 preserves mobile UX and route policy",()=>{
 expect(route).toContain("overflow-x-clip");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-primary-text");
 
});
