import { useMemo } from "react";
import { Select, TreeSelect, Typography } from "antd";
import { RightOutlined } from "@ant-design/icons";
import { batchLabel, batchesOf, classKey, classesOf, JOURNEY } from "./studentGridRules";

const uniq = (a) => [...new Set(a)];
const plural = (n, one, many) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
const batchOf = (r) => (r.batchId == null ? "none" : String(r.batchId));

/**
 * The top of the Students page (docs/tpo-ux/STUDENTS-ACTIONS-PLAN-2026-10-05.md §A, STUDENTS-UX-AUDIT-2026-10-05.md): who you
 * are looking at (Batch by program, Program, Department, Class), then the journey of those students. A step, a gap or a link is picked like a
 * filter: one click filters the list, a second click on the same thing clears it. Only what was picked is highlighted.
 *
 * Props: rows (the working set), all (every row, for the batch list), filters, setFilters, picked (the strip key now in use, or
 *        null), onPick(key) (pick or clear a step / gap / link), narrowedBy (how many other filters narrow the list below).
 */
export default function StudentsTop({ rows, all, filters, setFilters, picked, onPick, narrowedBy = 0 }) {
  const batchPick = useMemo(() => filters.batch || [], [filters.batch]);
  const depts = useMemo(() => filters.branch || [], [filters.branch]);
  const programs = useMemo(() => filters.program || [], [filters.program]);
  const classPick = useMemo(() => filters.class || [], [filters.class]);
  const programOf = (r) => r.programName || "Not set";
  const set = (key, value) => {
    const next = { ...filters };
    if (value && value.length) next[key] = value; else delete next[key];
    setFilters(next);
  };

  // Batch, grouped by program; finished batches last, marked. The picked batch shows as "Program · Batch" (no count).
  const batches = useMemo(() => batchesOf(all), [all]);
  // With programs picked, the Batch list offers only their batches.
  const treeBatches = useMemo(() => (programs.length ? batches.filter((b) => programs.includes(b.program || "Not set")) : batches), [batches, programs]);
  const tree = useMemo(() => {
    const byProgram = new Map();
    treeBatches.forEach((b) => byProgram.set(b.program || "No program", [...(byProgram.get(b.program || "No program") || []), b]));
    return [...byProgram.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([program, list]) => ({
      title: program, label: program, value: `program:${program}`, key: `program:${program}`,
      children: list.map((b) => ({
        value: b.key, key: b.key, label: batchLabel(b),
        title: <span>{b.name}{b.finished ? " (finished)" : ""} <Typography.Text type="secondary">· {b.count}</Typography.Text></span>,
      })),
    }));
  }, [treeBatches]);

  const inBatches = useMemo(() => (batchPick.length ? all.filter((r) => batchPick.includes(batchOf(r))) : rows), [all, rows, batchPick]);
  // Programs among the picked batches (or everyone), with counts, like Department.
  const programOptions = useMemo(() => {
    const counts = new Map();
    inBatches.forEach((r) => { const pr = programOf(r); counts.set(pr, (counts.get(pr) || 0) + 1); });
    return uniq([...counts.keys(), ...programs]).sort().map((pr) => ({ value: pr, label: pr, count: counts.get(pr) || 0 }));
  }, [inBatches, programs]); // eslint-disable-line react-hooks/exhaustive-deps
  const inPrograms = useMemo(() => (programs.length ? inBatches.filter((r) => programs.includes(programOf(r))) : inBatches), [inBatches, programs]); // eslint-disable-line react-hooks/exhaustive-deps
  const deptOptions = useMemo(() => {
    const counts = new Map();
    inPrograms.forEach((r) => { const d = r.branch || "Not set"; counts.set(d, (counts.get(d) || 0) + 1); });
    return uniq([...counts.keys(), ...depts]).sort().map((d) => ({ value: d, label: d, count: counts.get(d) || 0 }));
  }, [inPrograms, depts]);
  // Classes of the students picked so far (batch, program, department), with counts; a picked class stays listed.
  const inDepts = useMemo(() => (depts.length ? inPrograms.filter((r) => depts.includes(r.branch || "Not set")) : inPrograms), [inPrograms, depts]);
  const classOptions = useMemo(() => {
    const here = classesOf(inDepts);
    const labels = new Map(classesOf(all).map((c) => [c.value, c.label]));
    const missing = classPick.filter((k) => !here.some((c) => c.value === k)).map((k) => ({ value: k, label: labels.get(k) || "Class", count: 0 }));
    return [...here, ...missing];
  }, [inDepts, all, classPick]);

  // The journey of the students picked above: it follows Batch, Program and Department only, and says so.
  const strip = useMemo(() => {
    const scoped = rows.filter((r) => (!batchPick.length || batchPick.includes(batchOf(r))) && (!programs.length || programs.includes(programOf(r)))
      && (!depts.length || depts.includes(r.branch || "Not set")) && (!classPick.length || classPick.includes(classKey(r))));
    const n = (j) => scoped.filter((r) => j.test(r)).length;
    return {
      total: scoped.length,
      steps: JOURNEY.filter((j) => j.step).map((j) => ({ ...j, n: n(j) })),
      gaps: Object.fromEntries(JOURNEY.filter((j) => j.after).map((j) => [j.after, { ...j, n: n(j) }])),
      extras: [
        ...JOURNEY.filter((j) => j.extra).map((j) => ({ key: j.key, label: j.label, n: n(j) })),
        { key: "NO_RESUME", label: "No resume", n: scoped.filter((r) => !r.hasResume).length },
        { key: "OFFER_WAITING", label: "Offer waiting on their answer", n: scoped.filter((r) => Number(r.offersWaiting) > 0).length },
        { key: "DEBARRED", label: "Debarred", n: scoped.filter((r) => r.debarred).length },
      ],
    };
  }, [rows, batchPick, programs, depts, classPick]); // eslint-disable-line react-hooks/exhaustive-deps
  const scopeText = `${batchPick.length ? batchPick.map((k) => batches.find((b) => b.key === k)).filter(Boolean).map(batchLabel).join(", ") : "all active batches"}`
    + `${programs.length ? ` · ${programs.join(", ")}` : ""}`
    + ` · ${depts.length ? depts.join(", ") : "all departments"}`
    + `${classPick.length ? ` · ${classPick.map((k) => classOptions.find((c) => c.value === k)?.label || "a class").join(", ")}` : ""}`;
  const pct = (n) => (strip.total ? Math.round((n * 100) / strip.total) : 0);

  return (
    <div className="tpo-students__top" data-testid="students.top">
      <div className="tpo-students__selectors">
        <TreeSelect
          treeData={tree} value={batchPick} treeCheckable showCheckedStrategy={TreeSelect.SHOW_CHILD} allowClear maxTagCount="responsive"
          treeNodeLabelProp="label" placeholder="All active batches" style={{ width: 360, maxWidth: "100%" }} treeDefaultExpandAll popupMatchSelectWidth={380}
          aria-label="Batch" onChange={(v) => set("batch", (v || []).filter((x) => !String(x).startsWith("program:")))} data-testid="students.batch-select"
          treeNodeFilterProp="label" showSearch
        />
        <Select mode="multiple" allowClear maxTagCount="responsive" placeholder="All programs" style={{ width: 220, maxWidth: "100%" }} aria-label="Program"
          value={programs} onChange={(v) => set("program", v)} data-testid="students.program-select" optionLabelProp="name" optionFilterProp="name"
          options={programOptions.map((pr) => ({ value: pr.value, name: pr.label, label: <span>{pr.label} <Typography.Text type="secondary">· {pr.count}</Typography.Text></span> }))} />
        <Select mode="multiple" allowClear maxTagCount="responsive" placeholder="All departments" style={{ width: 240, maxWidth: "100%" }} aria-label="Department"
          value={depts} onChange={(v) => set("branch", v)} data-testid="students.dept-select" optionLabelProp="name" optionFilterProp="name"
          options={deptOptions.map((d) => ({ value: d.value, name: d.label, label: <span>{d.label} <Typography.Text type="secondary">· {d.count}</Typography.Text></span> }))} />
        <Select mode="multiple" allowClear maxTagCount="responsive" placeholder="All classes" style={{ width: 220, maxWidth: "100%" }} aria-label="Class"
          value={classPick} onChange={(v) => set("class", v)} data-testid="students.class-select" optionLabelProp="name" optionFilterProp="name"
          options={classOptions.map((c) => ({ value: c.value, name: c.label, label: <span>{c.label} <Typography.Text type="secondary">· {c.count}</Typography.Text></span> }))} />
      </div>

      <div className="tpo-journey-wrap">
        <div className="tpo-journey__caption" data-testid="students.journey-caption">
          Journey of the {plural(strip.total, "student", "students")} in {scopeText}
          {narrowedBy > 0 && <span className="tpo-journey__narrowed"> · the list below is narrowed by {plural(narrowedBy, "more filter", "more filters")}</span>}
        </div>
        <div className="tpo-journey" role="group" aria-label="Journey" data-testid="students.journey">
          {strip.steps.map((s, i) => {
            const gap = strip.gaps[s.key];
            const on = s.key !== "ALL" && picked === s.key;
            return (
              <div key={s.key} className="tpo-journey__part">
                <button type="button" className={`tpo-journey__step${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => onPick(s.key)} data-testid={`journey.${s.key}`}
                  title={s.key === "ALL" ? "Show everyone (clears what is picked here)" : `Show the ${s.n} who reached ${s.label}`}>
                  <span className="tpo-journey__n">{s.n.toLocaleString()}</span>
                  <span className="tpo-journey__label">{s.label}</span>
                  {s.key !== "ALL" && <span className="tpo-journey__pct">{pct(s.n)}% of {strip.total.toLocaleString()}</span>}
                </button>
                {i < strip.steps.length - 1 && (
                  <div className="tpo-journey__between">
                    <RightOutlined className="tpo-journey__arrow" aria-hidden />
                    {gap && gap.n > 0 && (
                      <button type="button" className={`tpo-journey__gap${picked === gap.key ? " is-on" : ""}`} aria-pressed={picked === gap.key}
                        onClick={() => onPick(gap.key)} data-testid={`journey.${gap.key}`} title={`Show these ${gap.n}`}>
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
                onClick={() => onPick(e.key)} data-testid={`journey.${e.key}`}>
                {e.label} · <strong>{e.n.toLocaleString()}</strong>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
