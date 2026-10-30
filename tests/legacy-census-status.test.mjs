import test from "node:test";
import assert from "node:assert/strict";
import {buildLegacyCensusStatus,INSPECTIONS} from "../scripts/audit/legacy-census-status.mjs";
function fixture(){
 const files=Object.fromEntries(Object.values(INSPECTIONS).map(k=>[k,{records:[]}]));
 files["tpo-route-inspection.json"]={records:[{path:"src/pages/tpo/home.js"}]};
 return {
  census:{sourceSnapshots:{legacyFrontend:{treeSha:"a"},legacyBackend:{treeSha:"b"},vNext:{treeSha:"c"}},
   counts:{namedLegacyOverlayCandidateFiles:1},
   legacyRouteFiles:[{path:"src/pages/tpo/home.js"},{path:"src/pages/tpo/drives.js"}],
   legacyFrontendComponentFiles:[{path:"src/components/tpo/FooModal.jsx"},{path:"src/components/tpo/Widget.jsx"}],
   legacyBackendControllerCandidates:[{path:"src/main/java/FooController.java"}]},
  inspectionFiles:files,
  overlay:{records:[{path:"src/components/tpo/FooModal.jsx"}]},deep:{records:[]},
  backend:{records:[]},
  drift:{legacyFrontend:{current:"new",changedSourcePages:[{path:"src/pages/tpo/drives.js"}],
    changedSourceComponents:[{path:"src/components/tpo/Widget.jsx"}]},
   legacyBackend:{current:"backend-new",changedJavaFiles:[{path:"src/main/java/FooController.java"}]}},
 };
}
test("all eight per-account inspection inputs are known",()=>assert.equal(Object.keys(INSPECTIONS).length,8));
test("route completion does NOT imply component or backend completion",()=>{
 const s=buildLegacyCensusStatus(fixture());
 assert.equal(s.frontend.routeSourceFilesInspected,1);
 assert.equal(s.frontend.missingRouteSourceFiles,1);
 assert.equal(s.frontend.specificallyInspectedComponentFiles,1);
 assert.equal(s.frontend.uninspectedComponentSourceFiles,1);
 assert.equal(s.backend.uninspectedControllerSourceFiles,1);
 assert.equal(s.frontend.staleAfterDevChanges.changedRouteFiles,1);
 assert.equal(s.structuralProblems.length,0);
});
test("structural duplicate and source-drift errors are distinguishable",()=>{
 const f=fixture();f.inspectionFiles["recruiter-route-inspection.json"].records.push({path:"src/pages/tpo/home.js"});
 const s=buildLegacyCensusStatus(f);
 assert.ok(s.structuralProblems.some(x=>x.includes("duplicate route record")));
 assert.equal(s.frontend.staleAfterDevChanges.changedComponentFiles,1);
});
test("complete static sources still do not certify runtime surface count",()=>{
 const f=fixture();
 f.inspectionFiles["tpo-route-inspection.json"].records.push({path:"src/pages/tpo/drives.js"});
 f.deep.records.push({path:"src/components/tpo/Widget.jsx"});
 f.backend.records.push({path:"src/main/java/FooController.java"});
 const s=buildLegacyCensusStatus(f);
 assert.equal(s.frontend.missingRouteSourceFiles,0);
 assert.equal(s.frontend.uninspectedComponentSourceFiles,0);
 assert.equal(s.backend.uninspectedControllerSourceFiles,0);
 assert.ok(s.disclaimers.some(x=>x.includes("FILE coverage counts")));
});

test("new dev-only route paths absent from the frozen census are explicit stale candidates",()=>{
 const f=fixture();
 f.drift.legacyFrontend.changedSourcePages.push(
   {path:"src/pages/course-coordinator/index.js"},
   {path:"src/pages/global-tpo/index.js"},
   {path:"src/pages/global-tpo/index.js"},
 );
 const s=buildLegacyCensusStatus(f);
 assert.deepEqual(s.frontend.staleAfterDevChanges.unmappedChangedRoutePaths,[
   "src/pages/course-coordinator/index.js",
   "src/pages/global-tpo/index.js",
 ]);
 assert.equal(s.frontend.staleAfterDevChanges.changedRouteFiles,1);
 assert.equal(s.frontend.missingRouteSourceFiles,1);
 assert.equal(s.structuralProblems.length,0);
});

test("new overlay and navigation files cannot be hidden by the old source denominator",()=>{
 const f=fixture();
 f.drift.legacyFrontend.changedSourceComponents.push(
   {path:"src/components/tpo/invite/BringInWindow.jsx"},
   {path:"src/components/tpo/invite/VerifyCompanyWindow.jsx"},
   {path:"src/components/tpo/invite/BringInWindow.jsx"},
 );
 f.drift.legacyFrontend.changedNavigationOrLayout=[
   {path:"src/components/Global/Header/Header.js"},
   "src/components/tpo/TpoSidebar.jsx",
 ];
 const s=buildLegacyCensusStatus(f);
 assert.deepEqual(s.frontend.staleAfterDevChanges.unmappedChangedComponentPaths,[
   "src/components/tpo/invite/BringInWindow.jsx",
   "src/components/tpo/invite/VerifyCompanyWindow.jsx",
 ]);
 assert.deepEqual(s.frontend.staleAfterDevChanges.changedNavigationOrLayoutPaths,[
   "src/components/Global/Header/Header.js",
   "src/components/tpo/TpoSidebar.jsx",
 ]);
 assert.equal(s.frontend.staleAfterDevChanges.changedComponentFiles,1);
});
