#!/usr/bin/env node
// DEPRECATED compatibility entrypoint. Six-chat reports no longer exist.
// The canonical read-only status is scripts/tracker.mjs.
import { inspectCheckout } from './tracker.mjs';

const args = process.argv.slice(2);
if (args.includes('--lane')) {
  console.error('Six-chat lanes are retired. Use node scripts/tracker.mjs for DONE / NOT DONE.');
  process.exitCode = 2;
} else if (args.some(x => !['--json','--help','-h'].includes(x))) {
  console.error('Usage: node scripts/tracker.mjs [--json]');
  process.exitCode = 2;
} else if (args.includes('--help') || args.includes('-h')) {
  console.log('The six-chat dashboard is retired. Use node scripts/tracker.mjs [--json].');
} else {
  try {
    const report = inspectCheckout();
    if (args.includes('--json')) console.log(JSON.stringify(report,null,2));
    else {
      console.log('Single LMS vNext tracker (six-chat dashboard retired)');
      console.log('Phase: ' + report.activePhase);
      console.log('DONE: ' + report.counts.done + ' | NOT DONE: ' + report.counts.notDone);
      console.log('Original core: DONE ' + report.core.done + '/' + report.core.total);
      console.log('Use node scripts/tracker.mjs for canonical status.');
    }
    if (report.errors.length) process.exitCode = 2;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
