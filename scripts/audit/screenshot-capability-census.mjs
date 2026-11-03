#!/usr/bin/env node
/**
 * Read-only discovery census for the independent parity-baseline archive.
 *
 * A package is NOT a missing feature; unmatched images or routes are only
 * candidates for source-and-browser reconciliation. This tool does not score
 * screenshot pixels, mark canonical ledgers closed or write an audit tracker.
 *
 * Usage:
 *   git worktree add --detach ../lms-parity-baseline origin/parity-baseline
 *   node scripts/audit/screenshot-capability-census.mjs --baseline ../lms-parity-baseline
 *   node scripts/audit/screenshot-capability-census.mjs --baseline ../lms-parity-baseline --json
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const PACKAGE_ID=/^[a-z][a-z0-9-]*-\d{3}$/;
const PAGE_LINE=/^Page:\s*`([^`]+)` on old LMS,\s*`([^`]+)` on vNext\./m;
const IMAGE_LINE=/^\s*-\s+`(old|vnext)\/([^`]+\.png)`(?:\s*—\s*(.*))?$/gm;
const PAGE_FILE=/^page\.(?:js|jsx|ts|tsx)$/;

export function routeForNextPage(relativeFile){
 const normalized=relativeFile.replaceAll("\\","/");
 const parts=normalized.split("/");
 if(!PAGE_FILE.test(parts.at(-1)??""))return null;
 parts.pop();
 const clean=parts.filter(part=>part&&
   !/^\([^/]+\)$/.test(part)&&!part.startsWith("@"));
 return "/"+clean.join("/");
}

/** A Next route parameter's spelling is not part of its public URL.
 * Compare /[leadId] and /[recruiterLeadId] as the same route shape.
 */
export function routeShape(route){
 return route.split("/").map(part=>{
  if(/^\[\[\.\.\.[^\]]+\]\]$/.test(part))return "[[...]]";
  if(/^\[\.\.\.[^\]]+\]$/.test(part))return "[...]";
  if(/^\[[^\]]+\]$/.test(part))return "[]";
  return part;
 }).join("/");
}

export function indexAppRoutes(appRoot){
 const routes=new Set();
 function walk(dir,relative=""){
  if(!fs.existsSync(dir))return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
   const next=path.join(dir,entry.name);
   const rel=relative?relative+"/"+entry.name:entry.name;
   if(entry.isDirectory())walk(next,rel);
   else if(entry.isFile()&&PAGE_FILE.test(entry.name)){
    const route=routeForNextPage(rel);
    if(route)routes.add(route);
   }
  }
 }
 walk(appRoot);
 return routes;
}

export function parsePackageManifest(markdown,id){
 if(!PACKAGE_ID.test(id))throw new Error("Invalid screenshot package ID: "+id);
 const match=PAGE_LINE.exec(markdown);
 if(!match)throw new Error("No Page route metadata in "+id);
 const oldRoute=match[1],vnextRoute=match[2];
 const old=[],vnext=[];
 for(const [,side,asset,state] of markdown.matchAll(IMAGE_LINE)){
  const shot={asset:side+"/"+asset,state:(state??"").trim()};
  (side==="old"?old:vnext).push(shot);
 }
 return {id,role:id.slice(0,id.lastIndexOf("-")),oldRoute,vnextRoute,
  oldImages:old.length,vnextImages:vnext.length,
  oldStates:old.map(x=>x.state),vnextStates:vnext.map(x=>x.state),
  images:{old,vnext}};
}

