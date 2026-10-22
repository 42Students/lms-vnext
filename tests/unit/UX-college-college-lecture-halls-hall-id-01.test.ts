import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/lecture-halls/[hallId]/page.tsx"),"utf8");
it("UX-college-college-lecture-halls-hall-id-01 keeps accessible shared screen state",()=>{
 expect(route).toContain('min-w-0 max-w-full');
 expect(route).toContain('aria-label="Filter lecture hall bookings"');
 expect(route).not.toContain("text-on-primary");
 expect(route).toContain('title="Invalid date range"');
 
});
