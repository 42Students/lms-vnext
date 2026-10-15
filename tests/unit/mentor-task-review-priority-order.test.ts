import{it,expect}from"vitest";import{mentorTaskReviewQuerySchema as s,mentorTaskReviewHref as href}from"@/modules/projects/mentor-task-review-model";
it("allows the registered critical-priority sort mode",()=>expect(s.parse({order:"PRIORITY"}).order).toBe("PRIORITY"));
it("preserves priority sorting in page URLs",()=>expect(href({order:"PRIORITY",page:3})).toContain("order=PRIORITY"));
it("rejects unknown sort modes",()=>expect(s.safeParse({order:"UNSAFE"}).success).toBe(false));