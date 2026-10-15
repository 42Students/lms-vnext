import {expect,it} from "vitest";
import {learnerNoticePageHref} from "@/modules/placements/learner-notices-navigation-model";
it("keeps independent notice and personal preview searches during pagination",()=>{
 const href=learnerNoticePageHref({pinned:true,unread:true,recent:true,q:"internship",alertQ:"offer",sort:"latest",page:3});
 const url=new URL(href,"https://example.test");
 expect(Object.fromEntries(url.searchParams)).toMatchObject({
  pinned:"1",unread:"1",recent:"1",q:"internship",alertQ:"offer",sort:"latest",page:"3"
 });
 expect([...url.searchParams.keys()].filter(k=>k==="alertQ")).toHaveLength(1);
 expect(()=>learnerNoticePageHref({pinned:false,unread:false,recent:false,q:"",page:0})).toThrow();
});
