import {it,expect} from "vitest";
import {tpoNoticeCreateSchema} from "@/modules/announcements/tpo-placement-write-service";
it("rejects unknown target scope and blank notice",()=>{
 expect(tpoNoticeCreateSchema.safeParse({title:"Hi",message:"Body",collegeId:"forged"}).success).toBe(false);
 expect(tpoNoticeCreateSchema.safeParse({title:" ",message:"Body"}).success).toBe(false);
 expect(tpoNoticeCreateSchema.safeParse({title:"Hi",message:"Body"}).success).toBe(true);
});
