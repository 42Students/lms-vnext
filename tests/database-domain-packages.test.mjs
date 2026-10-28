import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {DATABASE_DOMAIN_PACKAGES,inspectDomainPackages,inspectTracker} from '../scripts/tracker.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tracker=JSON.parse(fs.readFileSync(path.join(root,'docs/tracker.json'),'utf8'));

test('every one of 81 database tasks maps to exactly one package',()=>{
  const ids=tracker.tasks.filter(t=>t.phase==='DATABASE').map(t=>t.id);
  const assigned=DATABASE_DOMAIN_PACKAGES.flatMap(p=>p.taskIds);
  const groups=inspectDomainPackages(tracker);
  assert.equal(ids.length,81);
  assert.equal(assigned.length,81);
  assert.deepEqual([...ids].sort(),[...assigned].sort());
  assert.deepEqual(groups.unassigned,[]);
  assert.deepEqual(groups.duplicates,[]);
  assert.deepEqual(groups.unknown,[]);
  assert.equal(groups.readyForNextPhase,false);
  assert.equal(groups.packages.reduce((n,p)=>n+p.done,0),ids.filter(id=>tracker.tasks.find(t=>t.id===id).done).length);
  assert.deepEqual(inspectTracker(tracker).errors,[]);
});

test('unassigned database work cannot silently pass tracker structure check',()=>{
  const changed=structuredClone(tracker);
  changed.tasks.push({id:'DB-999',title:'test-only',phase:'DATABASE',done:false,dependsOn:[]});
  const report=inspectTracker(changed);
  assert(report.errors.some(e=>e.code==='UNASSIGNED_DATABASE_PACKAGE'));
  assert.equal(report.readyForNextPhase,false);
});
