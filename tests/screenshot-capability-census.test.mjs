import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
 buildScreenshotCapabilityCensus,indexAppRoutes,parsePackageManifest,routeForNextPage,routeShape,
} from "../scripts/audit/screenshot-capability-census.mjs";

function tempFixture(run){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"vnext-screenshot-capability-"));
 const baselineRoot=path.join(dir,"baseline");
 const appRoot=path.join(dir,"src","app");
 fs.mkdirSync(path.join(baselineRoot,"packages"),{recursive:true});
 fs.mkdirSync(appRoot,{recursive:true});
 const page=(route)=>{
  const target=path.join(appRoot,...route.split("/"),"page.tsx");
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,"export default function Page(){return null;}\n");
 };
 const pkg=(id,oldRoute,vnextRoute,oldShots=[],vnextShots=[])=>{
  const header=`# ${id}\n\nPage: \`${oldRoute}\` on old LMS, \`${vnextRoute}\` on vNext. Part 1 of 1.\n\n`;
  const old=oldShots.length?oldShots.map(n=>`- \`old/test/${n}.png\` — ${n}`).join("\n"):"- none in this part";
  const current=vnextShots.length?vnextShots.map(n=>`- \`vnext/test/${n}.png\` — ${n}`).join("\n"):"- none in this part";
  fs.writeFileSync(path.join(baselineRoot,"packages",id+".md"),header+"## Old LMS\n"+old+"\n\n## vNext\n"+current+"\n");
 };
 try{return run({baselineRoot,appRoot,page,pkg});}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
}

test("route index ignores Next route groups but retains nested dynamic segments",()=>{
 assert.equal(routeForNextPage("(authenticated)/mentor/projects/[projectId]/page.tsx"),"/mentor/projects/[projectId]");
 assert.equal(routeForNextPage("(public)/quiz/page.tsx"),"/quiz");
 assert.equal(routeForNextPage("page.tsx"),"/");
 assert.equal(routeForNextPage("(authenticated)/mentor/projects/loading.tsx"),null);
 assert.equal(routeShape("/tpo/recruiters/[recruiterLeadId]"),"/tpo/recruiters/[]");
 assert.equal(routeShape("/tpo/recruiters/[leadId]"),"/tpo/recruiters/[]");
 assert.equal(routeShape("/docs/[...path]"),"/docs/[...]");
 assert.equal(routeShape("/docs/[[...path]]"),"/docs/[[...]]");
 tempFixture(({appRoot,page})=>{
  page(["(authenticated)","mentor","projects","[projectId]"].join("/"));
  page("quiz");
  assert.deepEqual([...indexAppRoutes(appRoot)].sort(),["/mentor/projects/[projectId]","/quiz"]);
 });
});

test("parser preserves exact route labels and old/vNext interaction descriptions",()=>{
 const markdown=`# learner-001\nPage: \`/learn/allAssignments\` on old LMS, \`/learn/allAssignments\` on vNext. Part 1 of 1.\n## Old LMS\n- \`old/learner/base.png\` — base\n- \`old/learner/control.png\` — overlay-1-control\n## vNext\n- \`vnext/learner/base.png\` — base\n`;
 const p=parsePackageManifest(markdown,"learner-001");
 assert.equal(p.oldRoute,"/learn/allAssignments");
 assert.equal(p.vnextRoute,"/learn/allAssignments");
 assert.equal(p.oldImages,2);
 assert.equal(p.vnextImages,1);
 assert.deepEqual(p.oldStates,["base","overlay-1-control"]);
});

