import{it,expect}from"vitest";import{mentorActivityQuerySchema as schema,mentorPortfolioHref}from"@/modules/projects/mentor-portfolio-model";
it("supports deterministic earliest activity first",()=>expect(schema.parse({order:"OLDEST"}).order).toBe("OLDEST"));
it("keeps activity chronology in paging href",()=>expect(mentorPortfolioHref("activity",{order:"OLDEST",page:3})).toContain("order=OLDEST"));
it("rejects arbitrary chronology",()=>expect(schema.safeParse({order:"RANDOM"}).success).toBe(false));