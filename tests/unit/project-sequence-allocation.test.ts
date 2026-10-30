import {describe,expect,it} from "vitest";
import {nextProjectSequence} from "@/modules/projects/project-sequence-allocation";

describe("registered project sequence allocation",()=>{
  it("begins at zero and advances from the highest reserved record",()=>{
    expect(nextProjectSequence(null,"PROJECT_TASK_INVALID_STATE")).toBe(0);
    expect(nextProjectSequence(undefined,"PROJECT_TASK_INVALID_STATE")).toBe(0);
    expect(nextProjectSequence(0,"PROJECT_TASK_INVALID_STATE")).toBe(1);
    expect(nextProjectSequence(2147483646,"PROJECT_TASK_INVALID_STATE")).toBe(2147483647);
  });
  it.each(["PROJECT_TASK_INVALID_STATE","PROJECT_SPRINT_INVALID_STATE",
    "PROJECT_LIFECYCLE_INVALID_STATE"] as const)(
    "refuses int4 overflow without changing %s error semantics",(code)=>{
      expect(()=>nextProjectSequence(2147483647,code)).toThrowError(code);
    },
  );
  it("rejects non-integer, negative and corrupt sequence bounds",()=>{
    for(const n of [-2,1.5,Number.NaN,Number.POSITIVE_INFINITY,2147483648]){
      expect(()=>nextProjectSequence(n,"PROJECT_TASK_INVALID_STATE"))
        .toThrowError("PROJECT_TASK_INVALID_STATE");
    }
  });
});
