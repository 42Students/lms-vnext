#!/usr/bin/env node
/** Reproducible reference capture; fails closed without authorized dev fixtures.
 * NOT a claim of executed snapshots. Run against disposable seeded dev deployment.
 * Provide four role-scoped Playwright storageState JSON files.
 */
import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const baseURL=process.env.UX_BASE_URL;
const projectId=process.env.UX_MENTOR_PROJECT_ID;
const specs=[
  {role:"college",route:"/college/contacts",storage:process.env.UX_STORAGE_COLLEGE},
  {role:"faculty",route:"/teacher/profile/details",storage:process.env.UX_STORAGE_FACULTY},
  {role:"mentor",route:projectId?"/mentor/projects/"+encodeURIComponent(projectId):null,storage:process.env.UX_STORAGE_MENTOR},
  {role:"tpo",route:"/tpo/home",storage:process.env.UX_STORAGE_TPO},
];
if(!baseURL || !/^https?:\/\/(localhost|127\.0\.0\.1|dev[.-])/i.test(baseURL) ||
   specs.some(spec=>!spec.storage||!spec.route)) {
  process.stderr.write("UX capture requires local/dev UX_BASE_URL, UX_MENTOR_PROJECT_ID and UX_STORAGE_COLLEGE/FACULTY/MENTOR/TPO; no production capture permitted.\n");
  process.exit(2);
}
const output="tests/ux-baselines";
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const snapshots=[];
try {
  for(const spec of specs) {
    for(const width of [320,360,390,768,1280]) {
      const context=await browser.newContext({viewport:{width,height:812},deviceScaleFactor:1,storageState:spec.storage});
      const page=await context.newPage();
      const destination=new URL(spec.route,baseURL);
      await page.goto(destination.href,{waitUntil:"networkidle",timeout:30_000});
      if(new URL(page.url()).pathname!==spec.route) throw new Error(spec.role+" redirected; auth or fixture unavailable");
      await page.locator("h1").first().waitFor();
      const widths=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:window.innerWidth}));
      if(widths.doc>widths.viewport+1) throw new Error(spec.role+" "+width+"px horizontal scroll");
      const target=join(output,spec.role+"-"+width+".png");
      await page.screenshot({path:target,fullPage:true,animations:"disabled"});
      const hash=createHash("sha256").update(await readFile(target)).digest("hex");
      snapshots.push({role:spec.role,route:spec.route,width,sha256:hash,sourceURL:destination.href});
      await context.close();
    }
  }
} finally { await browser.close(); }
await writeFile(join(output,"manifest.json"),JSON.stringify({source:"dev",capturedAt:new Date().toISOString(),snapshots},null,2)+"\n");
process.stdout.write("Captured "+snapshots.length+" source-linked screenshots; manual UX approval still required.\n");
