import {describe,expect,it} from "vitest";
import {
  buildMentorSprintSignOffSnapshot,parseMentorSprintSignOffSnapshot,
} from "@/modules/projects/mentor-sprint-signoff-snapshot-model";

const task=(status:string,assigneeMembershipId:string|null,
  estimatePoints:number|null,carriedFromSprintId:string|null=null)=>({
  status,assigneeMembershipId,estimatePoints,carriedFromSprintId,
});
const sprintId="00000000-0000-4000-8000-000000000013";
const memberA="00000000-0000-4000-8000-000000000001";
const memberB="00000000-0000-4000-8000-000000000002";

describe("Mentor immutable sprint sign-off workload snapshot",()=>{
  it("captures per-member, unassigned, planned and earned points at sign-off",()=>{
    const snapshot=buildMentorSprintSignOffSnapshot(sprintId,[
      task("DONE",memberA,5),
      task("IN_REVIEW",memberA,3),
      task("TODO",memberB,8,"00000000-0000-4000-8000-000000000012"),
      task("BLOCKED",null,2),
    ]);
    expect(snapshot).toMatchObject({
      version:1,sprintId,taskCount:4,plannedPoints:18,donePoints:5,
    });
    expect(snapshot.memberRows).toEqual([
      {membershipId:null,taskCount:1,doneCount:0,waitingCount:0,
        openCount:1,carriedCount:0,donePoints:0,plannedPoints:2,openPoints:2},
      {membershipId:memberA,taskCount:2,doneCount:1,waitingCount:1,
        openCount:0,carriedCount:0,donePoints:5,plannedPoints:8,openPoints:0},
      {membershipId:memberB,taskCount:1,doneCount:0,waitingCount:0,
        openCount:1,carriedCount:1,donePoints:0,plannedPoints:8,openPoints:8},
    ]);
    expect(parseMentorSprintSignOffSnapshot(snapshot,sprintId)).toEqual(snapshot);
  });

  it("does not change captured history after tasks move, drop, or reassign",()=>{
    const tasks=[task("DONE",memberA,5),task("TODO",memberB,8)];
    const frozen=buildMentorSprintSignOffSnapshot(sprintId,tasks);
    tasks[1]=task("DONE",memberA,13);
    expect(frozen.donePoints).toBe(5);
    expect(frozen.plannedPoints).toBe(13);
    expect(frozen.memberRows.find(row=>row.membershipId===memberB)?.openCount).toBe(1);
  });

  it("rejects wrong sprint, corrupted member sums and duplicate members",()=>{
    const record=buildMentorSprintSignOffSnapshot(sprintId,[
      task("DONE",memberA,5),task("TODO",memberB,8),
    ]);
    expect(parseMentorSprintSignOffSnapshot(record,"foreign")).toBeNull();
    expect(parseMentorSprintSignOffSnapshot({...record,donePoints:100},sprintId)).toBeNull();
    expect(parseMentorSprintSignOffSnapshot({...record,
      memberRows:[record.memberRows[0],record.memberRows[0]]},sprintId)).toBeNull();
    expect(parseMentorSprintSignOffSnapshot({...record,
      memberRows:[{...record.memberRows[0]!,openCount:999},record.memberRows[1]]},sprintId))
      .toBeNull();
  });

  it("supports empty and no-estimate snapshots without inventing velocity",()=>{
    const empty=buildMentorSprintSignOffSnapshot(sprintId,[]);
    expect(empty).toEqual({version:1,sprintId,plannedPoints:0,donePoints:0,
      taskCount:0,memberRows:[]});
    expect(buildMentorSprintSignOffSnapshot(sprintId,[task("DONE",memberA,null)])
      .donePoints).toBe(0);
    expect(parseMentorSprintSignOffSnapshot({version:0},sprintId)).toBeNull();
    expect(parseMentorSprintSignOffSnapshot(null,sprintId)).toBeNull();
  });
});
