import {describe,expect,it} from "vitest";
import {facultyMetadataFromDraft} from "@/modules/people/faculty-profile-metadata-model";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
const id="10000000-0000-4000-8000-000000000004";
describe("Faculty metadata privacy and typed legacy preservation",()=>{
 it("preserves numeric, boolean and null metadata while editing strings",()=>{
  const result=facultyMetadataFromDraft({tenure:2,approved:true,unknown:null,title:"Old"},
   [{id,key:"title",value:"New"}]);
  expect(result).toEqual({tenure:2,approved:true,unknown:null,title:"New"});
  expect(updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"metadata",value:result,expectedVersion:0,
  }).metadata).toEqual(result);
 });
 it("rejects secret fields, duplicate keys and overwriting typed metadata",()=>{
  const row={id,key:"title",value:"T"};
  expect(()=>facultyMetadataFromDraft({},[row,{...row,id:"10000000-0000-4000-8000-000000000005"}])).toThrow();
  expect(()=>facultyMetadataFromDraft({count:2},[{...row,key:"count"}])).toThrow();
  expect(()=>facultyMetadataFromDraft({},[{...row,key:"aadhaarNumber"}])).toThrow();
 });
});


describe("Faculty metadata API bypass prevention",()=>{
 it("refuses forged secret fields beyond the client editor",()=>{
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"metadata",expectedVersion:0,value:{aadhaarNumber:"123456789012"},
  })).toThrow();
 });
});


describe("protected legacy metadata preservation",()=>{
 it("keeps old protected text fields intact but never puts them in the editable input set",()=>{
  expect(facultyMetadataFromDraft({tokenReceipt:"legacy",title:"Old"},[{id:"10000000-0000-4000-8000-000000000004",key:"title",value:"New"}]))
   .toEqual({tokenReceipt:"legacy",title:"New"});
 });
});


describe("metadata object-key abuse rejection",()=>{
 it("blocks prototype pollution names and whitespace-only aliases",()=>{
  for(const key of ["__proto__","constructor","prototype"," title ",""]){
   expect(()=>facultyMetadataFromDraft({},[{id:"10000000-0000-4000-8000-000000000004",key,value:"x"}])).toThrow();
  }
 });
});
