import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const root="src/app/(authenticated)/teacher/";
const read=(name)=>readFileSync(root+name,"utf8");

test("UX-G096: faculty identity checked before malformed query handling or profile bookmark redirects",()=>{
  const paths=["profile/details/page.tsx","profile/teaching/page.tsx","report/assignment/[contentId]/submissions/page.tsx"];
  for(const path of paths){
    const source=read(path);
    const gate=source.indexOf('context.membership?.status!=="ACTIVE"');
    const query=source.indexOf('const raw=await searchParams');
    const parse=source.indexOf("facultySubmissionReportSearchSchema.safeParse");
    assert.ok(gate>=0,"missing active Faculty guard in "+path);
    assert.match(source,/context\.membership\.roles\.includes\(ROLE.FACULTY\)/);
    const firstDanger=[query,parse,source.indexOf('redirect("/teacher/profile#social-profiles")')].filter(n=>n>=0);
    assert.ok(firstDanger.length>0 && firstDanger.every(n=>gate<n),"auth must precede recovery in "+path);
    assert.match(source,/notFound\(\)/);
  }
});

test("UX-G096: duplicate teaching selectors rejected and no-result recovery is useful",()=>{
  const s=read("profile/teaching/page.tsx");
  assert.match(s,/facultyProfileTeachingQuerySchema\.safeParse\(raw\)/);
  assert.doesNotMatch(s,/Array\.isArray\(value\)\?value\[0\]/);
  assert.match(s,/No teaching assignments match this search/);
  assert.match(s,/href="\/teacher\/profile\/teaching"/);
  assert.match(s,/No teaching assignment records were loaded/);
});

test("UX-G096: submission invalid-link recovery preserves authorized assignment destination",()=>{
  const s=read("report/assignment/[contentId]/submissions/page.tsx");
  assert.match(s,/No learner submission records were loaded/);
  assert.match(s,/href=\{"\/teacher\/report\/assignment\/"\+encodeURIComponent\(contentId\)\}/);
  assert.match(s,/Clear submission filters/);
  assert.match(s,/facultySubmissionListHref\(\{\.\.\.query,filter:"ALL",q:"",publication:"ALL",order:"NEWEST",page:1\}\)/);
});
