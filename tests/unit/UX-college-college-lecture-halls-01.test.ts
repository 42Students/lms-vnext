import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/lecture-halls/page.tsx"),"utf8");
it("UX-college-college-lecture-halls-01 keeps accessible shared screen state",()=>{
 expect(route).toContain('aria-label="Lecture hall results"');
 expect(route).toContain('className="min-w-0 space-y-4"');
 expect(route).toContain("LectureHallManager");
 expect(route).toContain('title="Could not load lecture halls"');
 expect(route).not.toContain("text-on-primary");
 expect(route).not.toContain("text-primary-text");
 
});
