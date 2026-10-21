"use client";
import {Checkbox} from "@/components/ui/checkbox";
import {FilterChip} from "@/components/ui/filter-chip";
import {Button} from "@/components/ui/button";
import {Dropdown} from "@/components/ui/dropdown";
import { Table } from "@/components/ui/table";
import { Disclosure } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineNotice } from "@/components/ui/inline-notice";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from "react";
import {chosenTpoGridColumns,displayTpoGridCell,parseTpoGridColumns,updateTpoGridQuery,type TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {TpoGridColumnChooser} from "./tpo-grid-column-chooser";
import {gridSelectionClick, gridSelectionCheckbox, selectedGridIdsWithin} from "./grid/grid-selection";
import {sortTpoGridRows,type TpoGridSort} from "./grid/grid-sort";
import {gridClipboardTsv} from "./grid/grid-export";
import {GRID_LAYOUT_SUFFIX,parseGridViewMemory,serializeGridViewMemory} from "./grid/view-memory";

export type TpoSpreadsheetGridProps<Row> = {
 rows:readonly Row[];
 columns:readonly TpoGridColumn<Row>[];
 rowKey:(row:Row)=>string;
 rowActions?:(row:Row)=>ReactNode;
 mobileActionsCollapsible?:boolean;
 /** Hide duplicate columns/copy controls when GridWorkspace already owns them. */
 integratedWorkspace?:boolean;
 mobilePrimaryKeys?:readonly string[];
 /** Ordered legacy default columns only when this view has no explicit URL selection. */
 defaultVisibleKeys?:readonly string[];
 storageKey?:string;
 selection?:{selected:readonly string[];onChange:(ids:string[])=>void;allIds?:readonly string[]};
 openPrimary?:{columnKey:string;onOpen:(row:Row)=>void;ariaLabel:(row:Row)=>string};
};
export function TpoSpreadsheetGrid<Row>({
 rows,columns,rowKey,rowActions,openPrimary,mobileActionsCollapsible=false,integratedWorkspace=false,mobilePrimaryKeys,storageKey,selection,defaultVisibleKeys,
}:TpoSpreadsheetGridProps<Row>){
 const router=useRouter(),pathname=usePathname(),params=useSearchParams();
 const permitted=columns.filter(column=>!column.exportOnly).map(column=>column.key);
 const selected=parseTpoGridColumns(params.get("columns")??undefined,permitted);
 const active=selected.length?selected:(defaultVisibleKeys?.filter(key=>permitted.includes(key))??permitted);
 const display=chosenTpoGridColumns(columns,active);
 const [sort,setSort]=useState<TpoGridSort|null>(null);
 const orderedRows=sortTpoGridRows(rows,display,sort);
 const mobilePrimary = mobilePrimaryKeys?.length
   ? display.filter(column=>mobilePrimaryKeys.includes(column.key))
   : display.slice(0,5);
 const mobileExtra = display.filter(column=>!mobilePrimary.some(primary=>primary.key===column.key));
 const [columnView,setColumnView]=useState<Record<string,{width:number;pinned:boolean}>>({});
 const [clipboardMessage,setClipboardMessage]=useState("");
 const viewKey=storageKey?storageKey+GRID_LAYOUT_SUFFIX:null;
 const legacyViewKey=storageKey?storageKey+":layout-v2":null;
 const colWidth=(key:string)=>columnView[key]?.width??160;
 function updateLayout(key:string,patch:{width?:number;pinned?:boolean}){
  if(!viewKey)return;
  setColumnView(previous=>{
   const next={...previous,[key]:{width:patch.width??previous[key]?.width??160,
    pinned:patch.pinned??previous[key]?.pinned??false}};
   try{window.localStorage.setItem(viewKey,serializeGridViewMemory(
    permitted.map(key=>({key,width:next[key]?.width??160,pinned:next[key]?.pinned??false,hidden:!active.includes(key)})),
    permitted,
   ));}
   catch{/* Browser storage can be disabled; the in-page layout stays usable. */}
   return next;
  });
 }
 function layoutStyle(key:string):CSSProperties{
  if(!viewKey)return {};
  const width=colWidth(key);
  if(!columnView[key]?.pinned)return {minWidth:width,width};
  const before=(selection?48:0)+display.slice(0,display.findIndex(col=>col.key===key))
    .filter(col=>columnView[col.key]?.pinned)
    .reduce((sum,col)=>sum+colWidth(col.key),0);
  return {minWidth:width,width,left:before,position:"sticky",zIndex:1,background:"var(--surface, white)"};
 }
 const visibleRowIds=orderedRows.map(rowKey);
 const allowedIds=selection?.allIds??visibleRowIds;
 const selectAllIds=[...new Set(visibleRowIds.filter(id=>allowedIds.includes(id)))];
 const anchor=useRef<string|null>(null);
 const fullySelected=selectAllIds.length>0&&selectAllIds.every(id=>selection?.selected.includes(id));
 const partlySelected=!fullySelected&&selectAllIds.some(id=>selection?.selected.includes(id));
 function changePageSelection(checked:boolean){
  if(!selection)return;
  const outside=selection.selected.filter(id=>!selectAllIds.includes(id));
  selection.onChange(checked?[...outside,...selectAllIds]:outside);
 }
 function changeRowSelection(id:string,checked:boolean,shift=false){
  if(!selection)return;
  const result=gridSelectionCheckbox(visibleRowIds,selection.selected,id,checked,anchor.current,shift,allowedIds);
  selection.onChange(selectedGridIdsWithin(result.selected,allowedIds));
  anchor.current=result.anchor;
 }
 function changeRowClick(id:string,keys:{shiftKey:boolean;ctrlKey:boolean;metaKey:boolean}){
  if(!selection)return;
  const result=gridSelectionClick(visibleRowIds,selection.selected,id,anchor.current,keys,allowedIds);
  selection.onChange(selectedGridIdsWithin(result.selected,allowedIds));
  anchor.current=result.anchor;
 }

 const allowedCsv=allowedIds.join("\u001f");
 const selectedCsv=selection?.selected.join("\u001f")??"";
 useEffect(()=>{
  if(!selection)return;
  const filtered=selectedGridIdsWithin(selection.selected,allowedIds);
  if(anchor.current&&!allowedIds.includes(anchor.current))anchor.current=null;
  if(filtered.length!==selection.selected.length)selection.onChange(filtered);
 },[allowedCsv,selectedCsv,selection,allowedIds]);
 const restored=useRef(false),permittedCsv=permitted.join(",");
 useEffect(()=>{
  if(!viewKey)return;
  const frame=window.requestAnimationFrame(()=>{
   try{
    const savedV3=window.localStorage.getItem(viewKey);
    if(savedV3){
     const restoredV3=parseGridViewMemory(savedV3,permitted);
     if(restoredV3.length){
      setColumnView(Object.fromEntries(restoredV3.map(column=>[column.key,
       {width:column.width,pinned:column.pinned}])));
      return;
     }
    }
    const raw=legacyViewKey?window.localStorage.getItem(legacyViewKey):null;
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
    try{
     window.localStorage.removeItem(storageKey+GRID_LAYOUT_SUFFIX);
     window.localStorage.removeItem(storageKey+":layout-v2");
    }catch{/* Ignore disabled storage. */}
   }
   try{if(defaults)window.localStorage.removeItem(storageKey);
   else window.localStorage.setItem(storageKey,keys.join(","));}
   catch{/* Continue with URL state when storage is disabled. */}
  }
  router.replace(pathname+(next.size?"?"+next.toString():""));
 }
 function copyVisibleRows(){
  const selectedOnPage=orderedRows.some(row=>selection?.selected.includes(rowKey(row)));
  const included=orderedRows.filter(row=>!selectedOnPage||selection?.selected.includes(rowKey(row)));
  if(typeof navigator==="undefined"||!navigator.clipboard?.writeText){
   setClipboardMessage("Clipboard unavailable. Use Export CSV instead.");
   return;
  }
  void navigator.clipboard.writeText(gridClipboardTsv(display,included,true))
    .then(()=>setClipboardMessage("Visible grid rows copied as TSV."))
    .catch(()=>setClipboardMessage("Clipboard unavailable. Use Export CSV instead."));
 }
 return <section className="min-w-0 space-y-3" aria-label="Spreadsheet grid">
  {!integratedWorkspace?<details className="min-w-0 border-b border-border pb-3">
    <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-link md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]">Columns</summary>
    <TpoGridColumnChooser columns={columns} selected={active} onChange={choose}/>
   </details>:null}
  {!integratedWorkspace&&rows.length>0?<Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" onClick={copyVisibleRows}>Copy visible TSV</Button>:null}
  {sort?<Button variant="ghost" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" onClick={()=>setSort(null)} aria-label="Clear grid sorting">Clear grid sort</Button>:null}
  {clipboardMessage?<InlineNotice tone={clipboardMessage.startsWith("Clipboard unavailable")?"error":"success"} message={clipboardMessage}/>:null}
  {rows.length===0?<EmptyState title="No matching records."/>:<>
   <div className="hidden md:block" tabIndex={0} aria-label="TPO grid keyboard copy"
    onKeyDown={event=>{
     if(!(event.ctrlKey||event.metaKey)||event.key.toLowerCase()!=="c"||event.defaultPrevented)return;
     if(event.target instanceof HTMLElement&&event.target.closest("input,textarea,select,[contenteditable=true]"))return;
     if(window.getSelection()?.toString())return;
     event.preventDefault();event.stopPropagation();
     copyVisibleRows();
    }}><Table scrollLabel="TPO spreadsheet columns" className="w-full text-left text-sm"><caption className="sr-only">Current page TPO spreadsheet records</caption>
    <thead className="bg-[var(--lms-white)] text-[var(--lms-neutral-400)]"><tr>{selection?<th scope="col" className="sticky left-0 z-30 w-12 min-w-12 bg-[var(--lms-table-header)] px-2 py-2" ><Checkbox aria-label="Select all filtered students" checked={fullySelected} indeterminate={partlySelected} onChange={event=>changePageSelection(event.target.checked)}/></th>:null}{display.map(col=><th scope="col" className="px-3 py-2" key={col.key} style={layoutStyle(col.key)} aria-sort={sort?.key===col.key?(sort.direction==="asc"?"ascending":"descending"):undefined}>
     {col.sortKind?<Button variant="ghost" type="button" aria-label={"Sort "+col.label}
      aria-pressed={sort?.key===col.key}
      className="inline-flex min-h-11 md:min-h-9 items-center gap-1 font-semibold text-link focus-visible:outline-2 focus-visible:outline-[var(--lms-primary-text)]"
      onClick={()=>setSort(previous=>previous?.key===col.key
        ? previous.direction==="asc"?{key:col.key,direction:"desc"}:null
        : {key:col.key,direction:"asc"})}>
      {col.label}<span aria-hidden="true">{sort?.key===col.key?(sort.direction==="asc"?"↑":"↓"):"↕"}</span>
     </Button>:<span>{col.label}</span>}
     {viewKey?<details className="mt-2 min-w-0 border-t border-border pt-1 text-xs font-normal"><summary className="min-h-9 cursor-pointer py-2 text-xs font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]">Column tools</summary><div className="flex min-w-0 flex-wrap gap-2 pt-2">
      <Button variant="secondary" type="button" onClick={()=>updateLayout(col.key,{width:Math.max(100,colWidth(col.key)-40)})}
       disabled={colWidth(col.key)<=100} aria-label={"Narrow "+col.label} className="min-h-11 min-w-11 md:min-h-9 md:min-w-9">−</Button>
      <Button variant="secondary" type="button" onClick={()=>updateLayout(col.key,{width:Math.min(500,colWidth(col.key)+40)})}
       disabled={colWidth(col.key)>=500} aria-label={"Widen "+col.label} className="min-h-11 min-w-11 md:min-h-9 md:min-w-9">+</Button>
      <FilterChip type="button" onClick={()=>updateLayout(col.key,{pinned:!columnView[col.key]?.pinned})}
       aria-pressed={Boolean(columnView[col.key]?.pinned)} aria-label={(columnView[col.key]?.pinned?"Unpin ":"Pin ")+col.label}
       className="min-w-11">{columnView[col.key]?.pinned?"Unpin":"Pin"}</FilterChip>
     </div></details>:null}
    </th>)}{rowActions&&<th scope="col" className="px-3 py-2">Actions</th>}</tr></thead>
    <tbody>{orderedRows.map(row=><tr key={rowKey(row)} aria-selected={selection?.selected.includes(rowKey(row))||undefined}
     onClick={event=>{
      if(event.target instanceof HTMLElement && event.target.closest("button,a,input,select,textarea,label,summary,[role=button],[role=checkbox],[contenteditable=true]"))return;
      changeRowClick(rowKey(row),event);
     }} className="cursor-default border-t border-border align-top aria-selected:bg-primary-subtle">{selection?<td className="sticky left-0 z-20 w-12 min-w-12 bg-surface px-2 py-2" ><Checkbox checked={selection.selected.includes(rowKey(row))} aria-label={"Select "+(openPrimary?.ariaLabel(row)??rowKey(row))} onChange={event=>changeRowSelection(rowKey(row),event.target.checked,event.nativeEvent instanceof MouseEvent?event.nativeEvent.shiftKey:false)}/></td>:null}{display.map(col=><td key={col.key} className="break-words px-3 py-2" title={col.tooltip?.(row)} style={layoutStyle(col.key)}>{openPrimary?.columnKey===col.key?<Button variant="ghost" type="button" className="justify-start px-0 text-left text-link underline" aria-label={openPrimary.ariaLabel(row)} onClick={()=>openPrimary.onOpen(row)}>{displayTpoGridCell(col.read(row))}</Button>:displayTpoGridCell(col.read(row))}</td>)}{rowActions&&<td className="px-3 py-2">{rowActions(row)}</td>}</tr>)}</tbody>
   </Table></div>
   {selection?<label className="flex min-h-11 items-center gap-2 text-sm md:hidden"><Checkbox checked={fullySelected} indeterminate={partlySelected} onChange={event=>changePageSelection(event.target.checked)}/>Select all filtered students</label>:null}
   <ul aria-label="Current page TPO spreadsheet records" className="min-w-0 divide-y divide-border md:hidden">{orderedRows.map(row=><li key={rowKey(row)} className="min-w-0 space-y-3 py-4">
    {selection?<label className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={selection.selected.includes(rowKey(row))} aria-label={"Select "+(openPrimary?.ariaLabel(row)??rowKey(row))} onChange={event=>changeRowSelection(rowKey(row),event.target.checked,event.nativeEvent instanceof MouseEvent?event.nativeEvent.shiftKey:false)}/>Select student row</label>:null}
    {mobilePrimary.map(col=><div key={col.key} className="flex min-w-0 flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-3" title={col.tooltip?.(row)}><strong className="min-w-0 text-body">{col.label}</strong><span className="min-w-0 break-words [overflow-wrap:anywhere]">{openPrimary?.columnKey===col.key?<Button variant="ghost" type="button" className="justify-start px-0 text-left text-link underline" aria-label={openPrimary.ariaLabel(row)} onClick={()=>openPrimary.onOpen(row)}>{displayTpoGridCell(col.read(row))}</Button>:displayTpoGridCell(col.read(row))}</span></div>)}
    {mobileExtra.length>0?<Disclosure title="More student details" className="min-w-0 border-t border-border pt-2 text-sm" contentClassName="py-2">
      <dl className="mt-2 space-y-2">{mobileExtra.map(col=><div key={col.key} className="flex flex-wrap justify-between gap-2"><dt className="font-semibold">{col.label}</dt><dd className="min-w-0 break-words [overflow-wrap:anywhere]" title={col.tooltip?.(row)}>{openPrimary?.columnKey===col.key?<Button variant="ghost" type="button" className="min-h-11 justify-start px-0 text-left text-link underline md:min-h-9" aria-label={openPrimary.ariaLabel(row)} onClick={()=>openPrimary.onOpen(row)}>{displayTpoGridCell(col.read(row))}</Button>:displayTpoGridCell(col.read(row))}</dd></div>)}</dl>
    </Disclosure>:null}
    {rowActions ? mobileActionsCollapsible ?
      <Dropdown mobileSheet align="end" label={"Actions for "+(openPrimary?.ariaLabel(row)??rowKey(row))} trigger="Actions">
       <div role="group" aria-label={"Row actions for "+(openPrimary?.ariaLabel(row)??rowKey(row))}
         className="min-w-0 space-y-2 break-words [overflow-wrap:anywhere]">
         {rowActions(row)}
         <Button variant="ghost" type="button" className="min-h-11 w-full justify-center md:min-h-9"
           onClick={event=>{
             const root=event.currentTarget.closest("details");
             if(root){root.open=false;root.querySelector("summary")?.focus();}
           }}>Close actions</Button>
       </div>
      </Dropdown> :
      <div aria-label="Row actions" className="border-t border-border pt-3">{rowActions(row)}</div>
    : null}
   </li>)}</ul>
  </>}
 </section>;
}
