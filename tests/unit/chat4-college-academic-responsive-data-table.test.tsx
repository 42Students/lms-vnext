import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";

vi.mock("@/components/academics/college-semester-management",async()=>{
 const {createElement}=await import("react");
 return {
  CollegeSemesterCreateForm:()=>createElement("div",null,"Create semester"),
  CollegeSemesterRowActions:(props:{row:{id:string}})=>
   createElement("button",{type:"button","data-semester":props.row.id},"Manage semester"),
 };
});
vi.mock("@/components/academics/college-cohort-management",async()=>{
 const {createElement}=await import("react");
 return {
  CollegeCohortRowActions:(props:{row:{id:string}})=>
   createElement("button",{type:"button","data-batch":props.row.id},"Manage batch"),
 };
});
import {CollegeAcademicDirectory} from "@/components/academics/college-academic-directory";

type Data=Parameters<typeof CollegeAcademicDirectory>[0]["data"];
const base={
 total:1,totalPages:1,programs:[{id:"program",name:"Computing",code:"CSE"}],
};
const query={q:"",page:1,pageSize:25,status:"ALL",programId:undefined};

describe("COL-UX-ACADEMIC-TABLE-01 responsive Semester and Batch directories",()=>{
 it("renders the actual semester with native accessible table headers and all legacy actions",()=>{
  const data={
   ...base,kind:"SEMESTERS",query,
   items:[{id:"semester-1",name:"Semester 4",termNumber:4,
    programName:"Computing",programCode:"CSE",
    mappedCredits:22,mappedCourses:6,isActive:true}],
  } as unknown as Data;
  const html=renderToStaticMarkup(<CollegeAcademicDirectory data={data}/>);
  expect(html).toContain("Semester directory");
  expect(html).toContain("Semester 4");
  expect(html).toContain("Mapped courses");
  expect(html).toContain("22");
  expect(html).toContain('data-semester="semester-1"');
  expect(html).toContain('data-slot="data-table"');
  expect(html).toContain("More details");
  expect(html).toContain("Semester directory scrollable columns");
 });
 it("retains academic year, class count, status and Manage/Students links on batch cards",()=>{
  const data={
   ...base,kind:"BATCHES",query,
   items:[{id:"11111111-1111-4111-8111-111111111111",
    name:"Batch 2099",code:"CSE-2099",
    programName:"Computing",programCode:"CSE",
    startDate:"2099-07-01",endDate:null,startPeriodName:"Autumn 2099",
    academicYear:null,currentAcademicYearStart:2099,currentTermNumber:4,
    activeSections:3,activeEnrolledLearners:120,
    status:"ACTIVE",inactiveAt:null}],
  } as unknown as Data;
  const html=renderToStaticMarkup(<CollegeAcademicDirectory data={data}/>);
  expect(html).toContain("Batch directory");
  expect(html).toContain("Batch 2099");
  expect(html).toContain("2100");
  expect(html).toContain("3 classes / 120 learners");
  expect(html).toContain("Students");
  expect(html).toContain("Manage batch");
  expect(html).toContain('data-slot="data-table"');
  expect(html).toContain("More details");
 });
 it("keeps a truthful no-results recovery state rather than an inaccessible empty table",()=>{
  const data={...base,kind:"SEMESTERS",query,items:[],total:0,totalPages:1} as unknown as Data;
  const html=renderToStaticMarkup(<CollegeAcademicDirectory data={data}/>);
  expect(html).toContain("Clear filters");
  expect(html).not.toContain("<table");
  expect(html).toContain("No");
 });
});
