"use client";
import { useState } from "react";
import { chosenTpoGridColumns, filterTpoGridRows, type TpoGridColumn } from "@/modules/placements/tpo-grid-model";
import { TpoGridColumnChooser } from "./tpo-grid-column-chooser";
export function TpoSpreadsheetGrid<Row>({ rows, columns, rowKey }: {
 rows:readonly Row[];columns:readonly TpoGridColumn<Row>[];rowKey:(row:Row)=>string;
}) {
 const [visible,setVisible]=useState<string[]>(columns.filter(column=>!column.exportOnly).map(column=>column.key));
 const [headerFilters,setHeaderFilters]=useState<Record<string,string>>({});
 const display=chosenTpoGridColumns(columns,visible);
 const filtered=filterTpoGridRows(rows,display,headerFilters);
 return <section className="min-w-0 space-y-3">
 <TpoGridColumnChooser columns={columns} selected={visible} onChange={setVisible}/>
 {filtered.length===0?<p role="status" className="rounded border border-border p-3">No matching records.</p>:<>
 <div className="hidden overflow-x-auto rounded border border-border md:block"><table className="w-full text-left text-sm">
 <thead><tr>{display.map(col=><th className="px-3 py-2" key={col.key}><label className="block space-y-1">{col.label}<input type="search" aria-label={"Filter "+col.label} value={headerFilters[col.key]??""} onChange={e=>setHeaderFilters(current=>({...current,[col.key]:e.target.value}))} className="block min-h-9 w-full min-w-24 rounded border border-border bg-surface px-2 text-xs" /></label></th>)}</tr></thead>
 <tbody>{filtered.map(row=><tr key={rowKey(row)} className="border-t border-border">{display.map(col=><td key={col.key} className="px-3 py-2">{col.read(row)??"—"}</td>)}</tr>)}</tbody>
 </table></div>
 <div className="space-y-2 md:hidden"><p className="text-xs text-muted-foreground">Header filters are applied to loaded records only.</p><div className="grid grid-cols-1 gap-2">{display.map(col=><label key={col.key} className="text-xs">{col.label}<input type="search" value={headerFilters[col.key]??""} onChange={e=>setHeaderFilters(current=>({...current,[col.key]:e.target.value}))} className="mt-1 min-h-10 w-full rounded border border-border bg-surface px-2"/></label>)}</div><ul className="space-y-2">{filtered.map(row=><li key={rowKey(row)} className="min-w-0 space-y-1 rounded border border-border p-3">{display.map(col=><div key={col.key} className="flex flex-wrap justify-between gap-2 text-sm"><strong>{col.label}</strong><span className="break-words">{col.read(row)??"—"}</span></div>)}</li>)}</ul></div>
 </>}
 </section>;
}
