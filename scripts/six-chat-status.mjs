#!/usr/bin/env node
/**
 * Offline six-chat checkpoint dashboard.
 * Source: committed docs/coordination/lanes/chat-NN.json and docs/parity/*.md.
 * This does not fetch GitHub, run CI, or assert that authored tests passed.
 *
 * Usage: node scripts/six-chat-status.mjs [--lane 1..6] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const json = args.includes('--json');
const laneAt = args.indexOf('--lane');
const n = laneAt >= 0 ? Number(args[laneAt + 1]) : null;

if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write('Usage: node scripts/six-chat-status.mjs [--lane 1..6] [--json]\n');
  process.exit(0);
}
if (laneAt >= 0 && (!Number.isInteger(n) || n < 1 || n > 6)) {
  process.stderr.write('Invalid --lane: supply a number 1 through 6.\n');
  process.exit(2);
}
if (args.some((a, i) => a.startsWith('--') && a !== '--json' && a !== '--lane' && a !== '--help')) {
  process.stderr.write('Unsupported option.\n');
  process.exit(2);
}
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const laneRecords = [];
const issueIds = new Set();
const domainIds = new Set();
for (let i = 1; i <= 6; i += 1) {
  const name = 'docs/coordination/lanes/chat-' + String(i).padStart(2, '0') + '.json';
  const s = JSON.parse(read(name));
  if (s.schemaVersion !== 1 || s.chatNumber !== i || s.issueNumber !== 20 + i ||
      s.lane !== 'W' + String(i).padStart(2, '0') || s.assignment !== 'FIXED' ||
      !s.checkpoint || !s.domain || !s.api || !s.qualityGates || !s.nextAction) {
    throw Error('Invalid fixed lane contract: ' + name);
  }
  if (issueIds.has(s.issueNumber)) throw Error('Duplicate issue: ' + s.issueNumber);
  issueIds.add(s.issueNumber);
  for (const d of s.domain.ids) {
    if (domainIds.has(d)) throw Error('Overlapping DB ownership: ' + d);
    domainIds.add(d);
  }
  const fields = s.domain.historicalCandidateFields;
  const verified = s.domain.fieldSemanticsVerified;
  if (!Number.isInteger(fields) || fields < 0 ||
      !Number.isInteger(verified) || verified < 0 || verified > fields) {
    throw Error('Bad database verified count: ' + name);
  }
  laneRecords.push(s);
}
for (let i = 0; i <= 10; i += 1) {
  const d = 'DB' + String(i).padStart(2, '0');
  if (!domainIds.has(d)) throw Error('Unowned database domain: ' + d);
}
const choose = laneAt >= 0 ? laneRecords.filter((s) => s.chatNumber === n) : laneRecords;
const pageSpecs = [
  'learner.md', 'faculty.md', 'mentor.md', 'college-admin.md',
  'super-admin.md', 'tpo.md', 'hr.md', 'shared-public-ops.md'
];
const parity = {};
const total = { checked: 0, open: 0, partial: 0, total: 0 };
for (const filename of pageSpecs) {
  const source = read('docs/parity/' + filename);
  const matches = [...source.matchAll(/^\s*[-*]\s+\[([ xX~])\]\s/gm)];
  const c = { checked: 0, open: 0, partial: 0, total: matches.length };
  for (const m of matches) {
    if (m[1].toLowerCase() === 'x') c.checked += 1;
    else if (m[1] === '~') c.partial += 1;
    else c.open += 1;
  }
  for (const key of Object.keys(total)) total[key] += c[key];
  parity[filename.replace('.md', '')] = c;
}
const database = {
  historicalCandidateTables: laneRecords.reduce((s, r) => s + r.domain.historicalCandidateTables, 0),
  historicalCandidateFields: laneRecords.reduce((s, r) => s + r.domain.historicalCandidateFields, 0),
  formallyVerifiedFieldsRecorded: laneRecords.reduce((s, r) => s + r.domain.fieldSemanticsVerified, 0),
  note: 'Historical source candidates are not necessarily active tables/fields. Counts are last recorded lane checkpoint values, not live database introspection.'
};
const result = {
  scope: laneAt >= 0 ? 'CHAT_' + n : 'ALL_SIX_CHATS',
  source: 'Committed lane records and detailed parity Markdown in current working tree',
  liveGitHubQueried: false,
  testsExecutedByThisScript: false,
  lanes: choose,
  database,
  detailedPageChecks: { ...total, byAccount: parity, note: 'Page-spec checkmarks are not necessarily fresh oracle/browser verification.' }
};
if (json) {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} else {
  process.stdout.write('LMS vNext | Six-chat checkpoints (local committed snapshots; NOT live CI)\n\n');
  for (const l of choose) {
    process.stdout.write(
      'Chat ' + l.chatNumber + ' / ' + l.lane + ' / #' + l.issueNumber + ': ' +
      l.executionState + ' | ' + l.currentPhase + '\n' +
      '  DB candidates: ' + l.domain.historicalCandidateTables + ' tables / ' +
      l.domain.historicalCandidateFields + ' fields | formal field verification recorded: ' +
      l.domain.fieldSemanticsVerified + '\n' +
      '  API required/mapped/verified: ' +
      [l.api.requiredOperations, l.api.mappedOperations, l.api.verifiedOperations]
        .map((x) => x === null ? 'not measured' : String(x)).join(' / ') + '\n' +
      '  Checkpoint: ' + l.checkpoint.updatedOn + ' (' + l.checkpoint.checkpointKind + ')\n' +
      '  Blockers: ' + l.blockers.length + ' recorded | Next: ' + l.nextAction + '\n\n'
    );
  }
  process.stdout.write(
    'Across all lanes (recorded): ' + database.historicalCandidateTables + ' table candidates / ' +
    database.historicalCandidateFields + ' field candidates / ' +
    database.formallyVerifiedFieldsRecorded + ' formally verified fields.\n' +
    'Detailed parity spec: ' + total.checked + ' checked / ' + total.open + ' open / ' +
    total.partial + ' partial (' + total.total + ' total).\n' +
    'IMPORTANT: Refresh GitHub issues, main HEAD, CI and legacy SHA before reporting live status.\n'
  );
}
