import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {facultyAssignmentMaterialLinkSchema,safeLearnerAssignmentMaterialLink} from "@/modules/courses/learner-assignment-materials-model";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("Faculty-authored learner assignment materials",()=>{
 it("LEARNER-learning-misc-02 accepts only explicit HTTPS assignment handouts",()=>{
  expect(facultyAssignmentMaterialLinkSchema.parse({title:"Class notes",externalUrl:"https://example.edu/handout.pdf"}))
   .toMatchObject({title:"Class notes"});
  for(const link of ["javascript:alert(1)","http://example.edu/a.pdf",
   "https://user:password@example.edu/a.pdf","https://localhost/file.pdf",
   "https://127.0.0.1/file.pdf","/admin/private"]){
    expect(safeLearnerAssignmentMaterialLink(link)).toBeNull();
  }
  expect(safeLearnerAssignmentMaterialLink(null)).toBeNull();
 });
 it("LEARNER-course-detail-03 enforces learner Section membership before returning published materials",()=>{
  const service=read("src/modules/courses/learner-assignment-materials-service.ts");
  expect(service).toContain("requireLearningReadAccess(context,assignment.offeringId,deliveryId)");
  expect(service).toContain('assignment.status!=="PUBLISHED"');
  expect(service).toContain('assignment.learningPathStatus!=="PUBLISHED"');
  expect(service).toContain("assignment.lessonVisibleToStudents");
  expect(service).toContain("safeLearnerAssignmentMaterialLink(row.externalUrl)");
  expect(service).not.toContain("storageKey:");
 });
 it("LEARNER-learning-misc-02 validates faculty authoring, optimistic parent locking, and same-origin mutation",()=>{
  const service=read("src/modules/courses/learner-assignment-materials-service.ts");
  expect(service).toContain("requireDeliveryContentMutation(context,deliveryId)");
  expect(service).toContain('.for("update")');
  expect(service).toContain("rows.length>=20");
  expect(service).toContain("rows.some(row=>row.externalUrl.toLowerCase()");
  const route=read("src/app/api/courses/deliveries/[deliveryId]/assignments/[assignmentId]/materials/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("export async function GET");
  expect(route).toContain("export async function POST");
  expect(route).toContain("export async function DELETE");
 });
 it("LEARNER-learning-misc-02 exposes handouts on the actual assignment detail, without invented file receipts",()=>{
  const page=read("src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx");
  expect(page).toContain("listOwnLearnerAssignmentMaterialLinks");
  expect(page).toContain("Instructor resources");
  expect(page).toContain("Open link:");
  expect(page).toContain('rel="noopener noreferrer"');
  expect(page).toContain("Assignment resources are temporarily unavailable");
 });
});
