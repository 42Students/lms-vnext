"use client";
import {canToggleTpoGridColumn,countVisibleTpoColumns} from "@/modules/placements/tpo-grid-column-selection";

export function TpoGridColumnChooser({ columns, selected, onChange }: {
  columns: readonly { key: string; label: string; exportOnly?: boolean }[];
  selected: readonly string[];
  onChange: (keys: string[]) => void;
}) {
  const available = columns.filter((column) => !column.exportOnly);
  const visibleCount=countVisibleTpoColumns(available.map(column=>column.key),selected);
  return <fieldset className="min-w-0 space-y-2 rounded-md border border-border p-3">
    <legend className="px-1 text-sm font-semibold">Visible columns</legend>
    <p role="status" className="text-xs text-muted-foreground">{visibleCount} of {available.length} display columns visible. Export-only fields remain hidden.</p>
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
    <div role="group" aria-label="Column order" className="space-y-1">
      {selected.map((key,index)=>{
        const column=available.find(item=>item.key===key);
        if(!column)return null;
        const move=(direction:-1|1)=>{
          const next=[...selected];const target=index+direction;
          if(target<0||target>=next.length)return;
          [next[index],next[target]]=[next[target]!,next[index]!];onChange(next);
        };
        return <div key={key} className="flex flex-wrap items-center gap-2">
          <span className="min-w-24 text-sm">{column.label}</span>
          <button type="button" disabled={index===0} onClick={()=>move(-1)}
            className="min-h-10 rounded border border-border px-3 text-xs disabled:opacity-50"
            aria-label={"Move "+column.label+" earlier"}>Earlier</button>
          <button type="button" disabled={index===selected.length-1} onClick={()=>move(1)}
            className="min-h-10 rounded border border-border px-3 text-xs disabled:opacity-50"
            aria-label={"Move "+column.label+" later"}>Later</button>
        </div>;
      })}
    </div>
    <button type="button" disabled={selected.length === available.length}
      onClick={() => onChange(available.map(column => column.key))}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
      Show all columns
    </button>
  </fieldset>;
}
