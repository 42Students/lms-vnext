import {readFileSync,statSync} from "node:fs";
import {resolve} from "node:path";
import {expect,test} from "@playwright/test";
import {z} from "zod";

/**
 * Real browser/R2 validation, NOT an in-memory fake: run only against an
 * isolated test account/bucket with a freshly issued video upload grant.
 * All three boundary sizes require SEPARATE runs with new grants:
 *
 * R2_SMOKE_ENABLED=true APP_ENV=test E2E_ISOLATED_DATABASE=true \\
 * R2_SMOKE_APP_ORIGIN=http://127.0.0.1:8080 \\
 * R2_SMOKE_STORAGE_HOST=uploads.example.test R2_SMOKE_SIZE_MIB=100 \\
 * R2_SMOKE_FILE=/absolute/valid-mp4-file R2_SMOKE_GRANT_FILE=/absolute/grant.json \\
 * npx playwright test tests/e2e/lane13-r2-media-transport.spec.ts
 *
 * Repeat with 1024 and 4900 MiB, issuing a new presigned grant each run.
 * The file must contain valid video bytes; a zero-filled/sparse test file
 * cannot prove scanner or learner playback success. Never commit grants.
 * Browser CORS preflight, required PUT headers, upload progress and timeout
 * are exercised by XHR from the actual application origin.
 */
const enabled=process.env.R2_SMOKE_ENABLED==="true" &&
 process.env.APP_ENV==="test" &&
 process.env.E2E_ISOLATED_DATABASE==="true";

test("isolated R2 single-PUT 100/1024/4900 MiB browser CORS and progress",async({page})=>{
 test.skip(!enabled,"Real isolated R2 grants and matching video files are required");
 const sizeMiB=Number(process.env.R2_SMOKE_SIZE_MIB);
 expect([100,1024,4900]).toContain(sizeMiB);
 const origin=process.env.R2_SMOKE_APP_ORIGIN;
 const storageHost=process.env.R2_SMOKE_STORAGE_HOST;
 const videoFile=process.env.R2_SMOKE_FILE;
 const grantFile=process.env.R2_SMOKE_GRANT_FILE;
 if(!origin||!storageHost||!videoFile||!grantFile)
  throw new Error("Missing isolated R2 video smoke configuration");
 const app=new URL(origin);
 if(!["http:","https:"].includes(app.protocol)||app.username||app.password||
   !(app.hostname==="localhost"||app.hostname==="127.0.0.1"||
      app.hostname.endsWith(".test")))
  throw new Error("Test origin must be an isolated local or .test app");
 const grant=z.strictObject({
  uploadUrl:z.url(),requiredHeaders:z.record(z.string(),z.string()),
  expiresAt:z.iso.datetime({offset:true}),
 }).parse(JSON.parse(readFileSync(resolve(grantFile),"utf8")));
 const uploadUrl=new URL(grant.uploadUrl);
 if(uploadUrl.protocol!=="https:"||uploadUrl.host!==storageHost||
   uploadUrl.username||uploadUrl.password||uploadUrl.hash)
  throw new Error("Signed storage host is outside this isolated smoke test");
 if(Date.parse(grant.expiresAt)<=Date.now()+60_000)
  throw new Error("Generate a fresh signed grant before each large video upload");
 const actualBytes=statSync(resolve(videoFile)).size;
 expect(actualBytes).toBe(sizeMiB*1024*1024);
 // Even a 4.9 GiB fixture must be uploaded from the browser to observe
 // preflight and CORS failures, rather than server-side HTTP which bypasses CORS.
 test.setTimeout(8*60*60_000);
 await page.goto(app.toString(),{waitUntil:"domcontentloaded"});
 await page.evaluate(()=>{
  const input=document.createElement("input");
  input.type="file";
  input.id="r2-lane13-smoke-file";
  input.style.display="none";
  document.body.appendChild(input);
 });
 await page.locator("#r2-lane13-smoke-file").setInputFiles(resolve(videoFile));
 const result=await page.evaluate(async args=>{
  const file=document.querySelector<HTMLInputElement>("#r2-lane13-smoke-file")?.files?.[0];
  if(!file)throw new Error("Browser file selection failed");
  return new Promise<{status:number;progress:number[]}>((done,fail)=>{
   const request=new XMLHttpRequest();
   const progress:number[]=[];
   request.open("PUT",args.url);
   request.withCredentials=false;
   request.timeout=8*60*60_000;
   for(const [key,value] of Object.entries(args.headers))
    request.setRequestHeader(key,value);
   request.upload.onprogress=event=>{
    if(event.lengthComputable&&event.total>0)
     progress.push(Math.round(100*event.loaded/event.total));
   };
   request.onload=()=>done({status:request.status,progress});
   request.onerror=()=>fail(new Error("Browser PUT failed: check test R2 CORS allow-origin/method/headers"));
   request.ontimeout=()=>fail(new Error("Browser PUT timed out before R2 confirmed upload"));
   request.send(file);
  });
 },{url:grant.uploadUrl,headers:grant.requiredHeaders});
 expect(result.status).toBeGreaterThanOrEqual(200);
 expect(result.status).toBeLessThan(300);
 expect(result.progress.every(n=>Number.isInteger(n)&&n>=0&&n<=100)).toBe(true);
 // The test validates upload transport. Only the app's completion endpoint,
 // trusted scanner and a signed learner grant can attest READY and playback.
});

test("isolated learner playback seeks and advances with a signed grant",async({page})=>{
 test.skip(!enabled||!process.env.R2_SMOKE_LEARNER_URL,
  "A separately seeded, scanned, published learner-video page is required");
 const raw=process.env.R2_SMOKE_LEARNER_URL;
 if(!raw)throw new Error("Missing R2_SMOKE_LEARNER_URL");
 const appOrigin=process.env.R2_SMOKE_APP_ORIGIN;
 if(!appOrigin||new URL(raw).origin!==new URL(appOrigin).origin)
  throw new Error("Learner playback must stay on the isolated test app origin");
 await page.goto(raw);
 const video=page.locator("video").first();
 await expect(video).toBeVisible();
 await video.evaluate(async element=>{
  const media=element as HTMLVideoElement;
  if(media.readyState<1)await new Promise<void>((resolve,reject)=>{
   media.addEventListener("loadedmetadata",()=>resolve(),{once:true});
   media.addEventListener("error",()=>reject(new Error("Video metadata failed")),{once:true});
  });
  if(!Number.isFinite(media.duration)||media.duration<10)
   throw new Error("Real seekable media with at least ten seconds is required");
  media.currentTime=Math.min(7,media.duration/2);
 });
 await expect.poll(()=>video.evaluate(element=>(element as HTMLVideoElement).currentTime))
  .toBeGreaterThan(2);
});
