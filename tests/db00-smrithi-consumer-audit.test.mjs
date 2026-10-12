import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {scanText,scanCheckout,auditSmrithi,validateEvidence} from '../scripts/db00-smrithi-consumer-audit.mjs';

const TABLES=['smrithi_application','smrithi_college','smrithi_college_keywords','smrithi_education_type','smrithi_notification_template','smrithi_program','smrithi_specialization'];
const goodEvidence=()=>({legacyBackendSha:'a'.repeat(40),tables:TABLES.map((t,i)=>({table:t,ledgerDisposition:'PENDING_PRODUCT_DECISION',safeToRetire:false,sourceFieldCount:i===0?85:1,fields:Array.from({length:i===0?85:1},(_,n)=>({column:`c${n}`}))}))});
function cmd(root,...args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function repo(files){const root=mkdtempSync(join(tmpdir(),'smrithi-audit-'));cmd(root,'init','-q');cmd(root,'config','user.email','test@example.com');cmd(root,'config','user.name','Test');for(const [file,contents] of Object.entries(files)){mkdirSync(dirname(join(root,file)),{recursive:true});writeFileSync(join(root,file),contents);}cmd(root,'add','.');cmd(root,'commit','-qm','freeze');return{root,sha:cmd(root,'rev-parse','HEAD'),dispose:()=>rmSync(root,{recursive:true,force:true})};}

test('identifies SQL snake case and Java upper/camel aliases',()=>{
  const hits=scanText('src/main/java/App.java','SELECT * FROM smrithi_application;\nSmrithiCollegeKeywords value;\nsmrithiNotificationTemplate template;');
  assert.deepEqual(hits.map(x=>x.tables),[['smrithi_application'],['smrithi_college_keywords'],['smrithi_notification_template']]);
  assert.ok(hits.every(x=>x.kind==='RUNTIME_CANDIDATE'));
});
test('keeps migration-only history separate from runtime candidates',()=>{
  const a=scanText('src/main/resources/db/migration/V001__initial.sql','CREATE TABLE smrithi_application (id BIGINT);');
  const b=scanText('src/test/java/SmokeTest.java','select smrithi_application from test');
  const c=scanText('docs/old.md','smrithi_application');
  assert.equal(a[0].kind,'MIGRATION_SOURCE');assert.equal(b[0].kind,'TEST_OR_FIXTURE');assert.equal(c[0].kind,'DOCUMENTATION');
});
test('unknown Smrithi consumer tokens fail open as unattributed hits, not absence',()=>{
  const hits=scanText('src/main/java/Repo.java','SmrithiReader reader;');
  assert.equal(hits.length,1);assert.equal(hits[0].unmatchedSmrithiToken,true);
});
test('does not infer retirement on a clean scan with zero matching files',()=>{
  const b=repo({'src/main/java/Main.java':'class Main {}'});
  const f=repo({'src/app.ts':'export const app = true;'});
  try{
    const evidence=goodEvidence();evidence.legacyBackendSha=b.sha;
    const result=auditSmrithi({evidence,backend:{name:'backend',root:b.root,expectedSha:b.sha},frontend:{name:'frontend',root:f.root,expectedSha:f.sha}});
    assert.equal(result.approvesRetirement,false);
    assert.equal(result.status,'SOURCE_SCAN_ONLY_PRODUCT_DECISION_REQUIRED');
    assert.equal(result.repos[0].matchLines,0);
    assert.equal(result.sourceFields,91);
  }finally{b.dispose();f.dispose();}
});
test('rejects dirty tracked checkout instead of certifying frozen source',()=>{
  const r=repo({'app.java':'SmrithiApplication app;'});
  try{writeFileSync(join(r.root,'app.java'),'class changed {}');assert.throws(()=>scanCheckout({name:'backend',root:r.root,expectedSha:r.sha}),/dirty/);}
  finally{r.dispose();}
});
test('rejects old or mismatched commit even if matching content appears',()=>{
  const r=repo({'readme.md':'SMRITHI_APPLICATION'});
  try{assert.throws(()=>scanCheckout({name:'backend',root:r.root,expectedSha:'b'.repeat(40)}),/oracle SHA mismatch/);}
  finally{r.dispose();}
});
test('preserves exact path, line and ambiguous uses in output',()=>{
  const r=repo({'src/main/java/Use.java':'class Use {\n String sql = "smrithi_program";\n SmrithiDynamic instance;\n}','src/main/resources/db/migration/V1__x.sql':'CREATE TABLE smrithi_program (id INT);'});
  try{
    const out=scanCheckout({name:'backend',root:r.root,expectedSha:r.sha});
    assert.equal(out.matchLines,3);assert.equal(out.runtimeCandidateLines,2);assert.equal(out.unattributedLines,1);
    assert.ok(out.hits.find(x=>x.line===2&&x.file.endsWith('Use.java')));
  }finally{r.dispose();}
});
test('refuses incorrectly preapproved retirements or changed table census',()=>{
  const e=goodEvidence();assert.equal(validateEvidence(e),true);
  e.tables[0].safeToRetire=true;assert.throws(()=>validateEvidence(e),/changed/);
  e.tables[0].safeToRetire=false;e.tables.pop();assert.throws(()=>validateEvidence(e),/changed/);
});
test('rejects missing evidence and missing source roots',()=>{
  assert.throws(()=>validateEvidence({tables:[]}),/Invalid/);
  assert.throws(()=>scanCheckout({name:'backend',root:'/not-a-real-checkout',expectedSha:'a'.repeat(40)}),/git rev-parse failed/);
});

test('scans script and dynamic source extensions rather than omitting native SQL clients',()=>{
  const r=repo({'scripts/db_client.py':'query = "SELECT * FROM smrithi_college"', 'ops/setup.sh':'echo SmrithiProgram'});
  try{const result=scanCheckout({name:'backend',root:r.root,expectedSha:r.sha});assert.equal(result.matchLines,2);assert.equal(result.runtimeCandidateLines,2);}
  finally{r.dispose();}
});
test('rejects tracked symlinks rather than disclosing or omitting outside content',()=>{
  const r=repo({'src/client.java':'class Safe {}'});
  try{symlinkSync('/etc/hosts',join(r.root,'refs.sql'));cmd(r.root,'add','refs.sql');cmd(r.root,'commit','-qm','add-symlink');const head=cmd(r.root,'rev-parse','HEAD');assert.throws(()=>scanCheckout({name:'backend',root:r.root,expectedSha:head}),/tracked symlink/);}
  finally{r.dispose();}
});
