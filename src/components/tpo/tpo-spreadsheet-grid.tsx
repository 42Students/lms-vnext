"use client";
import { useState } from "react";
import { chosenTpoGridColumns, type TpoGridColumn } from "@/modules/placements/tpo-grid-model";
import { TpoGridColumnChooser } from "./tpo-grid-column-chooser";
export function TpoSpreadsheetGrid<Row>({ rows, columns, rowKey }: {
 rows:readonly Row[];columns:readonly TpoGridColumn<Row>[];rowKey:(row:Row)=>string;
}) {
 const [visible,setVisible]=useState<string[]>(columns.filter(column=>!column.exportOnly).map(column=>column.key));
 const display=chosenTpoGridColumns(columns,visible);
 return <section className="min-w-0 space-y-3">
 <TpoGridColumnChooser columns={columns} selected={visible} onChange={setVisible}/>
 {rows.length===0?<p role="status" className="rounded border border-border p-3">No matching records.</p>:<>
 <div className="hidden overflow-x-auto rounded border border-border md:block"><table className="w-full text-left text-sm">
 <thead><tr>{display.map(col=><th className="px-3 py-2" key={col.key}>{col.label}</th>)}</tr></thead>
 <tbody>{rows.map(row=><tr key={rowKey(row)} className="border-t border-border">{display.map(col=><td key={col.key} className="px-3 py-2">{col.read(row)??"—"}</td>)}</tr>)}</tbody>
 </table></div>
 <ul className="space-y-2 md:hidden">{rows.map(row=><li key={rowKey(row)} className="min-w-0 space-y-1 rounded border border-border p-3">{display.map(col=><div key={col.key} className="flex flex-wrap justify-between gap-2 text-sm"><strong>{col.label}</strong><span className="break-words">{col.read(row)??"—"}</span></div>)}</li>)}</ul>
 </>}
 </section>;
}
