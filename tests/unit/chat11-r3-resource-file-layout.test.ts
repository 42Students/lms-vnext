import {expect,it} from "vitest";
import {resourceFileListLayout,resourceFileListA11y} from "@/modules/projects/resource-file-layout-model";
it("provides mobile-first wrapping with no forced wide table",()=>{
 expect(resourceFileListLayout.list).toContain("grid-cols-1");
 expect(resourceFileListLayout.actions).toContain("flex-wrap");
 expect(resourceFileListLayout.name).toContain("break-all");
 expect(resourceFileListLayout.container).not.toContain("min-w-[");
});
it("announces counts and progress without untrusted file names",()=>{
 expect(resourceFileListA11y(1,false).statusText).toBe("1 attached file");
 expect(resourceFileListA11y(4,true).statusText).toMatch(/Updating/);
 expect(resourceFileListA11y(-1,false).statusText).toBe("0 attached files");
});
