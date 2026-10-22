import {describe,expect,it} from "vitest";
import {collegeHiringAcademicScope} from "@/modules/placements/college-hiring-analytics-model";

const D="11111111-1111-4111-8111-111111111111";
const P="22222222-2222-4222-8222-222222222222";
const C="33333333-3333-4333-8333-333333333333";

describe("college hiring academic filter precedence",()=>{
  it("lets the batch win over program and department",()=>{
    expect(collegeHiringAcademicScope({departmentId:D,programId:P,cohortId:C}))
      .toEqual({cohortId:C,programId:undefined,departmentId:undefined,filtered:true});
  });
  it("lets the program win over the department",()=>{
    expect(collegeHiringAcademicScope({departmentId:D,programId:P}))
      .toEqual({cohortId:undefined,programId:P,departmentId:undefined,filtered:true});
  });
  it("keeps a department-only filter and reports unfiltered when nothing is chosen",()=>{
    expect(collegeHiringAcademicScope({departmentId:D}))
      .toEqual({cohortId:undefined,programId:undefined,departmentId:D,filtered:true});
    expect(collegeHiringAcademicScope({}).filtered).toBe(false);
  });
});
