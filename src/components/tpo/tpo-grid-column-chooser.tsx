"use client";
import {canToggleTpoGridColumn} from "@/modules/placements/tpo-grid-column-selection";

export function TpoGridColumnChooser({ columns, selected, onChange }: {
  columns: readonly { key: string; label: string; exportOnly?: boolean }[];
  selected: readonly string[];
  onChange: (keys: string[]) => void;
}) {
  const available = columns.filter((column) => !column.exportOnly);
  return <fieldset className="min-w-0 space-y-2 rounded-md border border-border p-3">
    <legend className="px-1 text-sm font-semibold">Visible columns</legend>
    <div className="flex flex-wrap gap-3">
      {available.map((column) => <label key={column.key} className="flex min-h-10 items-center gap-2 text-sm">
        <input type="checkbox" checked={selected.includes(column.key)} disabled={selected.length === 1 && selected.includes(column.key)} onChange={(event) => {
          if (!canToggleTpoGridColumn(selected, event.target.checked)) return;
          const next = event.target.checked ? [...selected, column.key] : selected.filter((key) => key !== column.key);
          onChange(next);
        }} />
        <span>{column.label}</span>
      </label>)}
    </div>
    <button type="button" disabled={selected.length === available.length}
      onClick={() => onChange(available.map(column => column.key))}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
      Show all columns
    </button>
  </fieldset>;
}
