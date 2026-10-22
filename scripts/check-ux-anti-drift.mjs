#!/usr/bin/env node
/**
 * Full tracked UI guard, with source-exact immutable legacy snapshot waivers.
 * No origin/main diff needed: this works identically on main and lane branches.
 */
import { readFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { scanUxSource } from "./ux-guard-rules.mjs";

const root=process.cwd();
const waiver=JSON.parse(readFileSync(join(root,"docs/design-system/UX-GUARD-WAIVERS.json"),"utf8"));
if(waiver.schemaVersion!==1 || !/^[a-f0-9]{40}$/.test(waiver.baselineCommit) ||
   !(waiver.expiresOn >= new Date().toISOString().slice(0,10)) ||
   !Array.isArray(waiver.rules)) {
  process.stderr.write("UX waiver baseline invalid/expired; review residual legacy findings.\n");
  process.exit(1);
}
function git(args) {
  return execFileSync("git",args,{cwd:root,encoding:"utf8",maxBuffer:32*1024*1024});
}
let files=[];
try {
  const tracked=git(["ls-files","-z","--","src/app","src/components"]).split("\0");
  files=tracked.filter(path=>/\.[jt]sx?$/.test(path));
  if(!files.length) throw new Error("empty tracked UI list");
} catch(error) {
  process.stderr.write("UX guard cannot enumerate tracked UI sources: "+String(error)+"\n");
  process.exit(1);
}
// GitHub Actions may use fetch-depth:1. Fetch ONLY the immutable reviewed
// baseline commit when absent; never silently replace it with HEAD/main.
const hasBaseline=spawnSync("git",["cat-file","-e",waiver.baselineCommit+"^{commit}"],{cwd:root});
if(hasBaseline.status!==0){
  const fetched=spawnSync("git",["fetch","--no-tags","--depth=1","origin",waiver.baselineCommit],{
    cwd:root,encoding:"utf8",maxBuffer:32*1024*1024,
  });
  if(fetched.status!==0){
    process.stderr.write("Cannot verify immutable UX baseline "+waiver.baselineCommit+
      ". Inspect checkout history or network before lint can pass.\n");
    process.exit(1);
  }
}
const allowedRules=new Set(waiver.rules);
const violations=[];
let waivedCount=0;
const baselineCache=new Map();
function keyFor(item) {
  return item.rule+":"+createHash("sha256").update(item.snippet).digest("hex");
}
function baselineFor(path) {
  if(baselineCache.has(path)) return baselineCache.get(path);
  const base=spawnSync("git",["show",waiver.baselineCommit+":"+path],{
    cwd:root,encoding:"utf8",maxBuffer:32*1024*1024,
  });
  if(base.status!==0) {baselineCache.set(path,null);return null;}
  const counts=new Map();
  for(const finding of scanUxSource(path,base.stdout)) {
    const key=keyFor(finding);
    counts.set(key,(counts.get(key)??0)+1);
  }
  baselineCache.set(path,counts);
  return counts;
}
for(const path of files) {
  const source=readFileSync(join(root,path),"utf8");
  const seen=new Map();
  for(const item of scanUxSource(path,source)) {
    const key=keyFor(item);
    const occurrence=(seen.get(key)??0)+1;
    seen.set(key,occurrence);
    // The immutable source baseline waives ONLY original identical snippets
    // from this path; adding a second identical bad control is still a failure.
    const base=allowedRules.has(item.rule)?baselineFor(path):null;
    if(base && occurrence<=(base.get(key)??0)) {waivedCount++;continue;}
    violations.push(path+":"+item.line+": "+item.rule+" (new or modified; no matching baseline waiver)");
  }
}
const css=readFileSync(join(root,"src/app/globals.css"),"utf8");
for(const required of [
  "--primary-foreground: var(--lms-on-primary)",
  // Primary buttons use #0a7c88 (owner decision "same look, accessible"); white on it is ~5:1 (AA), dark ink would be ~3.4:1.
  "--lms-on-primary: #ffffff",
  "--color-primary-text: var(--lms-link-text)",
]) if(!css.includes(required))violations.push("src/app/globals.css: missing "+required);
if(violations.length) {
  process.stderr.write("UX anti-drift violations:\n"+violations.join("\n")+"\n");
  process.exitCode=1;
} else {
  process.stdout.write("UX anti-drift passed: "+files.length+" tracked UI sources; "+
    waivedCount+" unchanged legacy findings match pinned expiring baseline "+
    waiver.baselineCommit.slice(0,12)+". Browser/AT evidence is separate.\n");
}
