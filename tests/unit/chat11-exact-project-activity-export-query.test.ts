
import {expect,it} from "vitest";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
import {mentorProjectActivityQuerySchema} from "@/modules/projects/mentor-project-activity-model";
const projectId="11111111-1111-4111-8111-111111111111";
it("does not export a secretly different history filter than the selected one",()=>{
 const allow=["importance","view","window"];
 expect(singleValueMentorExportFilters(new URLSearchParams("view=TEAM&view=TASKS"),allow)).toBeNull();
 const safe=singleValueMentorExportFilters(new URLSearchParams("view=TEAM"),allow);
 expect(mentorProjectActivityQuerySchema.parse({...safe,projectId}).view).toBe("TEAM");
});
