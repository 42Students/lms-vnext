import {expect,it} from "vitest";
import {mentorActivityImportanceLabel} from "@/modules/projects/mentor-portfolio-model";
it("renders registered activity importance from a fixed non-sensitive label set",()=>{
 expect(mentorActivityImportanceLabel("HIGH")).toBe("High importance");
 expect(mentorActivityImportanceLabel("CRITICAL")).toBe("Critical importance");
 expect(mentorActivityImportanceLabel("PERSON:SECRET")).toBe("Importance not classified");
});
