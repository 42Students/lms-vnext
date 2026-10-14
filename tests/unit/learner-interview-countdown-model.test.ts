import {describe,expect,it} from "vitest";
import {learnerInterviewCountdown} from "@/modules/placements/learner-interview-countdown-model";
const scheduledAt="2026-10-16T08:00:00Z";
describe("learner scheduled interview countdown",()=>{
it("uses actual future time with compact day/hour/minute countdown",()=>{
expect(learnerInterviewCountdown({scheduledAt,durationMinutes:45},
Date.parse("2026-10-14T08:00:00Z"))).toEqual({label:"Starts in 2d 0h",phase:"UPCOMING"});
expect(learnerInterviewCountdown({scheduledAt,durationMinutes:45},
Date.parse("2026-10-16T07:00:00Z")).label).toBe("Starts in 1h 0m");
});
it("never calls a scheduled window confirmed employer attendance",()=>{
expect(learnerInterviewCountdown({scheduledAt,durationMinutes:45},
Date.parse("2026-10-16T08:10:00Z")).label).toContain("attendance unconfirmed");
expect(learnerInterviewCountdown({scheduledAt,durationMinutes:45},
Date.parse("2026-10-16T09:00:00Z")).phase).toBe("PAST");
expect(learnerInterviewCountdown({scheduledAt:null,durationMinutes:null},0).phase).toBe("PENDING");
});
});