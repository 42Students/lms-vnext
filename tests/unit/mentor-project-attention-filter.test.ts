import {describe,expect,it} from "vitest";import {matchesMentorProjectAttention as f}from"@/modules/projects/mentor-project-attention-filter-model";
describe("Mentor project attention filtering",()=>{it("retains unfiltered projects",()=>expect(f(undefined,undefined)).toBe(true));it("matches requests, not delivery reviews",()=>{expect(f("MENTOR_REQUESTED",new Set(["REQUESTED"]))).toBe(true);expect(f("MENTOR_REQUESTED",new Set(["REVIEW"]))).toBe(false)});});

it("recognizes only registered stalled alerts",()=>{expect(f("MENTOR_STALLED",new Set(["STALLED"]))).toBe(true);expect(f("MENTOR_STALLED",new Set(["REVIEW"]))).toBe(false);});

it("matches only upcoming meeting alerts",()=>{expect(f("MENTOR_MEETING_SOON",new Set(["MEETING_SOON"]))).toBe(true);expect(f("MENTOR_MEETING_SOON",new Set(["STALLED"]))).toBe(false);});

it("accepts any recorded assigned-project attention",()=>{expect(f("MENTOR_ANY_ATTENTION",new Set(["REVIEW"]))).toBe(true);expect(f("MENTOR_ANY_ATTENTION",new Set())).toBe(false);expect(f("MENTOR_ANY_ATTENTION",undefined)).toBe(false);});

it("detects absent registered attention without claiming project health",()=>{expect(f("MENTOR_NO_ATTENTION",new Set())).toBe(true);expect(f("MENTOR_NO_ATTENTION",undefined)).toBe(true);expect(f("MENTOR_NO_ATTENTION",new Set(["STALLED"]))).toBe(false);});

it("never treats learner-only action as Mentor attention",()=>{expect(f("LEARNER_ACTION",new Set(["REVIEW"]))).toBe(false);});
