// Lane autopilot: paste into the browser console of the ONE ChatGPT tab that hosts the lane chats.
// It cycles through the lane conversations (client-side navigation, no reload), and when a lane is idle
// (no visible Stop button, last item is its own reply) it sends that lane's next-round message.
// Control: window.__auto.stop(), window.__auto.start(), window.__auto.done['chat-7']=true (skip a finished lane),
// window.__auto.status() for a one-line-per-lane report, window.__auto.log for the action log.
(() => {
  const LANES = {
    'chat-2':  { id: '6ad2d1b3-47cc-83ee-8005-d433b9d8f4e7', queue: 'docs/orchestrator/queues/gap-closure-chat-2.md', round: 5 },
    'chat-3':  { id: '6ad2e0b2-ac5c-83ec-8a31-d446f638a748', queue: 'docs/orchestrator/queues/gap-closure-chat-3.md', round: 4 },
    'chat-4':  { id: '6ad2d054-d738-83ec-8652-92050852c402', queue: 'docs/orchestrator/queues/gap-closure-chat-4.md', round: 4 },
    'chat-5':  { id: '6ad2eb3a-d7a4-83ec-9b0a-71cc252bd128', queue: 'docs/orchestrator/queues/gap-closure-chat-5.md', round: 5 },
    'chat-6':  { id: '6ad337f0-21c0-83ee-88ac-41f4e781c4f6', queue: 'docs/orchestrator/queues/gap-closure-chat-6.md', round: 4 },
    'chat-7':  { id: '6ad2ee6a-6028-83ee-ac7c-d70b03f7a09b', queue: 'docs/orchestrator/queues/gap-closure-chat-7.md', round: 6 },
    'chat-9':  { id: '6ad2d134-91b4-83ec-92a3-07268d226011', queue: 'docs/orchestrator/queues/gap-closure-chat-9.md', round: 4 },
    'chat-11': { id: '6ad2cf3e-6e78-83e8-a857-d1a33d2ed9cf', queue: 'docs/orchestrator/queues/gap-closure-chat-11.md', round: 4 },
    'chat-12': { id: '6ad3364e-f0a0-83e8-8e1b-50775fb372e1', queue: 'docs/orchestrator/queues/gap-closure-chat-12.md', round: 4 },
    'chat-13': { id: '6ad33676-dfe4-83ec-a02a-19b154c846aa', queue: 'docs/orchestrator/queues/gap-closure-chat-13.md', round: 4 },
    'chat-14': { id: '6ad33cc9-fb70-83e8-a48c-6feae566db3d', queue: 'docs/orchestrator/queues/graceful-chat-14.md', round: 4 },
    'chat-15': { id: '6ad33d00-5914-83ec-b873-4a767a648ca0', queue: 'docs/orchestrator/queues/graceful-chat-15.md', round: 4 },
    'chat-16': { id: '6ad33f32-1d08-83ee-9b52-44d1046a12a9', queue: 'docs/orchestrator/queues/alerting-chat-16.md', round: 3 },
  };
  const COOLDOWN_MS = 4 * 60 * 1000;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && e.offsetParent !== null; };
  const isGen = () => [...document.querySelectorAll('button[aria-label*="Stop"]')].filter(vis).length > 0;
  const mainText = () => { const m = [...document.querySelectorAll('main')].filter(vis); return (m[m.length - 1] || document.body).innerText; };
  const composer = () => { const els = [...document.querySelectorAll('[contenteditable="true"], textarea')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 50 && r.height > 10 && e.offsetParent !== null; }); return els[els.length - 1]; };
  const sendBtn = () => [...document.querySelectorAll('button')].filter(vis).find((b) => /^send/i.test(b.getAttribute('aria-label') || '') || b.getAttribute('data-testid') === 'send-button');
  const go = async (id) => { history.pushState({}, '', '/c/' + id); window.dispatchEvent(new PopStateEvent('popstate', { state: {} })); await sleep(5000); };
  const message = (name, lane) => `Continue as builder ${name}, round ${lane.round}. First merge origin/main into chatgpt/${name}-b (all lanes are merged into main regularly; chat-14's helpers src/lib/friendly-error.ts and src/lib/api-fetch.ts are on main: adopt them on every page you touch). Re-read docs/orchestrator/briefs/gap-closure-lane.md (Throughput section, Orchestrator notes at the bottom, Friendly errors and Graceful operation sections) and continue ${lane.queue} from where you stopped. Aim for 30+ gaps or checklist items this round, batching verification of already-fixed and wording gaps into few commits. Double-check braces, parentheses and JSX closing tags in everything you write (cloud CI found syntax errors in merged files). Tag every commit [${name}], cite gap IDs, name tests with the gap ID, push after each group, update the page verification files. Tests are not run by you. Start now.`;
  const A = window.__auto = window.__auto || { running: false, done: {}, lastSent: {}, log: [], cycles: 0, state: {} };
  A.lanes = LANES;
  const note = (s) => { A.log.push(new Date().toTimeString().slice(0, 8) + ' ' + s); if (A.log.length > 300) A.log.shift(); };
  async function inject(text) {
    const c = composer(); if (!c) return false;
    c.focus(); document.execCommand('selectAll', false); document.execCommand('insertText', false, text);
    await sleep(700);
    const b = sendBtn(); if (!b) return false;
    b.click(); return true;
  }
  async function visit(name) {
    const lane = LANES[name];
    await go(lane.id);
    if (!location.href.includes(lane.id.slice(0, 8))) { A.state[name] = 'not-reachable'; note(name + ': not reachable'); return; }
    if (isGen()) { A.state[name] = 'generating'; return; }
    const txt = mainText();
    const hasRetry = [...document.querySelectorAll('button')].filter(vis).some((b) => /^retry$/i.test(b.innerText.trim()));
    const since = Date.now() - (A.lastSent[name] || 0);
    if (since < COOLDOWN_MS) { A.state[name] = 'starting'; return; }
    const c = composer();
    const draft = c ? (c.innerText || c.value || '').trim().length : 0;
    if (hasRetry) {
      const rb = [...document.querySelectorAll('button')].filter(vis).find((b) => /^retry$/i.test(b.innerText.trim()));
      rb && rb.click(); await sleep(6000);
      if (isGen()) { A.state[name] = 'generating'; A.lastSent[name] = Date.now(); note(name + ': retry clicked, generating'); return; }
    }
    const text = message(name, lane);
    if (draft > 20) { const b = sendBtn(); if (b) { b.click(); await sleep(7000); } }
    else { const ok = await inject(text); if (!ok) { A.state[name] = 'send-failed'; note(name + ': send failed'); return; } await sleep(7000); }
    if (isGen()) { A.state[name] = 'generating'; A.lastSent[name] = Date.now(); lane.round++; note(name + ': sent round ' + (lane.round - 1)); }
    else { A.state[name] = 'sent-not-confirmed'; A.lastSent[name] = Date.now() - COOLDOWN_MS + 60000; note(name + ': sent, not generating yet (will recheck)'); }
  }
  async function loop() {
    while (A.running) {
      for (const name of Object.keys(LANES)) {
        if (!A.running) break;
        if (A.done[name]) { A.state[name] = 'done'; continue; }
        try { await visit(name); } catch (e) { note(name + ': error ' + String(e).slice(0, 80)); }
      }
      A.cycles++;
      await sleep(20000);
    }
  }
  A.visit = visit;
  A.start = () => { if (A.running) return 'already running'; A.running = true; loop(); return 'started'; };
  A.stop = () => { A.running = false; return 'stopping after current lane'; };
  A.status = () => Object.entries(A.state).map(([k, v]) => k + ':' + v).join(' | ') + ' | cycles ' + A.cycles;
  return 'autopilot loaded';
})();
