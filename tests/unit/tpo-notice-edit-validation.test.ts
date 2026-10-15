import {expect,it} from "vitest";
import {editTpoNoticeSchema} from "@/modules/announcements/tpo-placement-edit-service";
const noticeId="11111111-1111-4111-8111-111111111111";
it("requires a version and rejects foreign scope, HTML-empty title and oversized text",()=>{
 const valid={noticeId,expectedVersion:0,title:"Drive",message:"One update",pinned:false};
 expect(editTpoNoticeSchema.parse(valid)).toEqual(valid);
 expect(editTpoNoticeSchema.safeParse({...valid,collegeId:noticeId}).success).toBe(false);
 expect(editTpoNoticeSchema.safeParse({...valid,title:" "}).success).toBe(false);
 expect(editTpoNoticeSchema.safeParse({...valid,message:"x".repeat(10001)}).success).toBe(false);
});
