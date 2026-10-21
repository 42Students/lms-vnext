import { createContext, useContext, useEffect, useState } from "react";
import { Button, Checkbox, Popover, Typography } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, FilterFilled, FilterOutlined } from "@ant-design/icons";
import { isActive, optionCounts } from "@/components/tpo/filters/filterModel";

/**
 * The filters of the page the grid sits in, for column headers: { defs, rows, value, onChange }. GridWorkspace provides it, so a
 * header selector and the Filters panel are the same filter (one state, shown in the chips and the page address).
 */
export const GridFilterContext = createContext(null);

/**
 * A column header with a small selector for a list-type column (user, 5 Oct 2026: "if they are types or enums we should give a
 * small selector at the column heading"). Click the name to sort; the funnel opens a checklist with counts. Use in a colDef:
 *   headerComponent: HeaderFilter, headerComponentParams: { filterKey: "outcome" }
 * The filterKey is a key of the page's filter definitions.
 */
export default function HeaderFilter(params) {
  const { displayName, column, enableSorting, progressSort, filterKey } = params;
  const ctx = useContext(GridFilterContext);
  const [sort, setSort] = useState(column.getSort());
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const update = () => setSort(column.getSort());
    column.addEventListener("sortChanged", update);
    return () => column.removeEventListener("sortChanged", update);
  }, [column]);

  const def = ctx?.defs?.find((d) => d.key === filterKey);
  const value = def ? ctx.value?.[def.key] : undefined;
  const active = Boolean(def && isActive(def, value));
  const picked = new Set(active ? value.map(String) : []);
  const options = def && open ? optionCounts(ctx.rows || [], ctx.defs, ctx.value || {}, def) : [];
  const set = (next) => {
    const state = { ...(ctx.value || {}) };
    if (next.length) state[def.key] = next; else delete state[def.key];
    ctx.onChange?.(state);
  };
  const toggle = (v, on) => { const n = new Set(picked); if (on) n.add(v); else n.delete(v); set([...n]); };

  const list = def && (
    <div className="tpo-headfilter__list" data-testid={`headfilter.${filterKey}`}>
      {options.map((o) => (
        <label key={o.value} className={`tpo-filter__option${o.count === 0 && !picked.has(o.value) ? " is-empty" : ""}`}>
          <Checkbox checked={picked.has(o.value)} onChange={(e) => toggle(o.value, e.target.checked)} />
          <span className="tpo-filter__option-label">{o.label}</span>
          <span className="tpo-filter__count">{o.count.toLocaleString()}</span>
        </label>
      ))}
      {options.length === 0 && <Typography.Text type="secondary">Nothing to pick</Typography.Text>}
      {active && <Button size="small" type="link" style={{ padding: 0 }} onClick={() => set([])}>Clear</Button>}
    </div>
  );

  return (
    <div className="tpo-headfilter">
      <button type="button" className="tpo-headfilter__label" onClick={(e) => enableSorting && progressSort(e.shiftKey)} title={enableSorting ? "Sort" : undefined}>
        <span>{displayName}</span>
        {sort === "asc" && <ArrowUpOutlined />}
        {sort === "desc" && <ArrowDownOutlined />}
      </button>
      {def && (
        <Popover trigger="click" placement="bottomLeft" open={open} onOpenChange={setOpen} content={list} title={def.label} arrow={false}>
          <button type="button" className={`tpo-headfilter__icon${active ? " is-active" : ""}`} aria-label={`Filter ${def.label}`}>
            {active ? <FilterFilled /> : <FilterOutlined />}
          </button>
        </Popover>
      )}
    </div>
  );
}
