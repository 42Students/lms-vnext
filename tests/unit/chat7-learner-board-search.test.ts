import { describe, expect, it } from "vitest";
import { filterLearnerBoardTasks, learnerBoardEmptyState, learnerBoardActiveFilterCount } from "@/modules/projects/learner-project-board-model";
const tasks=[
  {id:"1",title:"Implement API",description:"Write authorized read"},
  {id:"2",title:"Mobile board",description:null},
  {id:"3",title:"Regression test",description:"API consistency"},
];
describe("L25-014 mobile Board controls",()=>{
  it("counts active URL filters without inferring absent ones",()=>{
    expect(learnerBoardActiveFilterCount({search:"",priority:"",sprintId:"",releaseId:""})).toBe(0);
    expect(learnerBoardActiveFilterCount({search:" fix ",priority:"HIGH",sprintId:"",releaseId:"some-id"})).toBe(3);
  });
});
describe("L25-013 truthful learner Board empty states",()=>{
  it("distinguishes no persisted tasks from filtered-out tasks",()=>{
    expect(learnerBoardEmptyState(0,0)).toBe("NO_TASKS");
    expect(learnerBoardEmptyState(10,0)).toBe("FILTERED_EMPTY");
    expect(learnerBoardEmptyState(10,2)).toBe("RESULTS");
  });
});
describe("L25-005 learner Board release filter",()=>{
  it("filters by actual sprint-release ancestry and composes with priority",()=>{
    const releaseA="00000000-0000-4000-8000-000000000001";
    const releaseB="00000000-0000-4000-8000-000000000002";
    const taskRows=[
      {id:"a",title:"API",description:null,priority:"HIGH",sprintId:"s1"},
      {id:"b",title:"API",description:null,priority:"HIGH",sprintId:"s2"},
    ];
    const links=new Map([["s1",releaseA],["s2",releaseB]]);
    expect(filterLearnerBoardTasks(taskRows,"",{releaseId:releaseA,
      priority:"HIGH",sprintReleaseById:links}).map(t=>t.id)).toEqual(["a"]);
    expect(filterLearnerBoardTasks(taskRows,"",{releaseId:releaseB,
      sprintReleaseById:links}).map(t=>t.id)).toEqual(["b"]);
  });
});
describe("L25-003 project Board sprint scope",()=>{
  it("filters only own workspace task sprint alongside other choices",()=>{
    const tasks=[
      {id:"a",title:"Project",description:null,priority:"HIGH",sprintId:"00000000-0000-4000-8000-000000000001"},
      {id:"b",title:"Project",description:null,priority:"HIGH",sprintId:"00000000-0000-4000-8000-000000000002"},
    ];
    expect(filterLearnerBoardTasks(tasks,"",{sprintId:"00000000-0000-4000-8000-000000000001"}).map(task=>task.id)).toEqual(["a"]);
    expect(filterLearnerBoardTasks(tasks,"",{sprintId:"bad"})).toHaveLength(2);
  });
});
describe("L25-002 Project Board priority filter",()=>{
  it("keeps only actual persisted priority alongside matching search",()=>{
    const prioritized=[
      {id:"a",title:"API",description:null,priority:"HIGH"},
      {id:"b",title:"API",description:null,priority:"LOW"},
    ];
    expect(filterLearnerBoardTasks(prioritized,"api",{priority:"HIGH"}).map(t=>t.id)).toEqual(["a"]);
    expect(filterLearnerBoardTasks(prioritized,"",{priority:"invalid"})).toHaveLength(2);
  });
});
describe("L25-006 learner board search",()=>{
  it("matches title or description case insensitively without mutating the source",()=>{
    expect(filterLearnerBoardTasks(tasks,"api").map(t=>t.id)).toEqual(["1","3"]);
    expect(tasks).toHaveLength(3);
  });
  it("uses all tasks on missing or invalid query and isolates only valid matches",()=>{
    expect(filterLearnerBoardTasks(tasks,undefined)).toHaveLength(3);
    expect(filterLearnerBoardTasks(tasks,"x".repeat(101))).toHaveLength(3);
    expect(filterLearnerBoardTasks(tasks,"NO MATCH")).toEqual([]);
  });
});
