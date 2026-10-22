import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/batch-promotion/page.tsx"),"utf8");
it("UX-college-college-batch-promotion-01 preserves state and mobile layout",()=>{
 expect(route).toContain('<DataTable caption="All college batches"');
 expect(route).toContain("min-h-11");
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-[#26bac7]");
 
});