export function buildScreenshotCapabilityCensus({
 baselineRoot,appRoot,
}){
 const queuePath=path.join(baselineRoot,"packages","QUEUE.md");
 const queue=fs.readFileSync(queuePath,"utf8").split(/\r?\n/)
  .map(line=>/^\s*-\s+([a-z][a-z0-9-]*-\d{3})\s*$/.exec(line)?.[1]??null)
  .filter(Boolean);
 const routeIndex=indexAppRoutes(appRoot);
 const routeShapes=new Set([...routeIndex].map(routeShape));
 const packages=[];
 const issues=[];
 const seen=new Set();
 for(const id of queue){
  if(seen.has(id)){issues.push({id,reason:"DUPLICATE_QUEUE_ID"});continue;}
  seen.add(id);
  const file=path.join(baselineRoot,"packages",id+".md");
  if(!fs.existsSync(file)){issues.push({id,reason:"PACKAGE_FILE_MISSING"});continue;}
  try{
   const pkg=parsePackageManifest(fs.readFileSync(file,"utf8"),id);
   const directRoute=pkg.vnextRoute!=="-"&&routeShapes.has(routeShape(pkg.vnextRoute));
   const captureStatus=pkg.oldRoute==="-"
    ?"VNEXT_ONLY_CAPTURE"
    :pkg.vnextRoute==="-"
     ?"OLD_ONLY_CAPTURE"
     :pkg.vnextImages===0
      ?"VNEXT_IMAGE_NOT_CAPTURED"
      :pkg.oldImages===0
       ?"OLD_IMAGE_NOT_CAPTURED"
       :"BOTH_SIDES_CAPTURED";
   packages.push({...pkg,directRoute,captureStatus});
  }catch(error){issues.push({id,reason:"PARSE_ERROR",detail:String(error)});}
 }
 const groups=new Map();
 for(const pkg of packages){
  const key=[pkg.role,pkg.oldRoute,pkg.vnextRoute].join("::");
  let group=groups.get(key);
  if(!group){
   group={role:pkg.role,oldRoute:pkg.oldRoute,vnextRoute:pkg.vnextRoute,
    ids:[],oldImages:0,vnextImages:0,directRoute:pkg.directRoute,
    captureStatuses:[]};
   groups.set(key,group);
  }
  group.ids.push(pkg.id);
  group.oldImages+=pkg.oldImages;
  group.vnextImages+=pkg.vnextImages;
  if(!group.captureStatuses.includes(pkg.captureStatus))
   group.captureStatuses.push(pkg.captureStatus);
 }
 const families=[...groups.values()].map(g=>({
  ...g,
  reviewReason:g.oldRoute==="-"
   ?"VNEXT_ONLY_RECONCILE"
   :g.vnextRoute==="-"
    ?"OLD_ONLY_RECONCILE"
    :!g.directRoute
     ?"TARGET_ROUTE_NOT_DIRECTLY_PRESENT"
     :g.vnextImages===0
      ?"V_NEXT_CAPTURE_MISSING"
      :g.oldImages===0
       ?"OLD_CAPTURE_MISSING"
       :"TRACE_ACTIONS_AND_VERIFY",
 })).sort((a,b)=>{
  const priority={"OLD_ONLY_RECONCILE":0,"TARGET_ROUTE_NOT_DIRECTLY_PRESENT":1,
   "V_NEXT_CAPTURE_MISSING":2,"TRACE_ACTIONS_AND_VERIFY":3,
   "OLD_CAPTURE_MISSING":4,"VNEXT_ONLY_RECONCILE":5};
  return priority[a.reviewReason]-priority[b.reviewReason]||
   a.role.localeCompare(b.role)||a.oldRoute.localeCompare(b.oldRoute);
 });
 const counts=(items,key)=>items.reduce((acc,item)=>{
  const value=item[key];
  acc[value]=(acc[value]??0)+1;
  return acc;
 },{});
 return {
  policy:"DISCOVERY_ONLY_NOT_A_FEATURE_COMPLETION_PERCENTAGE",
  summary:{
   queueEntries:queue.length,uniquePackageIds:seen.size,
   parsedPackages:packages.length,parseIssues:issues.length,
   namedOldImages:packages.reduce((n,p)=>n+p.oldImages,0),
   namedVnextImages:packages.reduce((n,p)=>n+p.vnextImages,0),
   distinctRoutePairs:families.length,
   appPageRoutesIndexed:routeIndex.size,
   captureStatuses:counts(packages,"captureStatus"),
   reviewReasons:counts(families,"reviewReason"),
  },
  issues,families,packages,
 };
}

function getArg(name,fallback){
 const prefix="--"+name+"=";
 const inline=process.argv.find(arg=>arg.startsWith(prefix));
 if(inline)return inline.slice(prefix.length);
 const index=process.argv.indexOf("--"+name);
 return index<0?fallback:process.argv[index+1]??fallback;
}

const invoked=process.argv[1];
if(invoked&&path.resolve(invoked)===fileURLToPath(import.meta.url)){
 const baselineRoot=path.resolve(getArg("baseline","../lms-parity-baseline"));
 const appRoot=path.resolve(getArg("app","src/app"));
 const report=buildScreenshotCapabilityCensus({baselineRoot,appRoot});
 const role=getArg("role",null);
 const families=role?report.families.filter(g=>g.role===role):report.families;
 if(process.argv.includes("--json")){
  process.stdout.write(JSON.stringify({...report,families},null,2)+"\n");
 }else{
  process.stdout.write("Screenshot capability discovery (NOT closure)\n");
  process.stdout.write(JSON.stringify(report.summary,null,2)+"\n");
  if(report.issues.length)process.stdout.write("Integrity problems: "+JSON.stringify(report.issues.slice(0,12))+"\n");
  for(const g of families.slice(0,35))
   process.stdout.write(g.role+" "+g.ids.join(",")+" "+g.oldRoute+" -> "+g.vnextRoute+
    " ["+g.reviewReason+"] old="+g.oldImages+" vnext="+g.vnextImages+"\n");
  process.stdout.write("Review actual FE/BE source and authorized browser actions before declaring ANY route/surface missing or closed.\n");
 }
 if(report.issues.length)process.exitCode=1;
}
