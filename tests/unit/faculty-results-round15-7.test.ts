import {it,expect} from "vitest";
import {facultyResultsHref,facultyResultsQuerySchema} from "@/modules/courses/faculty-results-model";
it("keeps legacy result links valid while preserving new filter choices",()=>{
 const legacy={kind:"ALL" as const,status:"ALL" as const,deliveryId:undefined,search:"",page:1};
 expect(facultyResultsHref(legacy)).toBe("/teacher/results");
 const current=facultyResultsQuerySchema.parse({due:"UNDATED",sort:"TITLE",pageSize:10});
 const href=facultyResultsHref(current);
 expect(href).toContain("due=UNDATED");
 expect(href).toContain("sort=TITLE");
 expect(href).toContain("pageSize=10");
});
