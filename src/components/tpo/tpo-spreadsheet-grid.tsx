"use client";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import {useEffect,useRef,type ReactNode} from "react";
import {chosenTpoGridColumns,displayTpoGridCell,parseTpoGridColumns,updateTpoGridQuery,type TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {TpoGridColumnChooser} from "./tpo-grid-column-chooser";

export function TpoSpreadsheetGrid<Row>({rows,columns,rowKey,rowActions,openPrimary,mobileActionsCollapsible=false,storageKey,selection}:{rows:readonly Row[];columns:readonly TpoGridColumn<Row>[];rowKey:(row:Row)=>string;rowActions?:(row:Row)=>ReactNode;mobileActionsCollapsible?:boolean;storageKey?:string;
 selection?:{selected:readonly string[];onChange:(ids:string[])=>void};
 openPrimary?:{columnKey:string;onOpen:(row:Row)=>void;ariaLabel:(row:Row)=>string}
}){
 const router=useRouter(),pathname=usePathname(),params=useSearchParams();
 const permitted=columns.filter(column=>!column.exportOnly).map(column=>column.key);
 const selected=parseTpoGridColumns(params.get("columns")??undefined,permitted);
 const active=selected.length?selected:permitted;
 const display=chosenTpoGridColumns(columns,active);
 const visibleRowIds=rows.map(rowKey);
 const fullySelected=visibleRowIds.length>0&&visibleRowIds.every(id=>selection?.selected.includes(id));
 function changePageSelection(checked:boolean){
  if(!selection)return;
  const outside=selection.selected.filter(id=>!visibleRowIds.includes(id));
  selection.onChange(checked?[...outside,...visibleRowIds]:outside);
 }
 function changeRowSelection(id:string,checked:boolean){
  if(!selection)return;
  selection.onChange(checked?[...new Set([...selection.selected,id])]:selection.selected.filter(key=>key!==id));
 }
 const restored=useRef(false),permittedCsv=permitted.join(",");
 useEffect(()=>{
  if(restored.current)return;
  restored.current=true;
  if(!storageKey||params.has("columns"))return;
  try{
   const saved=window.localStorage.getItem(storageKey);
   if(!saved)return;
   const keys=parseTpoGridColumns(saved,permittedCsv.split(","));
   if(!keys.length)return;
   const next=updateTpoGridQuery(new URLSearchParams(params.toString()),{columns:keys.join(",")},false);
   router.replace(pathname+(next.size?"?"+next.toString():""));
  }catch{/* Local browser storage may be disabled: URL controls keep working. */}
 },[storageKey,permittedCsv,params,pathname,router]);
 function choose(keys:string[]){
  const defaults=keys.length===permitted.length&&keys.every((key,index)=>key===permitted[index]);
  const next=updateTpoGridQuery(new URLSearchParams(params.toString()),{columns:defaults?"":keys.join(",")},false);
  if(storageKey){
   try{if(defaults)window.localStorage.removeItem(storageKey);
   else window.localStorage.setItem(storageKey,keys.join(","));}
   catch{/* Continue with URL state when storage is disabled. */}
  }
  router.replace(pathname+(next.size?"?"+next.toString():""));
 }
 return <section className="min-w-0 space-y-3" aria-label="Spreadsheet grid">
  <TpoGridColumnChooser columns={columns} selected={active} onChange={choose}/>
  {rows.length===0?<p role="status" className="rounded border border-border p-3">No matching records.</p>:<>
   <div className="hidden overflow-x-auto rounded border border-border md:block"><table className="w-full text-left text-sm"><caption className="sr-only">Current page TPO spreadsheet records</caption>
    <thead><tr>{selection?<th scope="col" className="px-3 py-2"><input type="checkbox" aria-label="Select all visible students" checked={fullySelected} onChange={event=>changePageSelection(event.target.checked)}/></th>:null}{display.map(col=><th scope="col" className="px-3 py-2" key={col.key}>{col.label}</th>)}{rowActions&&<th scope="col" className="px-3 py-2">Actions</th>}</tr></thead>
    <tbody>{rows.map(row=><tr key={rowKey(row)} className="border-t border-border align-top">{selection?<td className="px-3 py-2"><input type="checkbox" checked={selection.selected.includes(rowKey(row))} aria-label={"Select "+(openPrimary?.ariaLabel(row)??rowKey(row))} onChange={event=>changeRowSelection(rowKey(row),event.target.checked)}/></td>:null}{display.map(col=><td key={col.key} className="break-words px-3 py-2">{openPrimary?.columnKey===col.key?<button type="button" className="min-h-10 text-left font-semibold text-primary-text underline" aria-label={openPrimary.ariaLabel(row)} onClick={()=>openPrimary.onOpen(row)}>{displayTpoGridCell(col.read(row))}</button>:displayTpoGridCell(col.read(row))}</td>)}{rowActions&&<td className="px-3 py-2">{rowActions(row)}</td>}</tr>)}</tbody>
   </table></div>
   {selection?<label className="flex min-h-11 items-center gap-2 text-sm md:hidden"><input type="checkbox" checked={fullySelected} onChange={event=>changePageSelection(event.target.checked)}/>Select all visible students</label>:null}
   <ul aria-label="Current page TPO spreadsheet records" className="space-y-2 md:hidden">{rows.map(row=><li key={rowKey(row)} className="min-w-0 space-y-2 rounded border border-border p-3">
    {selection?<label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={selection.selected.includes(rowKey(row))} onChange={event=>changeRowSelection(rowKey(row),event.target.checked)}/>Select student row</label>:null}
    {display.map(col=><div key={col.key} className="flex flex-wrap justify-between gap-2 text-sm"><strong>{col.label}</strong><span className="min-w-0 break-words [overflow-wrap:anywhere]">{openPrimary?.columnKey===col.key?<button type="button" className="min-h-10 text-left font-semibold text-primary-text underline" aria-label={openPrimary.ariaLabel(row)} onClick={()=>openPrimary.onOpen(row)}>{displayTpoGridCell(col.read(row))}</button>:displayTpoGridCell(col.read(row))}</span></div>)}
    {rowActions&&(mobileActionsCollapsible?<details className="rounded-md border border-border p-2">
      <summary className="min-h-10 cursor-pointer font-semibold">Actions</summary>
      <div aria-label="Row actions" className="mt-2">{rowActions(row)}</div>
    </details>:<div aria-label="Row actions">{rowActions(row)}</div>)}
   </li>)}</ul>
  </>}
 </section>;
}
