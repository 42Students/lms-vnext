#!/usr/bin/env node
// DB-003: exhaustive tracked-source reference census. A clean scan is NOT approval to retire a product.
import { readFileSync, statSync, lstatSync, writeFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SOURCE_EXT = new Set(['.java','.kt','.sql','.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.yml','.yaml','.xml','.properties','.html','.jsp','.graphql','.gql','.proto','.md','.mdx','.txt','.py','.sh','.zsh','.bash','.gradle','.kts','.go','.rs','.php','.rb','.pl','.groovy','.c','.cc','.cpp','.h','.hpp','.conf','.ini','.toml','.vue','.svelte','.ftl','.hbs','.env']);
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const SHA = /^[a-f\d]{40}$/i;
const BASELINE_TABLES = Object.freeze([
  'smrithi_application','smrithi_college','smrithi_college_keywords',
  'smrithi_education_type','smrithi_notification_template',
  'smrithi_program','smrithi_specialization',
]);

function git(root, args) {
  const result = spawnSync('git', args, {cwd:root, encoding:'utf8', maxBuffer:16*1024*1024});
  if(result.error || result.status !== 0) throw new Error(`git ${args[0]} failed for ${root}: ${result.stderr || result.error || 'unknown error'}`);
  return result.stdout;
}
function contextKind(file) {
  const f = file.replaceAll('\\','/').toLowerCase();
  if(/(?:^|\/)src\/main\/resources\/db\/migration\/|(?:^|\/)db\/migration\/|(?:^|\/)migrations?\//.test(f)) return 'MIGRATION_SOURCE';
  if(/(?:^|\/)(?:test|tests|__tests__|fixtures)(?:\/|$)|\.(?:spec|test)\.[^.]+$/.test(f)) return 'TEST_OR_FIXTURE';
  if(/(?:^|\/)(?:docs?|documentation|readme)(?:\/|\.|$)/.test(f) || f.endsWith('.md')) return 'DOCUMENTATION';
  if(/(?:^|\/)(?:generated|target|dist|build)(?:\/|$)/.test(f)) return 'GENERATED';
  return 'RUNTIME_CANDIDATE';
}
function getPatterns(table) {
  const pascal = table.split('_').map(s=>s[0].toUpperCase()+s.slice(1)).join('');
  const camel = pascal[0].toLowerCase() + pascal.slice(1);
  return new RegExp(`\\b(?:${table}|${pascal}|${camel})\\b`, 'i');
}
const tokenPatterns = Object.fromEntries(BASELINE_TABLES.map(t=>[t,getPatterns(t)]));
const GENERIC = /\bsmrithi[a-z\d_]*\b/i;

export function validateEvidence(evidence) {
  const tables = evidence?.tables;
  if(!SHA.test(evidence?.legacyBackendSha || '') || !Array.isArray(tables)) throw new Error('Invalid DB003 evidence baseline');
  const names = tables.map(r=>r.table).sort();
  if(JSON.stringify(names)!==JSON.stringify([...BASELINE_TABLES].sort()) ||
     tables.some(r=>r.ledgerDisposition!=='PENDING_PRODUCT_DECISION' || r.safeToRetire!==false ||
       !Array.isArray(r.fields) || r.sourceFieldCount!==r.fields.length) ||
     tables.reduce((n,r)=>n+r.sourceFieldCount,0)!==91) throw new Error('DB003 evidence has changed; re-review all seven pending Smrithi tables');
  return true;
}

export function scanText(file, content) {
  const hits=[];
  const lines=content.split(/\r?\n/);
  for(let i=0;i<lines.length;i++) {
    const line=lines[i];
    if(!GENERIC.test(line)) continue;
    const names=BASELINE_TABLES.filter(t=>tokenPatterns[t].test(line));
    hits.push({file,line:i+1,kind:contextKind(file),tables:names,
      unmatchedSmrithiToken:names.length===0,excerpt:line.trim().slice(0,240)});
  }
  return hits;
}

export function scanCheckout({name, root, expectedSha}) {
  if(!SHA.test(expectedSha || '')) throw new Error(`Missing explicit 40-character ${name} oracle SHA`);
  root=resolve(root);
  const actualSha=git(root,['rev-parse','HEAD']).trim();
  if(actualSha!==expectedSha) throw new Error(`${name} oracle SHA mismatch: ${actualSha} !== ${expectedSha}`);
  if(git(root,['status','--porcelain','--untracked-files=no']).trim())
    throw new Error(`${name} tracked files are dirty: source scan requires frozen commit`);
  const paths=git(root,['ls-files','-z','--cached']).split('\0').filter(Boolean).sort();
  const hits=[]; let read=0,skippedNonSource=0;
  for(const file of paths) {
    if(!SOURCE_EXT.has(extname(file).toLowerCase())) {skippedNonSource++;continue;}
    const absolute=resolve(root,file);
    if(!absolute.startsWith(root+sep)) throw new Error(`Unsafe tracked path: ${file}`);
    if(lstatSync(absolute).isSymbolicLink()) throw new Error(`${name}: tracked symlink ${file} is not permitted in consumer scan`);
    const size=statSync(absolute).size;
    if(size>MAX_FILE_BYTES) throw new Error(`${name}: oversized candidate file ${file} (${size} bytes), refusing incomplete scan`);
    const content=readFileSync(absolute,'utf8');
    if(content.includes('\0')) throw new Error(`${name}: unexpected binary candidate ${file}`);
    read++;
    hits.push(...scanText(file,content));
  }
  const byKind={};for(const h of hits)byKind[h.kind]=(byKind[h.kind]||0)+1;
  return {name,commitSha:actualSha,trackedFiles:paths.length,readableSourceFiles:read,
    skippedNonSourceFiles:skippedNonSource,matchLines:hits.length,
    runtimeCandidateLines:byKind.RUNTIME_CANDIDATE||0,
    unattributedLines:hits.filter(h=>h.unmatchedSmrithiToken).length,
    matchesByKind:byKind,hits};
}

export function auditSmrithi({evidence,backend,frontend}) {
  validateEvidence(evidence);
  if(backend.expectedSha!==evidence.legacyBackendSha) throw new Error('Backend oracle must be exact DB003 evidence SHA');
  const repos=[scanCheckout(backend),scanCheckout(frontend)];
  const perTable=Object.fromEntries(BASELINE_TABLES.map(t=>[t,{all:0,runtimeCandidates:0}]));
  for(const repo of repos) for(const hit of repo.hits) for(const t of hit.tables){
    perTable[t].all++;if(hit.kind==='RUNTIME_CANDIDATE')perTable[t].runtimeCandidates++;
  }
  const genericUnattributedLines=repos.reduce((n,r)=>n+r.unattributedLines,0);
  return {status:'SOURCE_SCAN_ONLY_PRODUCT_DECISION_REQUIRED',verifiedPostgres:false,
    approvesRetirement:false,zeroMatchesProveNoExternalConsumers:false,
    backendSha:backend.expectedSha,frontendSha:frontend.expectedSha,
    sourceTables:7,sourceFields:91,perTable,genericUnattributedLines,repos};
}

function argsFrom(argv) {
  const values={};for(let i=0;i<argv.length;i+=2){const k=argv[i];if(!k?.startsWith('--')||!argv[i+1]||argv[i+1].startsWith('--'))throw new Error('Expected paired --key value arguments');values[k.slice(2)]=argv[i+1];}
  for(const k of ['backend','frontend','backend-sha','frontend-sha','evidence'])if(!values[k])throw new Error(`Missing --${k}`);
  return values;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=argsFrom(process.argv.slice(2));
    const evidence=JSON.parse(readFileSync(resolve(args.evidence),'utf8'));
    const output=auditSmrithi({evidence,
      backend:{name:'backend',root:args.backend,expectedSha:args['backend-sha']},
      frontend:{name:'frontend',root:args.frontend,expectedSha:args['frontend-sha']}});
    const json=JSON.stringify(output,null,2)+'\n';
    if(args.out)writeFileSync(resolve(args.out),json);
    else process.stdout.write(json);
  }catch(error){console.error(error.message);process.exitCode=2;}
}
