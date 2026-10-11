#!/usr/bin/env node
// DB-027: source-only staged-SQL catalog. Never runs SQL or certifies PostgreSQL.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FOLDERS = ["docs/planning/sql", "scripts/sql"];
const EXTRA = ["docs/planning/db04-proposed-migration.sql"];
const SKIP = /(?:readonly|witness|acceptance)/i;

// Hide comments and SQL literals, including nested PostgreSQL comments,
// E'...' escaped strings, dollar-quoted bodies and opaque quoted identifiers.
export function stripSqlLiterals(sql) {
  let out = "", i=0, mode="code", tag="", blockDepth=0, escapedString=false;
  while (i<sql.length) {
    const a=sql[i], b=sql[i+1];
    if (mode==="line") { out+=a==="\n"?"\n":" "; if(a==="\n")mode="code";i++;continue; }
    if (mode==="block") {
      if(a==="/"&&b==="*"){out+="  ";i+=2;blockDepth++;continue;}
      if(a==="*"&&b==="/"){out+="  ";i+=2;if(--blockDepth===0)mode="code";continue;}
      out+=a==="\n"?"\n":" ";i++;continue;
    }
    if (mode==="string") {
      if(escapedString&&a==="\\"&&i+1<sql.length){out+="  ";i+=2;continue;}
      if(a==="'"&&b==="'"){out+="  ";i+=2;continue;}
      out+=a==="\n"?"\n":" ";i++;if(a==="'")mode="code";continue;
    }
    if (mode==="dollar") {
      if(sql.startsWith(tag,i)){out+=" ".repeat(tag.length);i+=tag.length;mode="code";}
      else{out+=a==="\n"?"\n":" ";i++;}continue;
    }
    if(a==="-"&&b==="-"){out+="  ";i+=2;mode="line";continue;}
    if(a==="/"&&b==="*"){out+="  ";i+=2;blockDepth=1;mode="block";continue;}
    if((a==="E"||a==="e")&&b==="'"&&(i===0||!/[\w$]/.test(sql[i-1]))){
      out+="  ";i+=2;escapedString=true;mode="string";continue;
    }
    if(a==="'"){out+=" ";i++;escapedString=false;mode="string";continue;}
    if(a==='"'){
      let j=i+1, identifier="", closed=false;
      while(j<sql.length){
        if(sql[j]==='"'&&sql[j+1]==='"'){identifier+='"';j+=2;continue;}
        if(sql[j]==='"'){j++;closed=true;break;}
        identifier+=sql[j++];
      }
      const raw=sql.slice(i,j);
      out+=closed&&/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)
        ?raw:raw.replace(/[^\n]/g," ");
      i=j;continue;
    }
    if(a==="$"){
      const m=/^\$[A-Za-z0-9_]*\$/.exec(sql.slice(i));
      if(m){tag=m[0];out+=" ".repeat(tag.length);i+=tag.length;mode="dollar";continue;}
    }
    out+=a;i++;
  }
  return out;
}
const creations=/\bCREATE\s+(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?("[\w]+"|[\w]+)/gi;
const alters=/\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?("[\w]+"|[\w]+)/gi;
const refs=/\bREFERENCES\s+(?:public\.)?("[\w]+"|[\w]+)/gi;
function take(body,re){return [...new Set([...body.matchAll(re)].map(m=>m[1].replaceAll('"',"").toLowerCase()))];}
export function classify(sql) {
  const head=sql.split("\n").slice(0,20).join("\n");
  if(/^\s*--[^\n]*\bSUPERSEDED\b/im.test(head))return "SUPERSEDED";
  if(/\bSOURCE REFERENCE ONLY\b|\bNO DDL\b|\bNOT FOR EXECUTION\b/i.test(head))return "REFERENCE_ONLY";
  return "STAGED";
}
export function inspect(item){
  const body=stripSqlLiterals(item.sql);
  const allCreates=[...body.matchAll(creations)].map(m=>m[1].replaceAll('"',"").toLowerCase());
  const createDuplicates=[...new Set(allCreates.filter((t,i)=>allCreates.indexOf(t)!==i))];
  return {path:item.path,state:classify(item.sql),
    create:[...new Set(allCreates)],createDuplicates,
    alter:take(body,alters),references:take(body,refs),
    destructive:/\b(?:DROP\s+TABLE|TRUNCATE\s+TABLE|DELETE\s+FROM)\b/i.test(body)};
}
export function analyze({candidates,registered=[],declared=[]}) {
  const files=candidates.map(inspect).sort((a,b)=>a.path.localeCompare(b.path));
  const active=files.filter(x=>x.state==="STAGED");
  const ignored=files.filter(x=>x.state!=="STAGED");
  const known=new Set(registered.flatMap(x=>take(stripSqlLiterals(x.sql),creations)));
  const creators=new Map();
  for(const f of active)for(const name of f.create){
    creators.set(name,[...(creators.get(name)||[]),f.path]);
  }
  const duplicates=[...creators].filter(([,p])=>p.length>1).map(([table,files])=>({table,files}));
  const repeatedWithinFile=active.filter(f=>f.createDuplicates.length).map(f=>
    ({file:f.path,tables:f.createDuplicates}));
  const registeredOverlap=[...creators.keys()].filter(k=>known.has(k)).sort();
  const ignoredExecutable=ignored.filter(x=>x.create.length||x.alter.length||x.destructive).map(x=>x.path);
  const unresolved=[],required=[],dependencies=new Map(active.map(f=>[f.path,new Set()]));
  for(const f of active)for(const table of new Set([...f.alter,...f.references])){
    const providers=(creators.get(table)||[]).filter(p=>p!==f.path);
    if(providers.length){
      for(const p of providers)dependencies.get(f.path).add(p);
      required.push({file:f.path,parentTable:table,stagedProviders:providers});
    }else if(!known.has(table)&&!(creators.get(table)||[]).includes(f.path)){
      unresolved.push({file:f.path,parentTable:table,
        category:declared.includes(table)?"DECLARED_NOT_PROVEN_REGISTERED":"NO_KNOWN_SQL_CREATOR"});
    }
  }
  const ordered=[],visited=new Set();
  while(true){
    const ready=[...dependencies].filter(([p,deps])=>!visited.has(p)&&[...deps].every(d=>visited.has(d))).map(([p])=>p).sort();
    if(!ready.length)break;
    for(const p of ready){visited.add(p);ordered.push(p);}
  }
  const cycles=[...dependencies].filter(([p])=>!visited.has(p)).map(([p,deps])=>({file:p,
    unmet:[...deps].filter(d=>!visited.has(d))}));
  const destructive=active.filter(x=>x.destructive).map(x=>x.path);
  const hazards=!!(duplicates.length||repeatedWithinFile.length||registeredOverlap.length||ignoredExecutable.length||
    unresolved.length||cycles.length||destructive.length);
  return {
    verification:"SOURCE_ONLY_NO_MIGRATION_OR_POSTGRES_EXECUTED",
    safeForAutomaticPromotion:false,
    hazards,counts:{scanned:files.length,active:active.length,ignored:ignored.length,
      createdTableNames:creators.size,unresolvedParents:unresolved.length,
      stagedDependencies:required.length},
    duplicates,repeatedWithinFile,registeredOverlap,ignoredExecutable,unresolved,required,cycles,
    destructive,proposedSourceOrder:ordered,
  };
}
function crawl(root,folder){
  if(!fs.existsSync(folder))return [];
  return fs.readdirSync(folder,{withFileTypes:true}).flatMap(ent=>{
    const full=path.join(folder,ent.name);
    if(ent.isDirectory())return crawl(root,full);
    if(!ent.isFile()||!ent.name.endsWith(".sql")||SKIP.test(ent.name))return [];
    return [{path:path.relative(root,full).replaceAll("\\","/"),sql:fs.readFileSync(full,"utf8")}];
  });
}
export function analyzeCheckout(root=ROOT) {
  const candidates=FOLDERS.flatMap(dir=>crawl(root,path.join(root,dir)));
  for(const rel of EXTRA){const p=path.join(root,rel);
    if(fs.existsSync(p))candidates.push({path:rel,sql:fs.readFileSync(p,"utf8")});}
  const jfile=path.join(root,"drizzle/meta/_journal.json");
  const registered=fs.existsSync(jfile)
    ?JSON.parse(fs.readFileSync(jfile,"utf8")).entries.map(e=>{
      const rel="drizzle/"+e.tag+".sql",p=path.join(root,rel);
      if(!fs.existsSync(p))throw Error("Registered migration missing: "+rel);
      return {path:rel,sql:fs.readFileSync(p,"utf8")};
    }):[];
  const declared=[],schemadir=path.join(root,"src/db/schema");
  if(fs.existsSync(schemadir))for(const f of fs.readdirSync(schemadir)){
    if(!f.endsWith(".ts"))continue;
    const body=fs.readFileSync(path.join(schemadir,f),"utf8");
    for(const m of body.matchAll(/\bpgTable\s*\(\s*["']([\w]+)["']/g))declared.push(m[1]);
  }
  return analyze({candidates,registered,declared});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const result=analyzeCheckout(process.cwd());
    if(process.argv.includes("--json"))console.log(JSON.stringify(result,null,2));
    else console.log("DB-027 staged SQL (read-only): "+JSON.stringify({counts:result.counts,
      duplicateCreators:result.duplicates.length,cycles:result.cycles.length,
      registeredOverlap:result.registeredOverlap.length,hazards:result.hazards}));
    if(result.hazards)process.exitCode=2;
  }catch(error){console.error(error instanceof Error?error.stack:error);process.exitCode=1;}
}
