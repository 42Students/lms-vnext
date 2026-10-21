import { useMemo } from "react";
import Link from "next/link";
import { Button, DatePicker, Dropdown, Space, Typography } from "antd";
import { ArrowRightOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
import { dj } from "@/components/tpo/dj";
import { DECISION, batchJourney } from "./batchRules";
import { StatusBadge } from "@/components/Common/PanelStates";

const plural = (n, one, many) => `${Number(n).toLocaleString()} ${Number(n) === 1 ? one : many}`;

/** A decision control for a batch or a class: Eligible, Ineligible… or back to Not decided / follow the batch. */
export function DecideMenu({ current, clearLabel, onPick, size, testid, disabled }) {
  const items = [
    { key: "ELIGIBLE", label: "Eligible" },
    { key: "INELIGIBLE", label: "Ineligible…", danger: true },
    { type: "divider" },
    { key: "CLEAR", label: clearLabel, disabled: !current },
  ];
  const d = current ? DECISION[current] : null;
  return (
    <Dropdown trigger={["click"]} disabled={disabled} menu={{ items, onClick: ({ key }) => onPick(key === "CLEAR" ? null : key) }}>
      <Button size={size} data-testid={testid}>
        {d ? <StatusBadge status={d.status} label={d.label} tone={d.tone} className="tpo-decision-badge" /> : "Decide"} <DownOutlined />
      </Button>
    </Dropdown>
  );
}

/**
 * The one thing to do next for this batch, with the controls to do it right there (it replaces the Registration tab):
 * decide -> invite with a deadline -> remind / move the deadline -> continue on Students.
 */
export function NextStep({ batch, batchId, deadline, setDeadline, busy, onInvite, onMoveDeadline, onRemind, flash = 0 }) {
  const eligible = Number(batch.eligible) || 0;
  const registered = Number(batch.registered) || 0;
  const students = Number(batch.students) || 0;
  const invited = Boolean(batch.invitedAt);
  const passed = batch.registrationDeadline && dj(batch.registrationDeadline).isBefore(dj());
  const left = Math.max(0, eligible - registered);
  const sameDeadline = (deadline ? deadline.format("YYYY-MM-DD") : null) === (batch.registrationDeadline ? dj(batch.registrationDeadline).format("YYYY-MM-DD") : null);
  // "Show me" from the sheet flashes the card and opens the date picker (flash counts up on each click).
  const picker = <DatePicker key={flash} autoFocus={flash > 0} defaultOpen={flash > 0} value={deadline} onChange={setDeadline} format="D MMM YYYY"
    disabledDate={(d) => d && d.isBefore(dj().startOf("day"))} aria-label="Registration deadline" />;
  const toStudents = registered > 0 && (
    <Link href={`/tpo/students?f_batch=${batchId}`} className="tpo-nextstep__continue" data-testid="batch.continue">
      {plural(registered, "student", "students")} registered: continue on Students <ArrowRightOutlined />
    </Link>
  );

  let tone = "todo"; let title; let body = null;
  if (batch.state === "FINISHED") {
    tone = "done"; title = "This batch is finished";
    body = <Typography.Text type="secondary">It is left out of counts and its students can&apos;t apply on their own. You can still add them to a drive.</Typography.Text>;
  } else if (students === 0) {
    tone = "done"; title = "No students yet"; body = <Typography.Text type="secondary">Add them to the batch&apos;s classes in Academic Setup.</Typography.Text>;
  } else if (eligible === 0) {
    title = "Decide who is in placements";
    body = <Typography.Text type="secondary">Below: the whole batch at once, class by class, or student by student in the sheet.</Typography.Text>;
  } else if (!invited) {
    // Inviting tells only the eligible students who have not chosen yet (BatchRegistrationService.invite).
    title = left === eligible ? `Invite ${plural(eligible, "eligible student", "eligible students")} to register`
      : `Invite the ${plural(left, "eligible student", "eligible students")} who haven't registered`;
    body = (
      <Space wrap>
        <Typography.Text type="secondary">Register by</Typography.Text>{picker}
        <Button type="primary" loading={busy} disabled={!deadline} onClick={onInvite} data-testid="batch-invite">Invite {left.toLocaleString()}</Button>
        {!deadline && <Typography.Text type="secondary">Pick the date first</Typography.Text>}
      </Space>
    );
  } else if (left > 0 && !passed) {
    title = `Registration is open${batch.registrationDeadline ? ` until ${dj(batch.registrationDeadline).format("D MMM YYYY")}` : ""} · ${plural(left, "student hasn't", "students haven't")} registered`;
    body = (
      <Space wrap>
        <Button type="primary" onClick={onRemind} data-testid="batch-remind">Remind the {left.toLocaleString()}</Button>
        <Typography.Text type="secondary">or move the deadline</Typography.Text>{picker}
        <Button loading={busy} disabled={sameDeadline} onClick={onMoveDeadline}>Move</Button>
      </Space>
    );
  } else if (left > 0) {
    tone = "warn"; title = `Registration closed on ${dj(batch.registrationDeadline).format("D MMM YYYY")} · ${plural(left, "student", "students")} didn't register`;
    body = (
      <Space wrap>
        <Typography.Text type="secondary">Move the deadline to reopen it</Typography.Text>{picker}
        <Button type="primary" loading={busy} disabled={sameDeadline || !deadline} onClick={onInvite}>Reopen and tell them</Button>
      </Space>
    );
  } else {
    tone = "done"; title = `All ${plural(eligible, "eligible student has", "eligible students have")} registered`;
  }
  return (
    <section className={`tpo-nextstep is-${tone}${flash ? " is-flash" : ""}`} key={flash} aria-label="Next step" data-testid="batch.next-step" id="batch-next-step">
      <span className="tpo-nextstep__eyebrow">Next step</span>
      <strong className="tpo-nextstep__title">{title}</strong>
      {body}
      {toStudents}
    </section>
  );
}

/** Who is in placements, at all three levels in one place: the whole batch, each class, and students decided on their own. */
export function WhoIsIn({ batch, batchId, classes, rows, decideScope, pickedClass, onClass, onOwn, ownPicked, disabled }) {
  const own = rows.filter((r) => r.ownDecision).length;
  // The useful number: own decisions that differ from what their class (or else the batch) says.
  const classDecision = Object.fromEntries((classes || []).map((c) => [String(c.classId), c.decision]));
  const differ = rows.filter((r) => r.ownDecision && r.ownDecision !== (classDecision[String(r.classId)] || batch.decision)).length;
  return (
    <section className="tpo-whoisin" aria-label="Who is in placements" data-testid="batch.who-is-in">
      <div className="tpo-whoisin__row is-batch">
        <span className="tpo-whoisin__name">Whole batch</span>
        <span className="tpo-whoisin__nums">{plural(batch.students || 0, "student", "students")} · <strong className="is-eligible">{Number(batch.eligible) || 0} eligible</strong>{Number(batch.notDecided) > 0 && <> · {Number(batch.notDecided)} not decided</>}</span>
        <DecideMenu current={batch.decision} clearLabel="Not decided" onPick={decideScope("BATCH", Number(batchId), batch.name)} testid="batch-decide" disabled={disabled} />
      </div>
      {classes.map((c) => {
        const on = pickedClass === String(c.classId);
        return (
          <div className="tpo-whoisin__row" key={c.classId} data-testid={`class-row-${c.classId}`}>
            <button type="button" className={`tpo-whoisin__name is-link${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => onClass(String(c.classId))}
              title={on ? "Show every class again" : `Show only ${c.name} below`}>{c.name}</button>
            <span className="tpo-whoisin__nums">
              {plural(c.students, "student", "students")} · <span className="is-eligible">{c.eligible} eligible</span>
              {Number(c.ineligible) > 0 && <> · <span className="is-ineligible">{c.ineligible} ineligible</span></>}{Number(c.notDecided) > 0 && <> · {c.notDecided} not decided</>}
              {!c.decision && <Typography.Text type="secondary"> · follows the batch</Typography.Text>}
            </span>
            <DecideMenu current={c.decision} clearLabel="Follow the batch" size="small" onPick={decideScope("CLASS", c.classId, `class ${c.name}`)} testid={`class-decide-${c.classId}`} disabled={disabled} />
          </div>
        );
      })}
      {own > 0 && (
        <button type="button" className={`tpo-whoisin__own${ownPicked ? " is-on" : ""}`} aria-pressed={ownPicked} onClick={onOwn} data-testid="batch.own">
          {plural(own, "student is", "students are")} decided individually{differ === 0 ? ", all the same as their class or batch" : `, ${differ} differ from their class or batch`} <RightOutlined />
        </button>
      )}
    </section>
  );
}

/** The batch's road into placements: Students -> Eligible -> Invited -> Registered, with the gaps between. Same look as Students. */
export function BatchStrip({ rows, invited, picked, onPick, narrowedBy = 0 }) {
  const strip = useMemo(() => {
    const J = batchJourney(invited);
    const n = (j) => rows.filter((r) => j.test(r)).length;
    return {
      total: rows.length,
      steps: J.filter((j) => j.step).map((j) => ({ ...j, n: n(j) })),
      gaps: Object.fromEntries(J.filter((j) => j.after).map((j) => [j.after, { ...j, n: n(j) }])),
      extras: J.filter((j) => j.extra).map((j) => ({ ...j, n: n(j) })),
    };
  }, [rows, invited]);
  const pct = (n) => (strip.total ? Math.round((n * 100) / strip.total) : 0);
  return (
    <div className="tpo-journey-wrap">
      <div className="tpo-journey__caption" data-testid="batch.journey-caption">
        Into placements: the {plural(strip.total, "student", "students")} of this batch
        {narrowedBy > 0 && <span className="tpo-journey__narrowed"> · the list below is narrowed by {plural(narrowedBy, "more filter", "more filters")}</span>}
      </div>
      <div className="tpo-journey" role="group" aria-label="Into placements" data-testid="batch.journey">
        {strip.steps.map((s, i) => {
          const gap = strip.gaps[s.key];
          const on = s.key !== "B_ALL" && picked === s.key;
          return (
            <div key={s.key} className="tpo-journey__part">
              <button type="button" className={`tpo-journey__step${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => onPick(s.key)} data-testid={`bjourney.${s.key}`}
                title={s.key === "B_ALL" ? "Show everyone (clears what is picked here)" : `Show the ${s.n} ${s.label.toLowerCase()}`}>
                <span className="tpo-journey__n">{s.n.toLocaleString()}</span>
                <span className="tpo-journey__label">{s.label}</span>
                {s.key !== "B_ALL" && <span className="tpo-journey__pct">{pct(s.n)}% of {strip.total.toLocaleString()}</span>}
              </button>
              {i < strip.steps.length - 1 && (
                <div className="tpo-journey__between">
                  <RightOutlined className="tpo-journey__arrow" aria-hidden />
                  {gap && gap.n > 0 && (
                    <button type="button" className={`tpo-journey__gap${picked === gap.key ? " is-on" : ""}`} aria-pressed={picked === gap.key}
                      onClick={() => onPick(gap.key)} data-testid={`bjourney.${gap.key}`} title={`Show these ${gap.n}`}>
                      {gap.n.toLocaleString()} {gap.label.toLowerCase()}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {strip.extras.some((e) => e.n > 0 || picked === e.key) && (
        <div className="tpo-journey__extras">
          {strip.extras.filter((e) => e.n > 0 || picked === e.key).map((e) => (
            <button type="button" key={e.key} className={`tpo-journey__extra${picked === e.key ? " is-on" : ""}`} aria-pressed={picked === e.key}
              onClick={() => onPick(e.key)} data-testid={`bjourney.${e.key}`}>
              {e.label} · <strong>{e.n.toLocaleString()}</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
