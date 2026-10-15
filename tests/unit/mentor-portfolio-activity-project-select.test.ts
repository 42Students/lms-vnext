import{it,expect}from"vitest";import{mentorActivityQuerySchema as schema,mentorPortfolioHref as href}from"@/modules/projects/mentor-portfolio-model";
const id="10000000-0000-4000-8000-000000000001";
it("scopes event activity to a registered UUID selector",()=>{expect(schema.parse({projectId:id}).projectId).toBe(id);expect(href("activity",{projectId:id,page:2})).toContain("projectId="+id)});
it("rejects invalid or forged activity tenant filters",()=>{expect(schema.safeParse({projectId:"bad"}).success).toBe(false);expect(schema.safeParse({collegeId:id}).success).toBe(false)});