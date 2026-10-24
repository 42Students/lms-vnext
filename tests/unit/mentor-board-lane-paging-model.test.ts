import {describe,expect,it} from "vitest";
import {mentorLanePage} from "@/modules/projects/mentor-board-lane-paging-model";

describe("Mentor board per-lane paging",()=>{
  it("shows four items then reveals the next four without changing source",()=>{
    const source=Array.from({length:12},(_,index)=>index);
    expect(mentorLanePage(source,undefined)).toMatchObject({
      items:[0,1,2,3],total:12,remaining:8,moreCount:4,nextLimit:8});
    expect(mentorLanePage(source,8)).toMatchObject({
      items:[0,1,2,3,4,5,6,7],remaining:4,moreCount:4,nextLimit:12});
    expect(source).toHaveLength(12);
  });
  it("never lets a globally busy lane starve another lane",()=>{
    const busy=Array.from({length:151},(_,i)=>i);
    const tiny=["a","b"];
    expect(mentorLanePage(busy,undefined).items).toHaveLength(4);
    expect(mentorLanePage(tiny,undefined).items).toEqual(["a","b"]);
    expect(mentorLanePage(tiny,undefined).remaining).toBe(0);
  });
  it("bounds invalid limits and handles one-item tails",()=>{
    expect(mentorLanePage([1,2,3,4,5],-100)).toMatchObject({
      remaining:1,moreCount:1,nextLimit:5});
    expect(mentorLanePage<number>([],undefined).remaining).toBe(0);
    expect(mentorLanePage([1,2],Number.MAX_SAFE_INTEGER).items).toEqual([1,2]);
  });
});
