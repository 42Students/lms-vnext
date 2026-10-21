import { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Drawer, Input, InputNumber, Radio, Tag, Typography } from "antd";
import { CloseOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
import { activeCount, applyFilters, chipsFor, optionCounts, removeChip } from "./filterModel";

const LONG_LIST = 8;
const SHOW_FIRST = 6;

/** True on a phone-sized screen (the panel becomes a bottom sheet). */
function useIsPhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return phone;
}

function Checklist({ def, rows, defs, draft, onChange }) {
  const [search, setSearch] = useState("");
  const [all, setAll] = useState(false);
  const options = optionCounts(rows, defs, draft, def);
  const picked = new Set(draft[def.key] || []);
  const matched = search ? options.filter((o) => String(o.label).toLowerCase().includes(search.toLowerCase())) : options;
  // A long list (skills, companies) shows the first few and whatever is picked; "Show all" opens the rest.
  // Fixed lists (stages, outcomes) are short and always shown whole; lists that grow with the data get search and a cap.
  const long = def.options ? options.length > 15 : options.length > LONG_LIST;
  const capped = long && !search && !all;
  const shown = capped ? matched.filter((o, i) => i < SHOW_FIRST || picked.has(o.value)) : matched;
  const toggle = (value, on) => {
    const next = new Set(picked);
    if (on) next.add(value); else next.delete(value);
    onChange([...next]);
  };
  return (
    <div className="tpo-filter__list">
      {long && (
        <Input size="small" allowClear placeholder={`Search ${def.label.toLowerCase()}`} value={search}
          onChange={(e) => setSearch(e.target.value)} className="tpo-filter__search" aria-label={`Search ${def.label}`} />
      )}
      {shown.map((o) => (
        <label key={o.value} className={`tpo-filter__option${o.count === 0 && !picked.has(o.value) ? " is-empty" : ""}`}>
          <Checkbox checked={picked.has(o.value)} onChange={(e) => toggle(o.value, e.target.checked)} />
          <span className="tpo-filter__option-label">{o.label}</span>
          <span className="tpo-filter__count">{o.count.toLocaleString()}</span>
        </label>
      ))}
      {shown.length === 0 && <Typography.Text type="secondary" style={{ fontSize: 12 }}>Nothing matches</Typography.Text>}
      {capped && <button type="button" className="tpo-filter__more" onClick={() => setAll(true)}>Show all {matched.length.toLocaleString()}</button>}
      {all && long && !search && <button type="button" className="tpo-filter__more" onClick={() => setAll(false)}>Show fewer</button>}
    </div>
  );
}

function Range({ def, value, onChange, rows }) {
  const v = value || {};
  // What the data actually spans, as the placeholder, so "CGPA from" is not a guess.
  const span = useMemo(() => {
    const nums = (rows || []).map((r) => def.get(r)).filter((n) => n !== null && n !== undefined && n !== "" && !Number.isNaN(Number(n))).map(Number);
    return nums.length ? [Math.min(...nums), Math.max(...nums)] : null;
  }, [rows, def]);
  const set = (k, n) => {
    const next = { ...v, [k]: n === null || n === undefined ? undefined : n };
    onChange(next.min === undefined && next.max === undefined ? undefined : next);
  };
  return (
    <div className="tpo-filter__range">
      <InputNumber size="small" placeholder={span ? `Min ${span[0]}` : "Min"} value={v.min} min={def.min} max={def.max} step={def.step || 1}
        onChange={(n) => set("min", n)} aria-label={`${def.label} from`} />
      <span>to</span>
      <InputNumber size="small" placeholder={span ? `Max ${span[1]}` : "Max"} value={v.max} min={def.min} max={def.max} step={def.step || 1}
        onChange={(n) => set("max", n)} aria-label={`${def.label} to`} />
      {def.unit && <Typography.Text type="secondary">{def.unit}</Typography.Text>}
    </div>
  );
}

/**
 * The shopping-app style filter side panel. Counts update live while picking; the list changes on Apply.
 * Props: open, onClose, title, defs, rows, value (applied state), onApply(state),
 *        scope(rows, state) (optional: rows a page leaves out by default, e.g. finished batches, so the counts match the list).
 */
