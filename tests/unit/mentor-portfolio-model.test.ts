import { describe, expect, it } from "vitest";
import {
  mentorActivityQuerySchema, mentorPortfolioHref, mentorReviewQuerySchema,
  pageMentorPortfolio, safeMentorProjectEventLabel, selectMentorReviewQueue,
} from "@/modules/projects/mentor-portfolio-model";
import type { MentorProjectAttention } from "@/modules/projects/mentor-attention";

const alerts: MentorProjectAttention[] = [
  { key:"a",kind:"REVIEW",projectId:"p1",title:"Review",description:"Atlas awaiting review",
    href:"/mentor/projects/p1?tab=delivery",occurredAt:"2026-10-14T00:00:00.000Z" },
  { key:"b",kind:"REQUESTED",projectId:"p1",title:"Meeting",description:"Atlas requested a meeting",
    href:"/mentor/projects/p1?tab=team",occurredAt:"2026-10-15T00:00:00.000Z" },
  { key:"c",kind:"REVIEW",projectId:"p2",title:"Review",description:"Beacon awaiting review",
    href:"/mentor/projects/p2?tab=delivery",occurredAt:"2026-10-13T00:00:00.000Z" },
];

describe("Mentor portfolio models", () => {
  it("filters exclusively review alerts, then searches by project description", () => {
    expect(selectMentorReviewQueue(alerts,"").map(a=>a.key)).toEqual(["a","c"]);
    expect(selectMentorReviewQueue(alerts,"beacon").map(a=>a.key)).toEqual(["c"]);
    expect(selectMentorReviewQueue(alerts,"requested")).toEqual([]);
  });
  it("clamps out-of-range pages", () => {
    expect(pageMentorPortfolio(alerts,{page:999,pageSize:2})).toMatchObject({
      total:3,totalPages:2,page:2,items:[alerts[2]],
    });
  });
  it("keeps activity names on a fixed safe allowlist", () => {
    expect(safeMentorProjectEventLabel("projects.project.created")).toBe("Project created");
    expect(safeMentorProjectEventLabel("projects.task.reviewed"))
      .toBe("Task review decision recorded");
    expect(safeMentorProjectEventLabel("projects.task.details_updated"))
      .toBe("Task details updated");
    expect(safeMentorProjectEventLabel("secret:person@example.com")).toBe("Project activity recorded");
  });
  it("rejects arbitrary caller-provided college, user and project identifiers", () => {
    expect(mentorReviewQuerySchema.safeParse({collegeId:"other"}).success).toBe(false);
    expect(mentorActivityQuerySchema.safeParse({projectId:"other"}).success).toBe(false);
    expect(mentorReviewQuerySchema.safeParse({search:"x".repeat(121)}).success).toBe(false);
    expect(mentorActivityQuerySchema.safeParse({page:"0"}).success).toBe(false);
    expect(mentorActivityQuerySchema.safeParse({pageSize:"51"}).success).toBe(false);
    expect(mentorActivityQuerySchema.safeParse({importance:"DANGEROUS"}).success).toBe(false);
    expect(mentorActivityQuerySchema.safeParse({view:"PERSONAL"}).success).toBe(false);
    expect(mentorActivityQuerySchema.parse({view:"REVIEWS"}).view).toBe("REVIEWS");
    expect(mentorPortfolioHref("activity",{view:"MEETINGS",page:2})).toBe("/mentor/activity?view=MEETINGS&page=2");
    expect(mentorActivityQuerySchema.parse({importance:"CRITICAL"}).importance).toBe("CRITICAL");
    expect(mentorPortfolioHref("activity",{importance:"HIGH",page:2})).toBe("/mentor/activity?importance=HIGH&page=2");
  });
  it("builds scoped-navigation URLs without tenant parameters", () => {
    expect(mentorPortfolioHref("reviews",{search:"Atlas",page:2,pageSize:50}))
      .toBe("/mentor/reviews?search=Atlas&page=2&pageSize=50");
    expect(mentorPortfolioHref("activity",{page:3})).toBe("/mentor/activity?page=3");
  });
});
