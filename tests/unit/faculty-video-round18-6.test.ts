import {expect,it} from "vitest";
import {facultyVideoStatusBadge} from "@/modules/courses/faculty-video-management-model";
it("never labels blocked or failed video as ready",()=>{
 expect(facultyVideoStatusBadge("READY")).toEqual({label:"Ready",tone:"success"});
 expect(facultyVideoStatusBadge("QUEUED").tone).toBe("neutral");
 expect(facultyVideoStatusBadge("PROCESSING").tone).toBe("warning");
 expect(facultyVideoStatusBadge("FAILED").tone).toBe("danger");
 expect(facultyVideoStatusBadge("BLOCKED").tone).toBe("danger");
});