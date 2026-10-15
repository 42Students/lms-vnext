import {expect,it} from "vitest";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
import {mentorResourceDirectoryQuerySchema} from "@/modules/projects/mentor-resource-directory-model";
const projectId="11111111-1111-4111-8111-111111111111";
const allowed=["required","link","description","order","search"] as const;
it("does not silently export a different scope from repeated or unrecognized filters",()=>{
 expect(singleValueMentorExportFilters(new URLSearchParams("required=ALL&required=REQUIRED"),allowed)).toBeNull();
 expect(singleValueMentorExportFilters(new URLSearchParams("projectId=other"),allowed)).toBeNull();
 expect(singleValueMentorExportFilters(new URLSearchParams("page=500"),allowed)).toBeNull();
});
it("preserves validated resource filters and uses an authoritative first export page",()=>{
 const filters=singleValueMentorExportFilters(new URLSearchParams("required=OPTIONAL&search=guide"),allowed);
 expect(mentorResourceDirectoryQuerySchema.parse({projectId,...filters,page:1})).toMatchObject({required:"OPTIONAL",search:"guide",page:1});
});
