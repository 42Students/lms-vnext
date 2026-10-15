import{it,expect}from"vitest";import{mentorTaskReviewQuerySchema as schema,mentorTaskReviewHref as href}from"@/modules/projects/mentor-task-review-model";
const id="10000000-0000-4000-8000-000000000001";
it("accepts exact authorized project selector shapes",()=>{expect(schema.parse({projectId:id}).projectId).toBe(id);expect(href({projectId:id,page:2})).toContain("projectId="+id)});
it("rejects arbitrary or malformed project IDs",()=>{expect(schema.safeParse({projectId:"bad"}).success).toBe(false);expect(schema.parse({projectId:""}).projectId).toBeUndefined()});