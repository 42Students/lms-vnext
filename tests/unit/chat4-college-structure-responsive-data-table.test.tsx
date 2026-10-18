import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";

vi.mock("@/components/academics/college-section-management",async()=>{
 const {createElement}=await import("react");
 return {CollegeClassRowActions:(props:{row:{id:string}})=>
  createElement("button",{type:"button","data-class":props.row.id},"Edit class")};
});
vi.mock("@/components/academics/college-section-lifecycle-action",async()=>{
 const {createElement}=await import("react");
 return {CollegeSectionLifecycleAction:(props:{row:{id:string}})=>
  createElement("button",{type:"button","data-lifecycle":props.row.id},"Archive class")};
});
vi.mock("@/components/electives/college-slot-manager",async()=>{
 const {createElement}=await import("react");
 return {CollegeSlotManager:(props:{row:{id:string}})=>
  createElement("button",{type:"button","data-slot-manager":props.row.id},"Configure slot")};
});
vi.mock("@/components/electives/college-elective-offering-manager",async()=>{
 const {createElement}=await import("react");
 return {CollegeElectiveOfferingManager:(props:{slotId:string})=>
  createElement("button",{type:"button","data-offerings":props.slotId},"Offerings")};
});
vi.mock("@/components/electives/college-elective-lifecycle-action",async()=>{
 const {createElement}=await import("react");
 return {CollegeElectiveLifecycleAction:(props:{slotId:string})=>
  createElement("button",{type:"button","data-slot-lifecycle":props.slotId},"Archive slot")};
});
import {CollegeStructureDirectory} from "@/components/academics/college-structure-directory";

type Data=Parameters<typeof CollegeStructureDirectory>[0]["data"];
const uuid="11111111-1111-4111-8111-111111111111";
const base={total:1,totalPages:1,programs:[{id:"program",name:"Computing",code:"CSE"}]};
const query={q:"",page:1,pageSize:25,status:"ACTIVE",programId:undefined};

describe("COL-UX-STRUCTURE-TABLE-02 responsive Classes and Electives directories",()=>{
 it("keeps class academic period, capacity, current roster and accessible schedule/lifecycle actions",()=>{
  const data={...base,kind:"CLASSES",query:{...query,capacityState:"ALL"},
   items:[{id:uuid,name:"CSE A",code:"A",programName:"Computing",cohortName:"Batch 2099",
    periodName:"Autumn 2099",capacity:40,activeLearners:32,status:"ACTIVE",
    updatedAt:new Date("2099-10-18T04:30:00Z")}]} as unknown as Data;
  const html=renderToStaticMarkup(<CollegeStructureDirectory data={data}/>);
  expect(html).toContain("Class directory");
  expect(html).toContain("CSE A");
  expect(html).toContain("Autumn 2099");
  expect(html).toContain("32");
  expect(html).toContain("Schedule recurring sessions for CSE A");
  expect(html).toContain('data-class="'+uuid+'"');
  expect(html).toContain('data-lifecycle="'+uuid+'"');
  expect(html).toContain('data-slot="data-table"');
  expect(html).toContain("More details");
  expect(html).toContain("Class directory scrollable columns");
 });
 it("retains academic choices, confirmed learners and elective actions on a phone-readable table",()=>{
  const data={...base,kind:"ELECTIVES",query,
   items:[{id:uuid,name:"Open Elective 2099",programName:"Computing",semesterNumber:4,
    academicYear:"2099-00",periodName:"Autumn 2099",
    credits:3,minPick:1,maxPick:2,confirmedStudents:84,activeOfferings:3,
    status:"ACTIVE",version:7}]} as unknown as Data;
  const html=renderToStaticMarkup(<CollegeStructureDirectory data={data}
   electiveOptions={{programs:[],periods:[]}}/>);
  expect(html).toContain("Elective slot directory");
  expect(html).toContain("Open Elective 2099");
  expect(html).toContain("84");
  expect(html).toContain("Eligible students");
  expect(html).toContain('data-slot-manager="'+uuid+'"');
  expect(html).toContain('data-offerings="'+uuid+'"');
  expect(html).toContain('data-slot-lifecycle="'+uuid+'"');
  expect(html).toContain("More details");
 });
 it("removes duplicate raw desktop tables in favour of one responsive DataTable per view",()=>{
  const source=readFileSync("src/components/academics/college-structure-directory.tsx","utf8");
  expect(source).not.toContain("<table");
  expect(source).toContain('<DataTable caption="Class directory"');
  expect(source).toContain('<DataTable caption="Elective slot directory"');
  expect(source).toContain('mobilePriority:"action"');
 });
});
