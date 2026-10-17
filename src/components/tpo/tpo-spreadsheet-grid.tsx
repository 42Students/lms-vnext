"use client";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from "react";
import {chosenTpoGridColumns,displayTpoGridCell,parseTpoGridColumns,updateTpoGridQuery,type TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {TpoGridColumnChooser} from "./tpo-grid-column-chooser";

export function TpoSpreadsheetGrid<Row>({rows,columns,rowKey,rowActions,openPrimary,mobileActionsCollapsible=false,storageKey,selection}:{rows:readonly Row[];columns:readonly TpoGridColumn<Row>[];rowKey:(row:Row)=>string;rowActions?:(row:Row)=>ReactNode;mobileActionsCollapsible?:boolean;storageKey?:string;
 selection?:{selected:readonly string[];onChange:(ids:string[])=>void;allIds?:readonly string[]};
 openPrimary?:{columnKey:string;onOpen:(row:Row)=>void;ariaLabel:(row:Row)=>string}
}){
 const router=useRouter(),pathname=usePathname(),params=useSearchParams();
 const permitted=columns.filter(column=>!column.exportOnly).map(column=>column.key);
 const selected=parseTpoGridColumns(params.get("columns")??undefined,permitted);
 const active=selected.length?selected:permitted;
 const display=chosenTpoGridColumns(columns,active);
 const [columnView,setColumnView]=useState<Record<string,{width:number;pinned:boolean}>>({});
 const viewKey=storageKey?storageKey+":layout-v2":null;
 const colWidth=(key:string)=>columnView[key]?.width??160;
 function updateLayout(key:string,patch:{width?:number;pinned?:boolean}){
  if(!viewKey)return;
  setColumnView(previous=>{
   const next={...previous,[key]:{width:patch.width??previous[key]?.width??160,
    pinned:patch.pinned??previous[key]?.pinned??false}};
   try{window.localStorage.setItem(viewKey,JSON.stringify(next));}
   catch{/* Browser storage can be disabled; the in-page layout stays usable. */}
   return next;
  });
 }
 function layoutStyle(key:string):CSSProperties{
  if(!viewKey)return {};
  const width=colWidth(key);
  if(!columnView[key]?.pinned)return {minWidth:width,width};
  const before=display.slice(0,display.findIndex(col=>col.key===key))
    .filter(col=>columnView[col.key]?.pinned)
    .reduce((sum,col)=>sum+colWidth(col.key),0);
  return {minWidth:width,width,left:before,position:"sticky",zIndex:1,background:"var(--surface, white)"};
 }
 const visibleRowIds=rows.map(rowKey);
 const selectAllIds=selection?.allIds??visibleRowIds;
 const anchor=useRef<number|null>(null);
 const fullySelected=selectAllIds.length>0&&selectAllIds.every(id=>selection?.selected.includes(id));
 function changePageSelection(checked:boolean){
  if(!selection)return;
  const outside=selection.selected.filter(id=>!selectAllIds.includes(id));
  selection.onChange(checked?[...outside,...selectAllIds]:outside);
 }
 function changeRowSelection(id:string,checked:boolean,shift=false){
  if(!selection)return;
  const index=visibleRowIds.indexOf(id);
  const range=shift&&anchor.current!==null&&index>=0?
    visibleRowIds.slice(Math.min(anchor.current,index),Math.max(anchor.current,index)+1):[id];
  selection.onChange(checked?[...new Set([...selection.selected,...range])]:
   selection.selected.filter(key=>!range.includes(key)));
  anchor.current=index>=0?index:null;
 }
 const restored=useRef(false),permittedCsv=permitted.join(",");
 useEffect(()=>{
  if(!viewKey)return;
  const frame=window.requestAnimationFrame(()=>{
   try{
    const raw=window.localStorage.getItem(viewKey);
    if(!raw)return;
    const stored:unknown=JSON.parse(raw);
    if(!stored||typeof stored!=="object"||Array.isArray(stored))return;
    const next:Record<string,{width:number;pinned:boolean}>={};
    for(const [key,value] of Object.entries(stored)){
     if(!permitted.includes(key)||!value||typeof value!=="object")continue;
     const row=value as Record<string,unknown>;
     if(typeof row.width==="number"&&Number.isFinite(row.width)&&
       row.width>=100&&row.width<=500&&typeof row.pinned==="boolean")
      next[key]={width:row.width,pinned:row.pinned};
    }
    setColumnView(next);
   }catch{/* Corrupt or disabled local preferences cannot break this authorized grid. */}
  });
  return ()=>window.cancelAnimationFrame(frame);
 },[viewKey,permittedCsv]);
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
   if(defaults){
    setColumnView({});
    try{window.localStorage.removeItem(storageKey+":layout-v2");}catch{/* Ignore disabled storage. */}
   }
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
    <thead><tr>{selection?<th scope="col" className="px-3 py-2"><input type="checkbox" aria-label="Select all filtered students" checked={fullySelected} onChange={event=>changePageSelection(event.target.checked)}/></th>:null}{display.map(col=><th scope="col" className="px-3 py-2" key={col.key} style={layoutStyle(col.key)}>
     <span>{col.label}</span>
     {viewKey?<div className="mt-1 flex flex-wrap gap-1 text-xs font-normal">
      <button type="button" onClick={()=>updateLayout(col.key,{width:Math.max(100,colWidth(col.key)-40)})}
       disabled={colWidth(col.key)<=100} aria-label={"Narrow "+col.label} className="rounded border px-1">−</button>
      <button type="button" onClick={()=>updateLayout(col.key,{width:Math.min(500,colWidth(col.key)+40)})}
       disabled={colWidth(col.key)>=500} aria-label={"Widen "+col.label} className="rounded border px-1">+</button>
      <button type="button" onClick={()=>updateLayout(col.key,{pinned:!columnView[col.key]?.pinned})}
       aria-pressed={Boolean(columnView[col.key]?.pinned)}
       className="rounded border px-1">{columnView[col.key]?.pinned?"Unpin":"Pin"}</button>
     </div>:null}
    </th>)}{rowActions&&<th scope="col" className="px-3 py-2">Actions</th>}</tr></thead>
    <tbody>{rows.map(row=><tr key={rowKey(row)} className="border-t border-border align-top">{selection?<td className="px-3 py-2"><input type="checkbox" checked={selection.selected.includes(rowKey(row))} aria-label={"Select "+(openPrimary?.ariaLabel(row)??rowKey(row))} onChange={event=>changeRowSelection(rowKey(row),event.target.checked,event.nativeEvent instanceof MouseEvent?event.nativeEvent.shiftKey:false)}/></td>:null}{display.map(col=><td key={col.key} className="break-words px-3 py-2" title={col.tooltip?.(row)} style={layoutStyle(col.key)}>{openPrimary?.columnKey===col.key?<button type="button" className="min-h-10 text-left font-semibold text-primary-text underline" aria-label={openPrimary.ariaLabel(row)} onClick={()=>openPrimary.onOpen(row)}>{displayTpoGridCell(col.read(row))}</button>:displayTpoGridCell(col.read(row))}</td>)}{rowActions&&<td className="px-3 py-2">{rowActions(row)}</td>}</tr>)}</tbody>
   </table></div>
   {selection?<label className="flex min-h-11 items-center gap-2 text-sm md:hidden"><input type="checkbox" checked={fullySelected} onChange={event=>changePageSelection(event.target.checked)}/>Select all filtered students</label>:null}
   <ul aria-label="Current page TPO spreadsheet records" className="space-y-2 md:hidden">{rows.map(row=><li key={rowKey(row)} className="min-w-0 space-y-2 rounded border border-border p-3">
    {selection?<label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={selection.selected.includes(rowKey(row))} aria-label={"Select "+(openPrimary?.ariaLabel(row)??rowKey(row))} onChange={event=>changeRowSelection(rowKey(row),event.target.checked,event.nativeEvent instanceof MouseEvent?event.nativeEvent.shiftKey:false)}/>Select student row</label>:null}
    {(mobileActionsCollapsible?display.slice(0,5):display).map(col=><div key={col.key} className="flex flex-wrap justify-between gap-2 text-sm" title={col.tooltip?.(row)}><strong>{col.label}</strong><span className="min-w-0 break-words [overflow-wrap:anywhere]">{openPrimary?.columnKey===col.key?<button type="button" className="min-h-10 text-left font-semibold text-primary-text underline" aria-label={openPrimary.ariaLabel(row)} onClick={()=>openPrimary.onOpen(row)}>{displayTpoGridCell(col.read(row))}</button>:displayTpoGridCell(col.read(row))}</span></div>)}
    {mobileActionsCollapsible&&display.length>5?<details className="rounded-md border border-border p-2 text-sm"><summary className="min-h-10 cursor-pointer font-semibold">More student details</summary>
      <dl className="mt-2 space-y-2">{display.slice(5).map(col=><div key={col.key} className="flex flex-wrap justify-between gap-2"><dt className="font-semibold">{col.label}</dt><dd className="min-w-0 break-words [overflow-wrap:anywhere]" title={col.tooltip?.(row)}>{displayTpoGridCell(col.read(row))}</dd></div>)}</dl>
    </details>:null}
    {rowActions&&(mobileActionsCollapsible?<details className="rounded-md border border-border p-2">
      <summary className="min-h-10 cursor-pointer font-semibold">Actions</summary>
      <div aria-label="Row actions" className="mt-2">{rowActions(row)}</div>
    </details>:<div aria-label="Row actions">{rowActions(row)}</div>)}
   </li>)}</ul>
  </>}
 </section>;
}
