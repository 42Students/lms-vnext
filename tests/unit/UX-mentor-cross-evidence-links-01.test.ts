import {expect,it} from "vitest";
import {readFileSync} from "node:fs";
it("UX-mentor-cross-E01 source/demo/attachment links stay sanitized and 44px",()=>{
 const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx","utf8");
 expect(src).toContain("safeProjectExternalHref(v.sourceUrl)");
 expect(src).toContain("safeProjectExternalHref(v.demoUrl)");
 expect(src).toContain('safeProjectExternalHref(entry.url)');
 expect(src).toContain('rel="noopener noreferrer" className="inline-flex min-h-11 items-center');
 expect(src).toContain('className="ml-2 inline-flex min-h-11 max-w-full items-center');
});
