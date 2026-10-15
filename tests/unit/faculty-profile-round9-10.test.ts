import {it,expect} from "vitest";
import {restoreFacultyMetadataDraft} from "@/modules/people/faculty-profile-draft-actions";
it("restores editable text only, preserving protected typed source data",()=>{
 const source={award:"Teacher",count:3,tokenPrivate:"secret",active:true};let i=0;
 const draft=restoreFacultyMetadataDraft(source,()=>String(++i));
 expect(draft).toEqual([{id:"1",key:"award",value:"Teacher"}]);
 expect(source).toEqual({award:"Teacher",count:3,tokenPrivate:"secret",active:true});
});
