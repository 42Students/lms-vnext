import{it,expect}from"vitest";import{mentorReviewQuerySchema as schema,mentorPortfolioHref as href}from"@/modules/projects/mentor-portfolio-model";
const id="10000000-0000-4000-8000-000000000001";
it("permits only a shaped UUID assigned-project selector",()=>{expect(schema.parse({projectId:id}).projectId).toBe(id);expect(href("reviews",{projectId:id,page:3})).toContain("projectId="+id)});
it("does not accept forged tenant or invalid project",()=>{expect(schema.safeParse({collegeId:id}).success).toBe(false);expect(schema.safeParse({projectId:"bogus"}).success).toBe(false)});