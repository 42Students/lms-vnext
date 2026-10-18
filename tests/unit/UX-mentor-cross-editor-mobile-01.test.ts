import {expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(file:string)=>readFileSync(file,"utf8");
it("UX-mentor-cross-F04 keeps mobile editors 16px and ties reschedule errors to inputs",()=>{
 const r=read("src/components/projects/mentor-meeting-reschedule.tsx");
 const n=read("src/components/projects/mentor-meeting-notes-editor.tsx");
 const b=read("src/components/projects/mentor-product-backlog.tsx");
 expect(r).toContain("aria-invalid={!parsed.success}");
 expect(r).toContain("aria-describedby={!parsed.success?validationId:undefined}");
 expect(r).toContain("id={validationId}");
 expect(r).toContain("text-base focus-visible:outline-2");
 expect(n).toContain("py-2 text-base text-foreground focus-visible:outline-2");
 expect(b).toContain("bg-background p-2 text-base focus-visible:outline-2");
});
