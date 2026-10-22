import {expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(file:string)=>readFileSync(file,"utf8");

it("UX-mentor-cross-F04 keeps mobile editors accessible, 16px text and linked reschedule errors",()=>{
 const r=read("src/components/projects/mentor-meeting-reschedule.tsx");
 const n=read("src/components/projects/mentor-meeting-notes-editor.tsx");
 const b=read("src/components/projects/mentor-product-backlog.tsx");
 const sharedInput=read("src/components/ui/input.tsx");
 const sharedTextarea=read("src/components/ui/textarea.tsx");
 expect(r).toContain("aria-invalid={!parsed.success}");
 expect(r).toContain("aria-describedby={!parsed.success?");
 expect(r).toContain("validationId");
 expect(r).toContain("id={validationId}");
 expect(r).toContain('className="min-h-11 min-w-0 max-w-full md:min-h-9"');
 expect(n).toContain('aria-describedby={helpId}');
 expect(n).toContain("<Textarea");
 expect(b).toContain("p-2 text-base focus-visible:outline-2");
 expect(sharedInput).toContain("focus-visible:outline-2");
 expect(sharedInput).toContain("max-[767px]:min-h-11");
 expect(sharedTextarea).toContain("text-[var(--lms-font-base)]");
 expect(sharedTextarea).toContain("focus-visible:outline-2");
});
