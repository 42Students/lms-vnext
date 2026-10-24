import {describe,expect,it} from "vitest";
import {deriveMentorStudentTaskSignals} from
  "@/modules/projects/mentor-student-task-signals-model";

const now=new Date("2026-10-24T12:00:00Z");
describe("Mentor task-based student watch signals",()=>{
  it("identifies a concentration using persisted open tasks, not personal risk",()=>{
    const signals=deriveMentorStudentTaskSignals({
      open:6,teamOpen:9,lastOpenTaskChange:"2026-10-23T12:00:00Z",
    },now);
    expect(signals.map(item=>item.kind)).toEqual(["CONCENTRATED_WORK"]);
    expect(signals[0]?.label).toContain("6 of the team's 9 open tasks");
  });
  it("labels unchanged open tasks without calling the student inactive",()=>{
    const signals=deriveMentorStudentTaskSignals({
      open:2,teamOpen:8,lastOpenTaskChange:"2026-10-15T12:00:00Z",
    },now);
    expect(signals.map(item=>item.kind)).toEqual(["UNCHANGED_TASKS"]);
    expect(signals[0]?.label).toBe("No assigned open task changed in 9 days");
  });
  it("does not create false alerts for tiny load or missing/future timestamps",()=>{
    for(const stamp of [null,"not-a-date","2026-11-01T12:00:00Z"]){
      expect(deriveMentorStudentTaskSignals({
        open:3,teamOpen:4,lastOpenTaskChange:stamp,
      },now)).toEqual([]);
    }
    expect(deriveMentorStudentTaskSignals({
      open:0,teamOpen:0,lastOpenTaskChange:"2025-01-01T00:00:00Z",
    },now)).toEqual([]);
  });
  it("can report both factual task conditions at once",()=>{
    expect(deriveMentorStudentTaskSignals({
      open:6,teamOpen:9,lastOpenTaskChange:"2026-10-10T12:00:00Z",
    },now).map(item=>item.kind)).toEqual([
      "UNCHANGED_TASKS","CONCENTRATED_WORK",
    ]);
  });
});
