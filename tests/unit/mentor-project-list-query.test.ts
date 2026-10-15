import {describe,it,expect} from "vitest";
import {mentorProjectListQuerySchema as schema} from "@/modules/projects/mentor-project-list-query";
describe("Mentor Project list URL",()=>{
  it("defaults to bounded pagination and recent sort",()=>expect(schema.parse({})).toMatchObject({sort:"RECENT",page:1,pageSize:25}));
  it("retains recorded attention and primary-role facets",()=>expect(schema.parse({attention:"MENTOR_REQUESTED",assignment:"PRIMARY"})).toMatchObject({attention:"MENTOR_REQUESTED",assignment:"PRIMARY"}));
  it("rejects invalid search and oversized page",()=>{
    expect(schema.safeParse({search:"x".repeat(121)}).success).toBe(false);
    expect(schema.safeParse({page:10001}).success).toBe(false);
  });
  it("rejects forged scope and unknown selector",()=>{
    expect(schema.safeParse({collegeId:"tenant"}).success).toBe(false);
    expect(schema.safeParse({attention:"CUSTOM"}).success).toBe(false);
    expect(schema.safeParse({pageSize:250}).success).toBe(false);
  });
});

it("accepts normal empty optional select fields from GET forms",()=>{
  const value=schema.parse({
    search:"",status:"",attention:"",assignment:"",work:"",sort:"RECENT",pageSize:"25",
  });
  expect(value).toMatchObject({sort:"RECENT",pageSize:25});
  expect(value.status).toBeUndefined();
  expect(value.attention).toBeUndefined();
  expect(value.assignment).toBeUndefined();
  expect(value.work).toBeUndefined();
});
