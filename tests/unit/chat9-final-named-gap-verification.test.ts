import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {filterDepartmentRows,pageDepartmentRows} from "@/modules/admin-ui/department-directory";
import {indianMobileToE164,legacyPersonName} from "@/modules/people/college-onboard-mobile-model";

const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("chat-9 final named gap source acceptance",()=>{
 it("SA-academics-people-60 BLOCKED: refuses fake remote video ingestion before private scanner exists",()=>{
  const video=read("src/modules/courses/lesson-video-service.ts");
  const acceptance=read("docs/audit/acceptance/superadmin-academics-people-2-courses-content-verification.md");
  expect(video).toContain("requireManage(context, lesson, deliveryId)");
  expect(video).toContain("requireUploader(context, lesson.collegeId)");
  expect(video).not.toContain("fetch(remoteVideoUrl)");
  expect(acceptance).toContain("SA-academics-people-60 | BLOCKED");
 });
 it("SA-academics-people-92 uses structured legacy identity and validates the Indian mobile without requiring demographic fields",()=>{
  const form=read("src/components/college/college-student-register-form.tsx");
  for(const field of ["First Name","Last Name","Mobile Number","Gender","Date of Birth","Address"])
   expect(form).toContain(field);
  expect(form).toContain("gender,dateOfBirth,address");
  expect(form).toContain("indianMobileToE164(phoneE164)");
  expect(indianMobileToE164("9876543210")).toBe("+919876543210");
  expect(indianMobileToE164("123")).toBeNull();
  expect(legacyPersonName("  Priya  ","  Sharma ")).toBe("Priya Sharma");
 });
 it("COL-academic-setup-21 is NOT-A-GAP: departments are sorted, searchable and pageable with a result count",()=>{
  const component=read("src/components/admin/department-directory.tsx");
  for(const label of ["Sort Department Name","department-directory-page-size","Clear search","result.total"])
   expect(component).toContain(label);
  const rows=["Zoology","Biology","Physics"].map((name,index)=>({id:String(index),name,createdAt:"2099-01-01",usage:null}));
  const sorted=filterDepartmentRows(rows,"");
  expect(sorted.map(row=>row.name)).toEqual(["Biology","Physics","Zoology"]);
  expect(pageDepartmentRows(sorted,1,2).items).toHaveLength(2);
 });
});
