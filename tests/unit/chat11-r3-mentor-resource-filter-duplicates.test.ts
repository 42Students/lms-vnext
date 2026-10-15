import {expect,it} from "vitest";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {mentorResourceDirectoryQuerySchema} from "@/modules/projects/mentor-resource-directory-model";
const projectId="11111111-1111-4111-8111-111111111111";
it("rejects conflicting or repeated project resource filters rather than selecting first",()=>{
 expect(singleValueMentorFilters({required:["REQUIRED","OPTIONAL"]})).toBeNull();
 expect(singleValueMentorFilters({page:["1","999"]})).toBeNull();
});
it("keeps valid scalar resource filters and lets Zod reject invalid enums",()=>{
 const values=singleValueMentorFilters({required:"REQUIRED",search:"notes",page:"2"});
 expect(mentorResourceDirectoryQuerySchema.parse({...values,projectId})).toMatchObject({required:"REQUIRED",search:"notes",page:2});
 expect(mentorResourceDirectoryQuerySchema.safeParse({projectId,required:"SECRET"}).success).toBe(false);
});
