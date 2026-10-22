import { describe, expect, it } from "vitest";
import { projectCompletionPercent } from "@/modules/projects/progress-percentage-policy";
import { summarizeLearnerProjectProgress } from "@/modules/projects/learner-project-progress-model";
import { summarizeSprintTasks } from "@/modules/projects/mentor-sprint-progress-model";
import { mentorTaskProgress } from "@/modules/projects/mentor-project-work-model";

describe("Legacy project progress display rounds percentages while completion remains a separate state", () => {
  it("rounds incomplete fractional percentages and preserves exact completion", () => {
    expect(projectCompletionPercent(199,200)).toBe(100);
    expect(projectCompletionPercent(99,100)).toBe(99);
    expect(projectCompletionPercent(2,3)).toBe(67);
    expect(projectCompletionPercent(200,200)).toBe(100);
    expect(projectCompletionPercent(0,0)).toBeNull();
  });
  it("uses the same policy for learner, mentor sprint and mentor task", () => {
    const tasks = Array.from({length:200},(_,i)=>({projectId:"one",status:i===199?"IN_REVIEW":"DONE"}));
    expect(summarizeLearnerProjectProgress(["one"],tasks)[0]?.percentage).toBe(100);
    expect(summarizeSprintTasks([{status:"DONE",total:199},{status:"IN_REVIEW",total:1}]).completionPercent).toBe(100);
    expect(mentorTaskProgress({total:200,open:1})?.percent).toBe(100);
    expect(mentorTaskProgress({total:200,open:0})?.percent).toBe(100);
  });
});
