import {describe,expect,it} from "vitest";
import {parseMentorMeetingCollectionPagination as parse}
  from "@/modules/projects/mentor-meeting-collection-pagination";

describe("Mentor project meetings collection paging",()=>{
  it("keeps absent parameters as unpaged collection",()=>{
    expect(parse(new URLSearchParams())).toEqual({
      valid:true,page:null,pageSize:null,
    });
  });
  it("accepts real multi-digit page numbers and sizes",()=>{
    expect(parse(new URLSearchParams("page=12&pageSize=25"))).toEqual({
      valid:true,page:12,pageSize:25,
    });
    expect(parse(new URLSearchParams("page=99999&pageSize=99"))).toEqual({
      valid:true,page:99999,pageSize:99,
    });
  });
  it.each([
    "page=0","page=01","page=-2","page=1.5","page=1e2",
    "page=100000","pageSize=0","pageSize=010","pageSize=100",
    "pageSize=abc","page=2&page=3","pageSize=10&pageSize=20",
    "page=%2010","page=2%5Cd",
  ])("rejects invalid or duplicate untrusted pagination: %s",query=>{
    expect(parse(new URLSearchParams(query))).toEqual({valid:false});
  });
});