test("census classifies screenshots as capture evidence, not missing product features",()=>{
 tempFixture(({baselineRoot,appRoot,page,pkg})=>{
  fs.writeFileSync(path.join(baselineRoot,"packages","QUEUE.md"),[
   "# Package queue","- learner-001","- learner-002","- faculty-001",
   "- admin-001","- coordinator-001","- mentor-001","- tpo-001","",
  ].join("\n"));
  page("(authenticated)/learn/allAssignments");
  page("quiz");
  page("(authenticated)/college/assignments");
  page("(authenticated)/mentor/projects");
  page("(authenticated)/tpo/recruiters/[leadId]");
  pkg("learner-001","/learn/allAssignments","/learn/allAssignments",["base"],["base"]);
  pkg("learner-002","/learn/allAssignments","/learn/allAssignments",["control"],[]);
  pkg("faculty-001","/quiz","/quiz",["base"],["load-failed"]);
  pkg("admin-001","/college-admin/assignments","/college/assignments",["base"],[]);
  pkg("coordinator-001","/course-coordinator/assignments","-",["base"],[]);
  pkg("mentor-001","-","/mentor/projects",[],["base"]);
  pkg("tpo-001","/tpo/audit","/tpo/audit",["base"],["base"]);
  const r=buildScreenshotCapabilityCensus({baselineRoot,appRoot});
  assert.equal(r.policy,"DISCOVERY_ONLY_NOT_A_FEATURE_COMPLETION_PERCENTAGE");
  assert.equal(r.summary.queueEntries,7);
  assert.equal(r.summary.parsedPackages,7);
  assert.equal(r.summary.distinctRoutePairs,6);
  assert.equal(r.summary.namedOldImages,6);
  assert.equal(r.summary.namedVnextImages,4);
  assert.equal(r.summary.parseIssues,0);
  assert.equal(r.summary.captureStatuses.OLD_ONLY_CAPTURE,1);
  assert.equal(r.summary.captureStatuses.VNEXT_ONLY_CAPTURE,1);
  assert.equal(r.summary.captureStatuses.VNEXT_IMAGE_NOT_CAPTURED,2);
  const admin=r.families.find(g=>g.role==="admin");
  assert.equal(admin.reviewReason,"V_NEXT_CAPTURE_MISSING");
  assert.equal(admin.directRoute,true);
  const tpo=r.families.find(g=>g.role==="tpo");
  assert.equal(tpo.reviewReason,"TARGET_ROUTE_NOT_DIRECTLY_PRESENT");
  assert.equal(tpo.directRoute,false);
  const learner=r.families.find(g=>g.role==="learner");
  assert.deepEqual(learner.ids,["learner-001","learner-002"]);
  assert.equal(learner.reviewReason,"TRACE_ACTIONS_AND_VERIFY");
  const coordinator=r.families.find(g=>g.role==="coordinator");
  assert.equal(coordinator.reviewReason,"OLD_ONLY_RECONCILE");
 });
});

test("different dynamic placeholder names resolve to the same Next route shape",()=>{
 tempFixture(({baselineRoot,appRoot,page,pkg})=>{
  fs.writeFileSync(path.join(baselineRoot,"packages","QUEUE.md"),"- tpo-001\n");
  page("(authenticated)/tpo/recruiters/[leadId]");
  pkg("tpo-001","/tpo/recruiters/[recruiterLeadId]",
      "/tpo/recruiters/[recruiterLeadId]",["base"],["base"]);
  const r=buildScreenshotCapabilityCensus({baselineRoot,appRoot});
  assert.equal(r.families[0].directRoute,true);
  assert.equal(r.families[0].reviewReason,"TRACE_ACTIONS_AND_VERIFY");
 });
});

test("missing package files become explicit integrity issues, never false completion",()=>{
 tempFixture(({baselineRoot,appRoot})=>{
  fs.writeFileSync(path.join(baselineRoot,"packages","QUEUE.md"),"- learner-001\n");
  const r=buildScreenshotCapabilityCensus({baselineRoot,appRoot});
  assert.equal(r.summary.queueEntries,1);
  assert.equal(r.summary.parsedPackages,0);
  assert.deepEqual(r.issues,[{id:"learner-001",reason:"PACKAGE_FILE_MISSING"}]);
 });
});
