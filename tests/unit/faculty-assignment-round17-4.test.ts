import {expect,it} from "vitest";
import {facultyAssignmentSwitchNeedsConfirmation} from "@/modules/courses/faculty-assignment-editor-ui-model";
it("prompts before losing unsaved authoring values",()=>{
 const blank={title:"",description:"",dueAt:"",maxPoints:10};
 const saved={title:"A",description:null,dueAt:null,maxPoints:10};
 expect(facultyAssignmentSwitchNeedsConfirmation("","a",null,blank)).toBe(false);
 expect(facultyAssignmentSwitchNeedsConfirmation("","a",null,{...blank,title:"Draft"})).toBe(true);
 expect(facultyAssignmentSwitchNeedsConfirmation("a","a",saved,{...blank,title:"Changed"})).toBe(false);
 expect(facultyAssignmentSwitchNeedsConfirmation("a","b",saved,{...blank,title:"Changed"})).toBe(true);
});
