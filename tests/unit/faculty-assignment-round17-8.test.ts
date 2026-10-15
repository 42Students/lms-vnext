import {expect,it} from "vitest";
import {facultyAssignmentCanSaveDraft} from "@/modules/courses/faculty-assignment-editor-ui-model";
it("only enables Save Draft for authorized, confirmed dirty form",()=>{
 const current={title:"A",description:null,dueAt:null,maxPoints:10};
 const unchanged={title:"A",description:"",dueAt:"",maxPoints:10};
 expect(facultyAssignmentCanSaveDraft(current,unchanged,false,true)).toBe(false);
 expect(facultyAssignmentCanSaveDraft(current,{...unchanged,title:"B"},false,true)).toBe(true);
 expect(facultyAssignmentCanSaveDraft(current,{...unchanged,title:"B"},true,true)).toBe(false);
 expect(facultyAssignmentCanSaveDraft(current,{...unchanged,title:"B"},false,false)).toBe(false);
 expect(facultyAssignmentCanSaveDraft(null,{...unchanged,title:"B"},false,true)).toBe(false);
});
