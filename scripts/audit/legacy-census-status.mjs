#!/usr/bin/env node
// Read-only coverage checker for the frozen legacy-dev source census.
// IMPORTANT: a route scan is NOT an exhaustive inventory of runtime UI surfaces.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const INSPECTIONS = Object.freeze({
  "learner":"learner-route-inspection.json",
  "faculty":"faculty-route-inspection.json",
  "mentor":"mentor-route-inspection.json",
  "college-admin":"college-admin-route-inspection.json",
  "super-admin":"super-admin-route-inspection.json",
  "tpo":"tpo-route-inspection.json",
  "recruiter":"recruiter-route-inspection.json",
  "shared-public":"shared-public-route-inspection.json",
});
const here=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(here,"..","..");
const CENSUS="docs/audit/legacy-dev-census/";
const read=(root,name)=>JSON.parse(fs.readFileSync(path.join(root,CENSUS,name),"utf8"));
const paths=arr=>(arr||[]).map(row=>row.path).filter(Boolean);
const unique=arr=>[...new Set(arr)].sort();
const diff=(expected,observed)=>unique(expected).filter(p=>!new Set(observed).has(p));

export function buildLegacyCensusStatus({census,inspectionFiles,overlay,deep,backend,drift}) {
  const problems=[];
  const expectedRoutes=paths(census.legacyRouteFiles), expectedComponents=paths(census.legacyFrontendComponentFiles),
    expectedBack=paths(census.legacyBackendControllerCandidates);
  const scannedRoutes=[],failures=[];
  const scans={};
  for(const [account,doc] of Object.entries(INSPECTIONS)){
    const found=inspectionFiles[doc]?.records||[];
    scans[account]={inspected:found.length,errors:found.filter(r=>r.error).length};
    for(const row of found){
      scannedRoutes.push(row.path);
      if(row.error) failures.push({account,path:row.path,error:row.error});
    }
  }
  for(const [label,all] of [["expectedRoutes",expectedRoutes],["expectedComponents",expectedComponents],["expectedBackendControllers",expectedBack]]){
    if(new Set(all).size!==all.length)problems.push("duplicate path in "+label);
  }
  if(new Set(scannedRoutes).size!==scannedRoutes.length)problems.push("duplicate route record across account scans");
  const unknownRoutes=diff(scannedRoutes,expectedRoutes);
  if(unknownRoutes.length)problems.push("inspections not in frozen route census: "+unknownRoutes.slice(0,8).join(", "));
  const overlayPaths=paths(overlay.records),deepPaths=paths(deep.records);
  const candidateChecked=unique([...overlayPaths,...deepPaths]);
  const unknownComponents=diff(candidateChecked,expectedComponents);
  if(unknownComponents.length)problems.push("inspected components not in frozen component census: "+unknownComponents.slice(0,8).join(", "));
  const backPaths=paths(backend.records);
  const unknownBack=diff(backPaths,expectedBack);
  if(unknownBack.length)problems.push("inspected backend controllers not in frozen controller list: "+unknownBack.slice(0,8).join(", "));
  const missingRoutePaths=diff(expectedRoutes,scannedRoutes), missingComponentPaths=diff(expectedComponents,candidateChecked),
    missingControllerPaths=diff(expectedBack,backPaths);
  const changedRoutes=(drift.legacyFrontend?.changedSourcePages||[]).map(x=>x.path);
  const affectedRoutes=changedRoutes.filter(p=>expectedRoutes.includes(p));
  const affectedComponents=(drift.legacyFrontend?.changedSourceComponents||[]).map(x=>x.path)
    .filter(p=>expectedComponents.includes(p));
  const status={
    sourceBaseline:{
      frontend:census.sourceSnapshots?.legacyFrontend?.treeSha,
      backend:census.sourceSnapshots?.legacyBackend?.treeSha,
      vnext:census.sourceSnapshots?.vNext?.treeSha,
    },
    observedDev:{
      frontend:drift.legacyFrontend?.current,backend:drift.legacyBackend?.current,
      note:"Source files inspected at baseline do not certify these later observed dev commits.",
    },
    frontend:{
      routeSourceFiles:expectedRoutes.length,routeSourceFilesInspected:unique(scannedRoutes).length,
      missingRouteSourceFiles:missingRoutePaths.length,routeReadErrors:failures.length,
      componentSourceFiles:expectedComponents.length,
      specificallyInspectedComponentFiles:candidateChecked.length,
      uninspectedComponentSourceFiles:missingComponentPaths.length,
      namedOverlayFileCandidates:(census.counts?.namedLegacyOverlayCandidateFiles||null),
      namedOverlayFileRecords:unique(overlayPaths).length,
      deepComponentRecords:unique(deepPaths).length,
      staleAfterDevChanges:{changedRouteFiles:affectedRoutes.length,changedComponentFiles:affectedComponents.length,
        routes:affectedRoutes,components:affectedComponents},
    },
    backend:{controllerCandidateFiles:expectedBack.length,
      controllerSourceFilesInspected:unique(backPaths).length,
      uninspectedControllerSourceFiles:missingControllerPaths.length,
      changedJavaFiles:(drift.legacyBackend?.changedJavaFiles||[]).length},
    byAccount:scans,uninspected:{
      routePaths:missingRoutePaths,
      componentPaths:missingComponentPaths,
      controllerPaths:missingControllerPaths,
    },
    structuralProblems:problems,readErrors:failures,
    disclaimers:[
      "These are FILE coverage counts, never distinct visible UI surfaces or functional parity.",
      "A route can delegate its UI to many imports; components and dynamic conditional overlays require transitive reachability plus runtime verification.",
      "Backend endpoint and permission ownership must be proved by service/action tracing.",
      "Changed dev frontend/backend oracles require targeted re-audit; historical data cannot pass final freeze.",
      "Neither this report nor a clean structural check can turn a page green.",
    ],
  };
  return status;
}
export function loadLegacyCensusStatus(root=ROOT){
  const docs=Object.fromEntries(Object.entries(INSPECTIONS).map(([a,p])=>[p,read(root,p)]));
  return buildLegacyCensusStatus({
    census:read(root,"2026-10-27-source-tree.json"),
    inspectionFiles:docs,
    overlay:read(root,"overlay-component-inspection.json"),
    deep:read(root,"deep-component-inspection.json"),
    backend:read(root,"backend-controller-inspection.json"),
    drift:read(root,"oracle-drift-2026-10-27.json"),
  });
}
export function run(argv=process.argv.slice(2),root=ROOT){
  if(argv.includes("--help")){
    process.stdout.write("Usage: node scripts/audit/legacy-census-status.mjs [--check|--json|--assert-exhaustive]\n");
    return 0;
  }
  const result=loadLegacyCensusStatus(root);
  const brief={...result,uninspected:{
    routePaths:result.uninspected.routePaths.slice(0,20),
    componentPaths:result.uninspected.componentPaths.slice(0,40),
    controllerPaths:result.uninspected.controllerPaths.slice(0,20),
  }};
  process.stdout.write(JSON.stringify(argv.includes("--json")?result:brief,null,2)+"\n");
  if(argv.includes("--check")&& (result.structuralProblems.length||result.readErrors.length))return 1;
  if(argv.includes("--assert-exhaustive") &&(
    result.frontend.missingRouteSourceFiles||
    result.frontend.uninspectedComponentSourceFiles||
    result.backend.uninspectedControllerSourceFiles||
    result.frontend.staleAfterDevChanges.changedRouteFiles||
    result.frontend.staleAfterDevChanges.changedComponentFiles))return 2;
  return 0;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.exitCode=run();}catch(e){console.error(e.message);process.exitCode=1;}
}
