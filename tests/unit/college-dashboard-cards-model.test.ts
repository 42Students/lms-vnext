import { describe, expect, it } from "vitest";
import {
  COLLEGE_DASHBOARD_CARD_DEFINITIONS,
  collegeDashboardCardsProjection,
  collegeDashboardEmptyRecordPrompts,
  collegeDashboardCardsQuerySchema,
  COLLEGE_AT_A_GLANCE_HEADING,
  COLLEGE_AT_A_GLANCE_KEYS,
  formatCollegeHeaderDate,
} from "@/modules/admin-ui/college-dashboard-cards-model";

describe("College dashboard count-card projection", () => {
  it("disallows caller-selected college and other query parameters", () => {
    expect(collegeDashboardCardsQuerySchema.parse({})).toEqual({});
    expect(collegeDashboardCardsQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  });
  it("renders sourced count zero separately from absent/unavailable counts", () => {
    const cards = collegeDashboardCardsProjection({students:0,faculty:13});
    const students = cards.find(x=>x.key==="students");
    const faculty = cards.find(x=>x.key==="faculty");
    const jobs = cards.find(x=>x.key==="jobs");
    expect(students?.count).toBe(0);
    expect(faculty?.count).toBe(13);
    expect(jobs?.count).toBeNull();
    expect(() => collegeDashboardCardsProjection({students:-1})).toThrow("DASHBOARD_COUNT_INVALID");
    expect(() => collegeDashboardCardsProjection({students:Number.NaN})).toThrow("DASHBOARD_COUNT_INVALID");
  });
  it("builds only source-zero, local-path prompts, never treats unknown counts as failures", () => {
    const cards = collegeDashboardCardsProjection({students:0,faculty:3,jobs:null});
    const prompts = collegeDashboardEmptyRecordPrompts(cards);
    expect(prompts.map(x=>x.key)).toEqual(["students"]);
    expect(prompts[0].href).toBe("/college/students");
    expect(prompts[0].hint).not.toMatch(/failed|blocked/i);
  });
  it("never generates an external or tenant-controlled navigation target", () => {
    const cards = collegeDashboardCardsProjection({});
    expect(cards).toHaveLength(COLLEGE_DASHBOARD_CARD_DEFINITIONS.length);
    expect(new Set(cards.map(x=>x.key)).size).toBe(cards.length);
    for(const card of cards) expect(card.href).toMatch(/^\/college\//);
  });
  it("COL-dashboard-02 shows the four legacy At a glance stats with legacy labels", () => {
    expect(COLLEGE_AT_A_GLANCE_HEADING).toBe("At a glance");
    const cards = collegeDashboardCardsProjection({});
    expect(COLLEGE_AT_A_GLANCE_KEYS.map(key => cards.find(c => c.key === key)?.label))
      .toEqual(["Students", "Faculty", "Courses", "Active drives"]);
  });
  it("COL-dashboard-11 formats the header date as dddd, D MMMM YYYY", () => {
    expect(formatCollegeHeaderDate(new Date(2026, 9, 16))).toBe("Friday, 16 October 2026");
    expect(formatCollegeHeaderDate(new Date(2026, 0, 4))).toBe("Sunday, 4 January 2026");
  });
});
