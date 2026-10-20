/**
 * Clutter + alignment audit. Auth and static route discovery mirror pixel-audit.ts.
 * npx tsx scripts/audit/clutter-audit.ts <role|all>
 * Environment: BASE_URL, CHROME_PATH, ACCOUNTS_FILE, E2E_AUTH_SECRET, AUTH_TEST_OTP.
 */
import { chromium, request as pwRequest, type BrowserContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

type Account = { uid: string; prefixes: string[]; login?: string };
type Finding = { problem: string; penalty: number };
type Measurement = {
  counts: { buttons: number; links: number; inputs: number; cards: number; tables: number; filters: number };
  first800Interactive: number; nestedCardDepth: number; fontSizes: number; fontWeights: number;
  textCharacters: number; emptySections: number; leftEdges: Array<{ name: string; x: number }>;
  alignmentPx: number; unevenGutters: number; unevenGaps: number; unequalRowControlHeights: number;
  wrappedHeaderActions: number; overflowingHeaderActions: number; overflowPx: number;
  findings: Finding[];
};
type Row = Measurement & { role: string; route: string; width: number; status: number | null; finalPath: string; score: number; topProblems: string[] };
const ROOT = path.resolve(__dirname, "../..");
const BASE = (process.env.BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const roleArg = process.argv[2] || "all";
const dir = path.join(ROOT, "docs/audit/ux");
const reportJson = path.join(dir, "clutter-report.json");
const reportMd = path.join(dir, "clutter-report.md");

function loadEnv(): Record<string, string> {
  const p = path.join(ROOT, ".env.local"), env: Record<string, string> = {};
  if (fs.existsSync(p)) for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && !line.trimStart().startsWith("#")) env[line.slice(0,i)] = line.slice(i+1).replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = loadEnv();
function accountsFile(): string {
  const choices = [process.env.ACCOUNTS_FILE, path.join(ROOT,"scripts/audit/accounts.json"),
    path.join(ROOT,"scripts/audit/pixel-accounts.json"), path.join(ROOT,"docs/audit/pixel-accounts.json")];
  const found = choices.find((v): v is string => !!v && fs.existsSync(v));
  if (!found) throw Error("Set ACCOUNTS_FILE to the pixel-audit-compatible accounts JSON.");
  return found;
}
function staticRoutes(prefix: string): string[] {
  const out: string[] = [], app = path.join(ROOT,"src/app");
  function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes:true })) {
      const full = path.join(dir,e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "page.tsx") {
        const parts = path.relative(app,dir).split(path.sep).filter(p => !/^\(.*\)$/.test(p));
        if (!parts.some(p => p.includes("["))) out.push("/"+parts.join("/"));
      }
    }
  }
  walk(app);
  return out.filter(r => r===prefix || r.startsWith(prefix+"/")).sort();
}
async function login(ctx: BrowserContext, acct: Account) {
  if (acct.login) {
    const api = await pwRequest.newContext({baseURL:BASE,extraHTTPHeaders:{Origin:BASE}});
    try {
      const start = await (await api.post("/api/auth/login/start",{
        data:{channel:"PHONE",contact:"+"+acct.login},
      })).json().catch(()=>({})) as {attemptId?:string;requiresSecondFactor?:boolean};
      if (!start.attemptId) throw Error("OTP login start failed");
      const code = process.env.AUTH_TEST_OTP || env.AUTH_TEST_OTP;
      if (!code) throw Error("Missing AUTH_TEST_OTP");
      const response = await api.post("/api/auth/login/verify",{
        data:{attemptId:start.attemptId,code,...(start.requiresSecondFactor?{secondCode:code}:{})},
      });
      if (!response.ok()) throw Error("OTP verification failed with status "+response.status());
      await ctx.addCookies((await api.storageState()).cookies);
    } finally { await api.dispose(); }
  } else {
    const secret = process.env.E2E_AUTH_SECRET || env.E2E_AUTH_SECRET;
    if (!secret) throw Error("Missing E2E_AUTH_SECRET");
    await ctx.addCookies([
      {name:"lms_e2e_identity",value:acct.uid,url:BASE,httpOnly:true,sameSite:"Lax"},
      {name:"lms_e2e_secret",value:secret,url:BASE,httpOnly:true,sameSite:"Lax"},
    ]);
  }
  try {
    const response=await ctx.request.get(BASE+"/api/auth/memberships");
    const data=await response.json().catch(()=>({})) as {memberships?:Array<{id:string}>};
    if (data.memberships?.[0]?.id) await ctx.addCookies([
      {name:"lms_membership",value:data.memberships[0].id,url:BASE,httpOnly:true,sameSite:"Lax"},
    ]);
  } catch { /* Some roles have no college membership. */ }
}
const formula="buttons + .35*links + 1.5*inputs + .75*cards + 2*tables + .5*filters + 1.25*max(0,first800Interactive-12) + 2*max(0,fontSizes-5) + 2*max(0,fontWeights-3) + textCharacters/1000 + sum(finding penalties)";
function score(m:Measurement):number {
  const c=m.counts;
  return Math.round(c.buttons+.35*c.links+1.5*c.inputs+.75*c.cards+2*c.tables+.5*c.filters+
    1.25*Math.max(0,m.first800Interactive-12)+2*Math.max(0,m.fontSizes-5)+
    2*Math.max(0,m.fontWeights-3)+m.textCharacters/1000+
    m.findings.reduce((n,f)=>n+f.penalty,0));
}
async function measure(page: import("@playwright/test").Page):Promise<Measurement> {
  return page.evaluate(() => {
    const findings:Array<{problem:string;penalty:number}>=[];
    function note(problem:string,penalty:number) { if (penalty>0) findings.push({problem,penalty}); }
    function vis(el:Element) {
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);
      return r.width>=1&&r.height>=1&&s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity)>0;
    }
    const bounds=(el:Element)=>el.getBoundingClientRect();
    const label=(el:Element)=>el.tagName.toLowerCase()+
      (el.getAttribute("data-slot")?"["+el.getAttribute("data-slot")+"]":
       el.getAttribute("aria-label")?" "+el.getAttribute("aria-label")?.slice(0,30):"");
    const main=document.querySelector("main") || document.body;
    const elements=[...main.querySelectorAll("*")].filter(vis);
    const interact=elements.filter(el=>el.matches("a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=combobox],summary"));
    const cards=elements.filter(el=>
      el.matches("[data-slot=card],article")||
      (el.matches("section,div") && getComputedStyle(el).backgroundColor==="rgb(255, 255, 255)" &&
       parseFloat(getComputedStyle(el).borderTopWidth)>0 && parseFloat(getComputedStyle(el).borderTopLeftRadius)>=8));
    const count=(selector:string)=>elements.filter(el=>el.matches(selector)).length;
    const counts={
      buttons:count("button,[role=button],summary"),links:count("a[href]"),
      inputs:count("input:not([type=hidden]),select,textarea,[role=combobox]"),
      cards:cards.length,tables:count("table,[role=table],[role=grid]"),
      filters:count("form[role=search],select[name],[data-slot=filters],[aria-label*=filter]"),
    };
    const first800Interactive=interact.filter(el=>bounds(el).y>=0&&bounds(el).y<800).length;
    let nestedCardDepth=0;
    for (const c of cards) {
      let depth=1,p=c.parentElement;
      while(p){if(cards.includes(p))depth++;p=p.parentElement;}
      nestedCardDepth=Math.max(depth,nestedCardDepth);
    }
    if(nestedCardDepth>1)note("Card nesting depth: "+nestedCardDepth,(nestedCardDepth-1)*8);
    const sizes=new Set<string>(),weights=new Set<string>();
    let textCharacters=0;
    for(const el of elements){
      const own=[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent||"").join("").trim();
      if(!own)continue;
      textCharacters+=own.length;
      const css=getComputedStyle(el); sizes.add(css.fontSize);weights.add(css.fontWeight);
    }
    const sections=elements.filter(el=>el.matches("section,article"));
    const emptySections=sections.filter(el=>!(el.textContent||"").trim()&&!el.querySelector("button,input,a,img,svg")).length;
    if(emptySections)note(emptySections+" empty sections",emptySections*3);
    const head=main.querySelector('[data-slot=page-header]')||main.querySelector("h1")?.parentElement;
    const relevant=elements.filter(el=>el.matches("section,article,form,table,[data-slot=card],[data-slot=tabs]"));
    const alignElements=[head,...relevant].filter((el):el is Element=>!!el);
    const leftEdges=alignElements.map(el=>({name:label(el),x:Math.round(bounds(el).left)}));
    // Compare vertical siblings only; nested sections or side-by-side cards need not share x.
    let alignmentPx=0;
    const siblings=new Map<Element,Element[]>();
    for(const el of relevant){
      const parent=el.parentElement;
      if(parent)siblings.set(parent,[...(siblings.get(parent)||[]),el]);
    }
    for(const els of siblings.values()){
      const vertical=els.filter(el=>els.some(other=>other!==el&&
        Math.abs(bounds(other).top-bounds(el).top)>2&&
        (bounds(other).top>=bounds(el).bottom-2||bounds(el).top>=bounds(other).bottom-2)));
      if(vertical.length>1){
        const xs=vertical.map(el=>bounds(el).left);
        alignmentPx=Math.max(alignmentPx,Math.round(Math.max(...xs)-Math.min(...xs)));
      }
    }
    if(alignmentPx>2)note("Vertically stacked sibling sections start "+alignmentPx+"px apart",Math.min(25,Math.ceil(alignmentPx/2)));
    let unevenGutters=0,unevenGaps=0;
    const cardRows=new Map<string,Element[]>();
    for(const el of cards){
      const parent=el.parentElement;
      if(!parent)continue;
      const key=label(parent)+"@"+Math.round(bounds(parent).left)+"|"+Math.round(bounds(el).top/4);
      cardRows.set(key,[...(cardRows.get(key)||[]),el]);
    }
    for(const els of cardRows.values()){
      if(els.length<2)continue;
      els.sort((a,b)=>bounds(a).left-bounds(b).left);
      const pads=els.map(el=>parseFloat(getComputedStyle(el).paddingLeft));
      if(Math.max(...pads)-Math.min(...pads)>2)unevenGutters++;
      const gaps=els.slice(1).map((el,i)=>bounds(el).left-bounds(els[i]).right);
      if(gaps.length>1&&Math.max(...gaps)-Math.min(...gaps)>2)unevenGaps++;
    }
    if(unevenGutters)note(unevenGutters+" rows have unequal card gutters (>2px)",unevenGutters*6);
    if(unevenGaps)note(unevenGaps+" rows have unequal card gaps (>2px)",unevenGaps*6);
    let unequalRowControlHeights=0;
    const controlGroups=new Map<Element,Element[]>();
    for(const el of interact.filter(e=>e.matches("button,input:not([type=hidden]),select,textarea"))){
      if(el.parentElement)controlGroups.set(el.parentElement,[...(controlGroups.get(el.parentElement)||[]),el]);
    }
    for(const controls of controlGroups.values()){
      if(controls.length<2)continue;
      const rowHeights=new Map<number,number[]>();
      for(const el of controls){const y=Math.round(bounds(el).top/4);rowHeights.set(y,[...(rowHeights.get(y)||[]),bounds(el).height]);}
      for(const heights of rowHeights.values())if(heights.length>1&&Math.max(...heights)-Math.min(...heights)>2)unequalRowControlHeights++;
    }
    if(unequalRowControlHeights)note(unequalRowControlHeights+" rows have unequal control heights (>2px)",unequalRowControlHeights*5);
    const headerActions=head?[...head.querySelectorAll("a[href],button")].filter(vis):[];
    const wrappedHeaderActions=Math.max(0,new Set(headerActions.map(el=>Math.round(bounds(el).y/4))).size-1);
    const overflowingHeaderActions=head?headerActions.filter(el=>bounds(el).right>Math.min(innerWidth,bounds(head).right)+2).length:0;
    if(wrappedHeaderActions)note("Header actions wrap into "+(wrappedHeaderActions+1)+" lines",wrappedHeaderActions*5);
    if(overflowingHeaderActions)note(overflowingHeaderActions+" header actions overflow",overflowingHeaderActions*10);
    const overflowPx=Math.max(0,document.documentElement.scrollWidth-innerWidth);
    if(overflowPx>2)note("Horizontal viewport overflow: "+overflowPx+"px",Math.min(30,Math.ceil(overflowPx/4)));
    if(first800Interactive>20)note(first800Interactive+" interactive controls in first 800px",Math.ceil((first800Interactive-20)/4));
    if(counts.inputs>8)note(counts.inputs+" inputs/selects",Math.ceil((counts.inputs-8)/2));
    if(sizes.size>8)note(sizes.size+" distinct font sizes",sizes.size-8);
    if(textCharacters>4000)note(textCharacters+" visible text characters",Math.ceil((textCharacters-4000)/800));
    return {counts,first800Interactive,nestedCardDepth,fontSizes:sizes.size,fontWeights:weights.size,
      textCharacters,emptySections,leftEdges,alignmentPx,unevenGutters,unevenGaps,unequalRowControlHeights,
      wrappedHeaderActions,overflowingHeaderActions,overflowPx,findings};
  });
}
function save(rows:Row[],errors:Array<{role:string;route:string;width:number;reason:string}>) {
  rows.sort((a,b)=>b.score-a.score||a.route.localeCompare(b.route));
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(reportJson,JSON.stringify({generatedAt:new Date().toISOString(),formula,rows,errors},null,2)+"\n");
  const md=[
    "# Authenticated clutter and alignment audit","",
    "Widths: 1280, 768 and 375 at 800px height. Static routes discovered per role prefix; dynamic parameter routes are skipped.","",
    "**Score (higher is worse):** "+formula+".",
    "Penalties: section misalignment ceil(px/2) capped 25; inconsistent gutters or gaps 6 each; control height 5 each; wrapped header row 5; overflowing header action 10; nested cards 8/level; empty section 3; viewport overflow ceil(px/4) capped 30; above-fold controls beyond 20 ceil(extra/4); inputs beyond 8 ceil(extra/2); font sizes above 8 and text above 4000 add modest penalties.","",
    "| Rank | Role | Width | Route | Score | Top five concrete problems |",
    "| ---: | --- | ---: | --- | ---: | --- |",
    ...rows.map((r,i)=>"| "+(i+1)+" | "+r.role+" | "+r.width+" | "+r.route+" | "+r.score+" | "+
      r.topProblems.map(x=>x.replace(/\|/g,"\\|")).join("; ")+" |"),
    "","## Failures and inaccessible routes","",
    ...(!errors.length?["None"]:errors.map(e=>"- "+e.role+" "+e.width+" "+e.route+": "+e.reason)),
    "","Detailed measurements and sampled left edges are in clutter-report.json.","",
  ];
  fs.writeFileSync(reportMd,md.join("\n"));
}
async function main(){
  const accounts=JSON.parse(fs.readFileSync(accountsFile(),"utf8")) as Record<string,Account>;
  const selected=Object.entries(accounts).filter(([role])=>roleArg==="all"||role===roleArg);
  if(!selected.length)throw Error("Unknown role: "+roleArg);
  const browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
  const rows:Row[]=[],errors:Array<{role:string;route:string;width:number;reason:string}>=[];
  try{
    for(const [role,acct] of selected)for(const width of [1280,768,375]){
      const ctx=await browser.newContext({viewport:{width,height:800}});
      try{
        await login(ctx,acct);
        const page=await ctx.newPage(),routes=[...new Set(acct.prefixes.flatMap(staticRoutes))].sort();
        for(const route of routes){
          try{
            const res=await page.goto(BASE+route,{waitUntil:"domcontentloaded",timeout:90000});
            await page.waitForLoadState("networkidle",{timeout:6000}).catch(()=>{});
            await page.waitForTimeout(600);
            const finalPath=new URL(page.url()).pathname;
            if(finalPath.includes("/login")&&!route.includes("/login"))throw Error("REDIRECTED_TO_LOGIN");
            const m=await measure(page);
            rows.push({role,route,width,status:res?.status()??null,finalPath,...m,score:score(m),
              topProblems:[...m.findings].sort((a,b)=>b.penalty-a.penalty).slice(0,5).map(f=>f.problem)});
          }catch(e){errors.push({role,route,width,reason:(e instanceof Error?e.message:String(e)).slice(0,160)});}
        }
      }catch(e){errors.push({role,route:"(authentication)",width,reason:(e instanceof Error?e.message:String(e)).slice(0,160)});}
      finally{await ctx.close();}
      save(rows,errors);
    }
  }finally{await browser.close();}
  console.log("Clutter audit: "+rows.length+" measurements, "+errors.length+" failures.");
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
