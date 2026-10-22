import {beforeEach,describe,expect,it,vi} from "vitest";

const mock=vi.hoisted(()=>({
  list:vi.fn(),
  page:vi.fn(),
  context:{user:{id:"actor"}},
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>mock.context,
}));
vi.mock("@/modules/courses/course-service",()=>({
  listCourses:mock.list,
  listCoursesPage:mock.page,
}));
import {GET} from "@/app/api/courses/route";

beforeEach(()=>{
  mock.list.mockReset();
  mock.page.mockReset();
  mock.list.mockResolvedValue([{id:"unpaged"}]);
  mock.page.mockResolvedValue({courses:[{id:"second-page"}],total:22,limit:10,offset:10});
});

describe("course catalogue pagination uses scoped SQL",()=>{
  it("does not materialize the unpaged catalogue when page and size are supplied",async()=>{
    const response=await GET(new Request("http://localhost/api/courses?collegeId=college-a&departmentId=dept-a&page=2&size=10"));
    expect(response.status).toBe(200);
    expect(mock.list).not.toHaveBeenCalled();
    expect(mock.page).toHaveBeenCalledWith(mock.context,"college-a",
      {limit:10,offset:10},"dept-a",false,false);
    expect(await response.json()).toEqual({
      courses:[{id:"second-page"}],page:2,size:10,totalElements:22,totalPages:3,
    });
  });
  it("keeps legacy unpaged reads intact",async()=>{
    const response=await GET(new Request("http://localhost/api/courses?collegeId=college-a"));
    expect(response.status).toBe(200);
    expect(mock.list).toHaveBeenCalledWith(mock.context,"college-a",null,false,undefined,false);
    expect(mock.page).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({courses:[{id:"unpaged"}]});
  });
  it("rejects malformed pages before reading either catalogue",async()=>{
    const response=await GET(new Request("http://localhost/api/courses?collegeId=college-a&page=0&size=500"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({error:"INVALID_PAGINATION"});
    expect(mock.page).not.toHaveBeenCalled();
    expect(mock.list).not.toHaveBeenCalled();
  });
  it("retains archive-only authorization and filtering within paged reads",async()=>{
    const response=await GET(new Request("http://localhost/api/courses?collegeId=college-a&page=1&onlyArchived=true"));
    expect(response.status).toBe(200);
    expect(mock.page).toHaveBeenCalledWith(mock.context,"college-a",
      {limit:25,offset:0},null,true,true);
    expect(mock.list).not.toHaveBeenCalled();
  });
});
