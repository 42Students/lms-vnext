import {describe,expect,it} from "vitest";
import {compareMentorEvidenceReferences} from
  "@/modules/projects/mentor-evidence-revision-model";
const row=(index:number,name:string,href:string|null,type="application/pdf")=>({
 index,name,href,type,
});
describe("Mentor submission evidence revision references",()=>{
 it("distinguishes unchanged references, new names and changed saved links",()=>{
  const previous=[row(0,"Report","https://files.example/v1.pdf"),
    row(1,"Demo","https://files.example/demo.mp4","video/mp4")];
  const current=[row(0,"report","https://files.example/v1.pdf"),
    row(1,"Demo","https://files.example/demo2.mp4","video/mp4"),
    row(2,"Trial","https://files.example/trial.xlsx")];
  expect(compareMentorEvidenceReferences(current,previous).map(x=>x.change))
   .toEqual(["UNCHANGED","LINK_CHANGED","NEW"]);
 });
 it("never treats duplicate names as verified matches",()=>{
  const current=[row(0,"Report","a"),row(1,"report","a")];
  const previous=[row(0,"Report","a")];
  expect(compareMentorEvidenceReferences(current,previous).map(x=>x.change))
   .toEqual(["NEW","NEW"]);
 });
 it("does not invent an earlier attempt",()=>{
  expect(compareMentorEvidenceReferences([row(0,"Report",null)],null)[0]?.change)
   .toBe("ORIGINAL");
  expect(compareMentorEvidenceReferences([],[])).toEqual([]);
 });
});
