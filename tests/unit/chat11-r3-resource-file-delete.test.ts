import {expect,it} from "vitest";
import {resourceFileDeletePrompt,canConfirmResourceFileDelete} from "@/modules/projects/resource-file-delete-model";
const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222",c="33333333-3333-4333-8333-333333333333";
const file={projectId:a,resourceId:b,fileId:c,fileName:"report.pdf",revision:"v3"};
it("names the exact resource file and explains irreversible deletion",()=>{
 expect(resourceFileDeletePrompt(file)).toMatchObject({title:"Delete file?",confirmLabel:"Delete file"});
 expect(resourceFileDeletePrompt(file).description).toContain("report.pdf");
});
it("requires acknowledgment and an unchanged exact file scope",()=>{
 const current={projectId:a,resourceId:b,fileId:c,revision:"v3"};
 expect(canConfirmResourceFileDelete(file,true,false,current)).toBe(true);
 expect(canConfirmResourceFileDelete(file,false,false,current)).toBe(false);
 expect(canConfirmResourceFileDelete(file,true,true,current)).toBe(false);
 expect(canConfirmResourceFileDelete(file,true,false,{...current,revision:"v4"})).toBe(false);
 expect(canConfirmResourceFileDelete(file,true,false,{...current,resourceId:a})).toBe(false);
});
