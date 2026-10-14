import {describe,expect,it} from "vitest";
import {facultyContactReadQuerySchema,facultyContactStorageAvailability}
 from "@/modules/people/faculty-contact-availability-model";
describe("Faculty own optional contacts are not migrated",()=>{
 it("keeps editing blocked and refuses request properties",()=>{
  expect(facultyContactStorageAvailability().editable).toBe(false);
  expect(facultyContactReadQuerySchema.safeParse({}).success).toBe(true);
  expect(facultyContactReadQuerySchema.safeParse({contactEmail:"x@y.test"}).success).toBe(false);
  expect(facultyContactReadQuerySchema.safeParse({alternatePhone:"+91999"}).success).toBe(false);
  expect(facultyContactReadQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
 });
});
