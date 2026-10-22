import {describe,it,expect} from "vitest";
import {LEGACY_COURSE_METADATA_FIELDS,legacyCourseMetadataPreview} from "@/modules/courses/legacy-course-metadata-preview";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");

describe("14-field legacy course metadata is read-only and public safe",()=>{
 it("maps the full Jackson MetaData.java contract without interpreting raw dates as instants",()=>{
  expect(LEGACY_COURSE_METADATA_FIELDS.map(field=>field.key)).toEqual([
   "amount","image_url","takeaways","course_code","course_type","course_color",
   "image_url_lp","course_category","course_end_date","course_start_date",
   "introduction_content","html_content","updated_on","thumbnail",
  ]);
  expect(legacyCourseMetadataPreview({course_start_date:"03/10/2026"})
   .find(field=>field.key==="course_start_date")?.value).toBe("03/10/2026");
 });
 it("retains absent versus explicit null versus value and excludes secret metadata",()=>{
  const view=legacyCourseMetadataPreview({
   amount:0,image_url:null,course_code:"CS101",
   courseCoverAsset:{objectKey:"private-bucket-key",uploadToken:"secret"},
  });
  expect(view.find(field=>field.key==="amount")).toMatchObject({status:"VALUE",value:"0"});
  expect(view.find(field=>field.key==="image_url")).toMatchObject({status:"NULL",value:null});
  expect(view.find(field=>field.key==="thumbnail")).toMatchObject({status:"MISSING",value:null});
  expect(view.find(field=>field.key==="course_code")?.value).toBe("CS101");
  expect(JSON.stringify(view)).not.toContain("private-bucket-key");
  expect(JSON.stringify(view)).not.toContain("secret");
 });
 it("never renders unsafe HTML or image references as executable content",()=>{
  const view=legacyCourseMetadataPreview({
   html_content:'<img src=x onerror=alert(1)>',image_url:"javascript:alert(1)",
   course_color:"red;url(evil)",
  });
  expect(view.find(field=>field.key==="image_url")?.value).toContain("Unsafe");
  expect(view.find(field=>field.key==="course_color")?.value).toContain("Invalid");
  expect(view.find(field=>field.key==="html_content")?.value).toBe('<img src=x onerror=alert(1)>');
  const editor=source("src/components/courses/admin-course-display-editor.tsx");
  expect(editor).toContain("metadata.legacyFields.map");
  expect(editor).not.toContain("dangerouslySetInnerHTML");
  const route=source("src/app/api/courses/[courseId]/display-meta/route.ts");
  expect(route).toContain("const {legacyMetadata,...safeMetadata}=metadata");
  expect(route).toContain("legacyCourseMetadataPreview(legacyMetadata)");
 });
});
