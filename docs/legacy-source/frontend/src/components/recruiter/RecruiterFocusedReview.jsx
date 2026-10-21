import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Progress, Rate, Tag, Typography, message } from "antd";
import { submitRoundResults } from "@/api/Services/RecruiterService";
import {
  KEY_TO_OUTCOME, OUTCOMES, applicantName, draftKey, factsOf, onlyKnownApplicants, readDraft, reviewQueue, safeHref, tally, toRows, writeDraft,
} from "@/components/recruiter/recruiterReviewUtils";

const errorText = (e, fallback) => e?.response?.data?.error || e?.response?.data?.message || fallback;
const FOCUSABLE = 'button:not([disabled]), a[href], textarea, input, [tabindex]:not([tabindex="-1"])';

/**
 * Review applicants one at a time: the shared details on the left, the decision on the right, keys for the four
 * outcomes, undo for the last one. Decisions are a draft kept in this browser, for this recruiter, until they send them;
 * sending stages them as round results, which the placement cell applies. Nothing a student sees changes from here.
 * `owner` is the recruiter's id: two people on one computer never see each other's draft.
 */
export default function RecruiterFocusedReview({ applicants, collegeId, jobId, round, owner, notes = {}, notesAvailable = true, onNote, onClose, onSent }) {
  const key = draftKey(owner, collegeId, jobId, round.id);
  // A draft can hold people who are no longer on the drive (withdrawn, list reshared); sending them would fail the whole batch.
  const [decisions, setDecisions] = useState(() => onlyKnownApplicants(readDraft(key), applicants));
  const [queue] = useState(() => reviewQueue(applicants, onlyKnownApplicants(readDraft(key), applicants)));
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(false);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const dialogRef = useRef(null);
  const noteTimer = useRef(null);
  const pendingNote = useRef(null); // { id, rating, note } typed but not yet saved
  const flushRef = useRef(() => {}); // always the latest flushNote, for callbacks defined before it
  const [draftNote, setDraftNote] = useState({});

  const current = queue[index];
  // The recruiter's private rating and note on whoever is on screen: what they typed this session wins over what was saved.
  const mine = current ? { rating: notes[current.applicantId]?.rating ?? null, note: notes[current.applicantId]?.note ?? "", ...(draftNote[current.applicantId] || {}) } : { rating: null, note: "" };
  const counts = useMemo(() => tally(decisions), [decisions]);
  const decidedCount = Object.keys(decisions).length;

  // Take focus on open and give it back on close, so keyboard users land where they were.
  useEffect(() => {
    const before = document.activeElement;
    dialogRef.current?.focus();
    return () => { if (before && typeof before.focus === "function") before.focus(); };
  }, []);

  const persist = useCallback((next) => { setDecisions(next); writeDraft(key, next); }, [key]);

  const advance = useCallback((from, next) => {
    const after = queue.findIndex((a, i) => i > from && !next[a.applicantId]);
    if (after >= 0) setIndex(after);
    else if (from + 1 < queue.length) setIndex(from + 1);
    else setSummary(true);
  }, [queue]);

  const decide = useCallback((outcome) => {
    if (!current || !OUTCOMES[outcome]) return;
    flushRef.current(); // a note typed for this person is saved as soon as they are decided
    const next = { ...decisions, [current.applicantId]: outcome };
    setHistory((h) => [...h.slice(-49), { id: current.applicantId, previous: decisions[current.applicantId], index }]);
    persist(next);
    advance(index, next);
  }, [advance, current, decisions, index, persist]);

  const undo = useCallback(() => {
    const last = history[history.length - 1];
    if (!last) return;
    const next = { ...decisions };
    if (last.previous) next[last.id] = last.previous; else delete next[last.id];
    persist(next);
    setSummary(false);
    setIndex(last.index);
    setHistory((h) => h.slice(0, -1));
  }, [decisions, history, persist]);

  // Private rating and note: saved shortly after the last change, and always saved before the person on screen changes or the review closes.
  const flushNote = useCallback(() => {
    clearTimeout(noteTimer.current);
    const pending = pendingNote.current;
    pendingNote.current = null;
    if (!pending || !onNote) return;
    Promise.resolve(onNote(pending.id, pending.rating, pending.note)).catch(() => message.error("Could not save your note. Change it again to retry."));
  }, [onNote]);
  flushRef.current = flushNote;
  useEffect(() => () => flushRef.current(), []);

  const changeNote = (patch) => {
    if (!current || !notesAvailable) return;
    const id = current.applicantId;
    if (pendingNote.current && pendingNote.current.id !== id) flushNote();
    const next = { ...mine, ...patch };
    setDraftNote((d) => ({ ...d, [id]: next }));
    pendingNote.current = { id, rating: next.rating, note: next.note };
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(flushNote, 700);
  };

  const move = useCallback((delta) => { flushRef.current(); setSummary(false); setIndex((i) => Math.min(Math.max(i + delta, 0), queue.length - 1)); }, [queue.length]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (["input", "textarea", "select"].includes(tag) || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (e.key === "Escape") { onClose(); return; }
      if (summary) { if (k === "z") undo(); return; }
      if (KEY_TO_OUTCOME[k]) { e.preventDefault(); decide(KEY_TO_OUTCOME[k]); }
      else if (k === "z") { e.preventDefault(); undo(); }
      else if (/^[1-5]$/.test(e.key)) { e.preventDefault(); changeNote({ rating: mine.rating === Number(e.key) ? null : Number(e.key) }); }
      else if (k === "n" || e.key === "ArrowRight") { e.preventDefault(); move(1); }
      else if (k === "p" || e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // changeNote reads the latest `mine`, so the listener is rebuilt when it changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decide, move, onClose, summary, undo, mine.rating, mine.note, current]);

  // Keep Tab inside the review: it covers the page, so focus must not wander to controls hidden behind it.
  const trapTab = (e) => {
    if (e.key !== "Tab") return;
    const items = Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE) || []);
    if (items.length === 0) { e.preventDefault(); return; }
    const first = items[0]; const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const send = async () => {
    if (sendingRef.current) return;
    flushNote();
    const rows = toRows(onlyKnownApplicants(decisions, applicants));
    if (!rows.length) return;
    sendingRef.current = true;
    setSending(true);
    try {
      const r = await submitRoundResults(collegeId, jobId, round.id, rows);
      writeDraft(key, {});
      message.success(r?.data?.applied ? "Applied" : "Sent to the placement cell to verify");
      onSent?.();
      onClose();
    } catch (e) {
      message.error(errorText(e, "Could not send the results. Your decisions are saved here; try again."));
    }
    sendingRef.current = false;
    setSending(false);
  };

  const pct = queue.length ? Math.round((decidedCount / queue.length) * 100) : 0;

  return (
    <div className="recruiter-review" role="dialog" aria-modal="true" aria-label="Review applicants" tabIndex={-1} ref={dialogRef} onKeyDown={trapTab} data-testid="recruiter.review">
      <div className="recruiter-review__top">
        <Button type="text" onClick={onClose} data-testid="recruiter.review.exit">Close</Button>
        <Typography.Text strong>{round.name}</Typography.Text>
        <Typography.Text type="secondary" className="recruiter-review__count">{summary ? "Done" : `${Math.min(index + 1, queue.length)} of ${queue.length}`}</Typography.Text>
        <Progress className="recruiter-review__bar" percent={pct} showInfo={false} size="small" />
        <Button size="small" disabled={history.length === 0} onClick={undo} data-testid="recruiter.review.undo">Undo</Button>
      </div>

      {queue.length === 0 ? (
        <div className="recruiter-review__empty" data-testid="recruiter.review.nobody">
          <Typography.Title level={4}>Nobody to review</Typography.Title>
          <Typography.Paragraph type="secondary">Everyone shared with you is already out of the process.</Typography.Paragraph>
          <Button type="primary" onClick={onClose}>Back to the drive</Button>
        </div>
      ) : summary ? (
        <div className="recruiter-review__summary" data-testid="recruiter.review.summary">
          <Typography.Title level={3}>{decidedCount} reviewed</Typography.Title>
          <Typography.Paragraph type="secondary">Sending stages these as results for {round.name}. The placement cell applies them, and no student is told until they do.</Typography.Paragraph>
          <div className="recruiter-review__tally">
            {Object.entries(OUTCOMES).map(([k, o]) => <div key={k}><strong>{counts[k]}</strong><span>{o.label}</span></div>)}
          </div>
          <div className="recruiter-review__summary-actions">
            <Button onClick={() => { setSummary(false); setIndex(0); }}>Keep reviewing</Button>
            <Button onClick={onClose}>Save and close</Button>
            <Button type="primary" loading={sending} disabled={sending || decidedCount === 0} onClick={send} data-testid="recruiter.review.send">Send {decidedCount} to the placement cell</Button>
          </div>
        </div>
      ) : (
        <div className="recruiter-review__body">
          <section className="recruiter-review__card" aria-live="polite" data-testid="recruiter.review.card">
            <Typography.Title level={3} style={{ marginTop: 0 }}>{applicantName(current)}</Typography.Title>
            {decisions[current.applicantId] && <Tag color={OUTCOMES[decisions[current.applicantId]].color}>Your decision: {OUTCOMES[decisions[current.applicantId]].label}</Tag>}
            <dl className="recruiter-review__facts">
              {factsOf(current).map((f) => <div key={f.key}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
            </dl>
            <div className="recruiter-review__links">
              {safeHref(current.resume) && <a href={safeHref(current.resume)} target="_blank" rel="noopener noreferrer">Open resume</a>}
              {safeHref(current.github) && <a href={safeHref(current.github)} target="_blank" rel="noopener noreferrer">GitHub</a>}
              {safeHref(current.portfolio) && <a href={safeHref(current.portfolio)} target="_blank" rel="noopener noreferrer">Portfolio</a>}
            </div>
            <Typography.Text type="secondary" className="recruiter-review__shared-note">You see the details the placement cell chose to share.</Typography.Text>
          </section>

          <section className="recruiter-review__decide" aria-label="Decision">
            {Object.entries(OUTCOMES).map(([k, o]) => (
              <Button key={k} size="large" block className={`recruiter-review__btn recruiter-review__btn--${k.toLowerCase()}`} onClick={() => decide(k)} data-testid={`recruiter.review.${k.toLowerCase()}`}>
                <span>{o.label}</span>
              </Button>
            ))}
            <Typography.Text type="secondary" className="recruiter-review__waitlist-note">Waitlist keeps a student in the running as a backup. It is not the same as deciding later: use Skip for that.</Typography.Text>
            <div className="recruiter-review__nav">
              <Button onClick={() => move(-1)} disabled={index === 0}>Previous</Button>
              <Button onClick={() => move(1)} disabled={index >= queue.length - 1}>Skip</Button>
            </div>
            <div className="recruiter-review__note" data-testid="recruiter.review.note">
              <Typography.Text strong>Your private rating</Typography.Text>
              {!notesAvailable && <Typography.Text type="warning" style={{ display: "block" }}>Saved private notes could not be loaded. Retry the drive before editing them.</Typography.Text>}
              <Rate disabled={!notesAvailable} value={mine.rating || 0} onChange={(v) => changeNote({ rating: v || null })} data-testid="recruiter.review.rating" />
              <Input.TextArea disabled={!notesAvailable} rows={3} maxLength={1000} placeholder={notesAvailable ? "Private note (only you can see it)" : "Private notes unavailable"} value={mine.note} onChange={(e) => changeNote({ note: e.target.value })} onBlur={flushNote} aria-label="Private note" />
            </div>
            <Typography.Text type="secondary">Your decisions are saved on this device until you send them. Every one can be undone. Ratings and notes are private to you.</Typography.Text>
            {decidedCount > 0 && <Button type="primary" ghost onClick={() => setSummary(true)} data-testid="recruiter.review.finish">Finish and send ({decidedCount})</Button>}
          </section>
        </div>
      )}
    </div>
  );
}
