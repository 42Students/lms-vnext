import {describe,expect,it} from "vitest";
import {hrTodayUnreadAction} from "@/modules/placements/hr-today-unread-model";
describe("HR Today inbox action",()=>{
 it("links only a scoped college and represents cap honestly",()=>{
  const collegeId="00000000-0000-4000-8000-000000000001";
  expect(hrTodayUnreadAction({status:"READY",unread:3,truncated:false,collegeId}))
   .toEqual({label:"Unread notifications",value:3,
    url:"/hr/messages?collegeId="+collegeId+"&unreadOnly=true"});
  expect(hrTodayUnreadAction({status:"READY",unread:100,truncated:true,collegeId})?.label)
   .toBe("Unread notifications (first 100)");
  expect(hrTodayUnreadAction({status:"NO_ACCESS",unread:100,truncated:false,collegeId})).toBeNull();
 });
});
