import {expect,it} from "vitest";
import {facultyVideoReplaceIntentSchema} from "@/modules/courses/faculty-video-management-model";
const a="11111111-1111-4111-8111-111111111111";
it("accepts a scoped upload-session reference but never raw signing material",()=>{
 const cmd={action:"REPLACE",contentId:a,lessonId:a,deliveryId:null,expectedUpdatedAt:"2026-10-15T14:00:00Z",replacementUploadId:a,confirmed:true};
 expect(facultyVideoReplaceIntentSchema.safeParse(cmd).success).toBe(true);
 expect(facultyVideoReplaceIntentSchema.safeParse({...cmd,confirmed:false}).success).toBe(false);
 expect(facultyVideoReplaceIntentSchema.safeParse({...cmd,storageKey:"private/key"}).success).toBe(false);
 expect(facultyVideoReplaceIntentSchema.safeParse({...cmd,replacementUploadId:"bad"}).success).toBe(false);
});