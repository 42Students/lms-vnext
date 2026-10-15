import{it,expect}from"vitest";import{mentorTaskReviewQuerySchema as s,mentorTaskReviewHref as href}from"@/modules/projects/mentor-task-review-model";
it("filters an exact positive persisted submission version",()=>expect(s.parse({version:"2"}).version).toBe(2));
it("treats blank version as an unfiltered queue",()=>expect(s.parse({version:""}).version).toBeUndefined());
it("rejects noninteger or negative versions",()=>{expect(s.safeParse({version:"-1"}).success).toBe(false);expect(s.safeParse({version:"1.2"}).success).toBe(false);});
it("retains version in paging links",()=>expect(href({version:2,page:2})).toContain("version=2"));