export default function FilterPanel({ open, onClose, title = "Filters", defs, rows: allRows, value, onApply, scope }) {
  const phone = useIsPhone();
  const [draft, setDraft] = useState(value || {});
  const rows = useMemo(() => allRows || [], [allRows]);
  useEffect(() => { if (open) setDraft(value || {}); }, [open, value]);
  const matching = useMemo(() => applyFilters(scope ? scope(rows, draft) : rows, defs, draft).length, [rows, defs, draft, scope]);
  // A checklist with nothing to choose between is left out unless it is in use: no recruiter lead has a source yet, or every
  // student is in the same branch (a fixed list like Stage always shows).
  // A section's filters always sit together, in the order the sections first appear (a page may list them in any order).
  // A filter set elsewhere on the page (def.panel === false: the Batch and Department selectors at the top) is not repeated here.
  const visibleDefs = useMemo(() => {
    const shown = defs.filter((d) => d.panel !== false).filter((d) => d.type !== "checklist" || (draft[d.key] !== undefined)
      || (d.options ? d.options.length > 0 : optionCounts(rows, defs, {}, d).length > 1));
    const order = [...new Set(defs.map((d) => d.group || ""))];
    return shown.map((d, i) => ({ d, i })).sort((a, b) => order.indexOf(a.d.group || "") - order.indexOf(b.d.group || "") || a.i - b.i).map((x) => x.d);
  }, [defs, rows, draft]);
  // Sections (def.group): the first one and any with a filter in use start open.
  const groups = useMemo(() => [...new Set(defs.map((d) => d.group).filter(Boolean))], [defs]);
  const [openGroups, setOpenGroups] = useState(new Set());
  useEffect(() => {
    if (!open) return;
    const start = new Set(groups.slice(0, 1));
    defs.forEach((d) => { if (d.group && activeCount([d], value || {}) > 0) start.add(d.group); });
    setOpenGroups(start);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleGroup = (g) => setOpenGroups((cur) => { const n = new Set(cur); if (n.has(g)) n.delete(g); else n.add(g); return n; });
  const groupActive = (g) => activeCount(defs.filter((d) => d.group === g), draft);
  const set = (key, v) => setDraft((d) => {
    const next = { ...d };
    if (v === undefined || (Array.isArray(v) && v.length === 0)) delete next[key]; else next[key] = v;
    return next;
  });

  return (
    <Drawer
      open={open} onClose={onClose} title={title} placement={phone ? "bottom" : "right"}
      width={phone ? undefined : 360} height={phone ? "85vh" : undefined} className="tpo-filter-panel" destroyOnClose
      footer={(
        <div className="tpo-filter__footer">
          {/* Reset clears this panel's filters only; the page's own selectors (panel: false) stay as they are. */}
          <Button onClick={() => setDraft(Object.fromEntries(Object.entries(draft).filter(([k]) => defs.some((d) => d.key === k && d.panel === false))))}
            disabled={activeCount(defs.filter((d) => d.panel !== false), draft) === 0}>Reset</Button>
          <Button type="primary" onClick={() => { onApply(draft); onClose(); }} data-testid="filter.apply">
            Show {matching.toLocaleString()}
          </Button>
        </div>
      )}
    >
      {visibleDefs.map((def, i) => {
        const g = def.group;
        const head = g && (i === 0 || visibleDefs[i - 1].group !== g);
        const groupOpen = !g || openGroups.has(g);
        return (
        <div key={def.key} className="tpo-filter__item">
        {head && (
          <button type="button" className="tpo-filter__section" aria-expanded={groupOpen} onClick={() => toggleGroup(g)}>
            {groupOpen ? <DownOutlined /> : <RightOutlined />}
            <span>{g}</span>
            {groupActive(g) > 0 && <Tag className="tpo-filter__section-count">{groupActive(g)}</Tag>}
          </button>
        )}
        {groupOpen && (
        <section className="tpo-filter__group" aria-label={def.label}>
          <div className="tpo-filter__group-head">
            <strong>{def.label}</strong>
            {draft[def.key] !== undefined && (
              <button type="button" className="tpo-filter__clear" onClick={() => set(def.key, undefined)}>Clear</button>
            )}
          </div>
          {def.type === "checklist" && (
            <Checklist def={def} rows={rows} defs={defs} draft={draft} onChange={(v) => set(def.key, v)} />
          )}
          {def.type === "range" && <Range def={def} rows={rows} value={draft[def.key]} onChange={(v) => set(def.key, v)} />}
          {def.type === "yesno" && (
            <Radio.Group size="small" value={draft[def.key] || "any"} onChange={(e) => set(def.key, e.target.value === "any" ? undefined : e.target.value)}
              optionType="button" options={[{ value: "any", label: "Any" }, { value: "yes", label: def.yes || "Yes" }, { value: "no", label: def.no || "No" }]} />
          )}
        </section>
        )}
        </div>
        );
      })}
    </Drawer>
  );
}

/** Applied filters as removable chips above the list, with "Clear all". */
export function FilterChips({ defs, rows, value, onChange }) {
  const chips = chipsFor(defs, value, rows);
  if (chips.length === 0) return null;
  return (
    <div className="tpo-filter-chips" aria-label="Applied filters">
      {chips.map((c) => (
        <Tag key={`${c.key}:${c.value ?? ""}`} closable closeIcon={<CloseOutlined aria-label={`Remove ${c.label}`} />}
          onClose={(e) => { e.preventDefault(); onChange(removeChip(value, c)); }}>
          {c.label}
        </Tag>
      ))}
      <button type="button" className="tpo-filter-chips__clear" onClick={() => onChange({})}>Clear all</button>
    </div>
  );
}
