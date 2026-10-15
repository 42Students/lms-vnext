import {describe,expect,it} from "vitest";import {matchesMentorProjectAttention as f}from"@/modules/projects/mentor-project-attention-filter-model";
describe("Mentor project attention filtering",()=>{it("retains unfiltered projects",()=>expect(f(undefined,undefined)).toBe(true));it("matches requests, not delivery reviews",()=>{expect(f("MENTOR_REQUESTED",new Set(["REQUESTED"]))).toBe(true);expect(f("MENTOR_REQUESTED",new Set(["REVIEW"]))).toBe(false)});});

it("recognizes only registered stalled alerts",()=>{expect(f("MENTOR_STALLED",new Set(["STALLED"]))).toBe(true);expect(f("MENTOR_STALLED",new Set(["REVIEW"]))).toBe(false);});
