import {expect,it} from "vitest";
import {facultyContentPatch,facultyContentSaveReceiptMatches} from "@/modules/courses/faculty-content-edit-model";
it("requires a receipt for the actual persisted lesson content",()=>{
 const data=facultyContentPatch({kind:"RESOURCE",title:"Updated",notes:"Read it",url:"https://example.org"});
 const saved={content:{id:"content-1",...data}};
 expect(facultyContentSaveReceiptMatches("content-1",data,saved)).toBe(true);
 expect(facultyContentSaveReceiptMatches("content-2",data,saved)).toBe(false);
 expect(facultyContentSaveReceiptMatches("content-1",data,{content:{...data,id:"content-1",title:"Old"}})).toBe(false);
 expect(facultyContentSaveReceiptMatches("content-1",data,{content:null})).toBe(false);
 expect(facultyContentSaveReceiptMatches("content-1",data,null)).toBe(false);
});
