"use client";

/**
 * E8: TPO spreadsheet port to AG Grid's Quartz engine.
 *
 * The page owns the authorized rows and server export endpoints. This grid
 * never fetches rows, edits server data, or persists cell values.
 * Keep the mobile fallback until the legacy responsive reference is available.
 *
 * Requires ag-grid-community and ag-grid-react 36.x at install time.
 * Both packages must be declared upstream before this module can compile.
 */
import {useCallback,useEffect,useMemo,useRef,useState,} from "react";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import {AgGridReact} from "ag-grid-react";
import {
  AllCommunityModule,ModuleRegistry,themeQuartz,
  type ColDef,type GridApi,type CellClickedEvent,type ColumnState,
} from "ag-grid-community";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {TpoGridColumnChooser} from "@/components/tpo/tpo-grid-column-chooser";
import {chosenTpoGridColumns,displayTpoGridCell,parseTpoGridColumns,updateTpoGridQuery} from "@/modules/placements/tpo-grid-model";
import {TpoSpreadsheetGrid,type TpoSpreadsheetGridProps} from "../tpo-spreadsheet-grid";
import {gridSelectionClick,gridSelectionCheckbox,selectedGridIdsWithin} from "./grid-selection";
import {GRID_LAYOUT_SUFFIX,parseGridViewMemory,serializeGridViewMemory} from "./view-memory";
import {gridClipboardTsv} from "./grid-export";

ModuleRegistry.registerModules([AllCommunityModule]);

const quartz=themeQuartz.withParams({
 accentColor:"var(--lms-primary)",
 backgroundColor:"var(--lms-white)",
 foregroundColor:"var(--lms-neutral-700)",
 borderColor:"var(--lms-canvas-border)",
 headerBackgroundColor:"var(--lms-white)",
 headerTextColor:"var(--lms-neutral-400)",
 rowHoverColor:"var(--lms-white)",
 fontFamily:"Inter, system-ui, sans-serif",
 fontSize:13,
 rowHeight:44,
 headerHeight:44,
});
export const TPO_GRID_ENGINE="ag-grid-quartz" as const;

const minWidth=100;
const maxWidth=500;
const cellValue=(value:string|number|null|undefined):string|number=>displayTpoGridCell(value);
function compareNumberDate(kind:"number"|"date",a:unknown,b:unknown,descending=false):number{
 const convert=(value:unknown)=>{
  if(value===null||value===undefined||(typeof value==="string"&&value.trim()===""))return null;
  if(kind==="number"){
   const numeric=typeof value==="number"?value:Number(String(value).replaceAll(/[,%]/g,""));
   return Number.isFinite(numeric)?numeric:null;
  }
  const date=typeof value==="number"?value:Date.parse(String(value));
  return Number.isFinite(date)?date:null;
 };
 const av=convert(a),bv=convert(b);
 // AG Grid reverses comparator output in descending order; compensate for
 // empty values so blank dates/numbers stay LAST in both directions.
 if(av===null)return bv===null?0:descending?-1:1;
 if(bv===null)return descending?1:-1;
 return av-bv;
}
type NativeProps<Row>=TpoSpreadsheetGridProps<Row>;

/** AG Grid uses the same Row props as the existing TPO fallback. */
export function TpoGrid<Row>({
 rows,columns,rowKey,selection,rowActions,openPrimary,mobilePrimaryKeys,
 mobileActionsCollapsible=false,storageKey,integratedWorkspace=false,defaultVisibleKeys,
}:NativeProps<Row>){
 const router=useRouter(),pathname=usePathname(),params=useSearchParams();
 const api=useRef<GridApi<Row>|null>(null);
 const anchor=useRef<string|null>(null);
 const [notice,setNotice]=useState("");
 const permitted=useMemo(()=>columns.filter(col=>!col.exportOnly).map(col=>col.key),[columns]);
 const permittedCsv=permitted.join(",");
 const queryColumns=params.get("columns")??"";
 const selectedKeys=parseTpoGridColumns(queryColumns,permitted);
 const defaultKeys=defaultVisibleKeys?.filter(key=>permitted.includes(key))??permitted;
 const defaultKeysCsv=defaultKeys.join(",");
 const activeKeys=selectedKeys.length?selectedKeys:defaultKeys;
 const display=chosenTpoGridColumns(columns,activeKeys);
 const layoutKey=storageKey?storageKey+GRID_LAYOUT_SUFFIX:null;
 const displayedIds=useMemo(()=>rows.map(rowKey),[rows,rowKey]);
 const displayedCsv=displayedIds.join("\u001f");
 const selectedCsv=selection?.selected.join("\u001f")??"";
 const allowedIds=selection?.allIds??displayedIds;
 const allowedCsv=allowedIds.join("\u001f");
 const getFilteredIds=useCallback(()=>{
  const current=api.current;
  if(!current)return displayedIds;
  const ids:string[]=[];
  current.forEachNodeAfterFilterAndSort(node=>{
   if(node.data)ids.push(rowKey(node.data));
  });
  return ids;
 },[displayedCsv,rowKey,displayedIds]);
 // Never retain selections beyond server-approved visible/filter-scoped IDs.
 useEffect(()=>{
  if(!selection)return;
  const allowed=selectedGridIdsWithin(selection.selected,allowedIds);
  if(anchor.current&&!allowedIds.includes(anchor.current))anchor.current=null;
  if(allowed.length!==selection.selected.length)selection.onChange(allowed);
 },[allowedCsv,selectedCsv,selection,allowedIds]);
 const changeSelected=useCallback((next:string[])=>{
  if(!selection)return;
  selection.onChange(selectedGridIdsWithin(next,allowedIds));
 },[selection,allowedCsv,allowedIds]);
 const choose=useCallback((keys:string[])=>{
  const all=keys.length===defaultKeys.length&&keys.every((key,index)=>key===defaultKeys[index]);
  const next=updateTpoGridQuery(new URLSearchParams(params.toString()),{columns:all?"":keys.join(",")},false);
  if(storageKey){
   try{
    if(all){window.localStorage.removeItem(storageKey);window.localStorage.removeItem(storageKey+GRID_LAYOUT_SUFFIX);}
    else window.localStorage.setItem(storageKey,keys.join(","));
   }catch{/* Optional local preference. */}
  }
  router.replace(pathname+(next.size?"?"+next.toString():""),{scroll:false});
 },[params,pathname,router,permittedCsv,storageKey,defaultKeysCsv]);
 // Restore only widths/pinning for columns in the current authorized schema.
 useEffect(()=>{
  const current=api.current;
  if(!current||!layoutKey)return;
  try{
   const saved=parseGridViewMemory(window.localStorage.getItem(layoutKey),permitted);
   if(!saved.length)return;
   current.applyColumnState({state:saved.map(col=>({
    colId:col.key,width:col.width,pinned:col.pinned?"left":null,
   })),applyOrder:true});
  }catch{/* Corrupt/denied storage must not affect rows. */}
 },[layoutKey,permittedCsv]);
 const persistLayout=useCallback(()=>{
  const current=api.current;
  if(!current||!layoutKey)return;
  const saved:ColumnState[]=current.getColumnState();
  const allowed=new Set(permitted);
  const entries=saved.filter(col=>allowed.has(col.colId)).map(col=>({
   key:col.colId,width:Math.max(minWidth,Math.min(maxWidth,col.width??160)),
   pinned:col.pinned==="left",hidden:col.hide===true,
  }));
  try{window.localStorage.setItem(layoutKey,serializeGridViewMemory(entries,permitted));}
  catch{/* Saving layout is optional; never store cell values. */}
 },[layoutKey,permittedCsv]);
 const [gridApiReady,setGridApiReady]=useState(false);
 const currentVisibleIds=()=>{
  const authorized=new Set(allowedIds);
  return getFilteredIds().filter(id=>authorized.has(id));
 };
 const selectAll=(checked:boolean)=>{
  if(!selection)return;
  const filtered=currentVisibleIds();
  const included=new Set(filtered);
  const outside=selection.selected.filter(id=>!included.has(id));
  changeSelected(checked?[...outside,...filtered]:outside);
 };
 const selectOne=(row:Row,checked:boolean,shift=false)=>{
  if(!selection)return;
  const id=rowKey(row);
  const result=gridSelectionCheckbox(currentVisibleIds(),selection.selected,id,checked,anchor.current,shift,allowedIds);
  anchor.current=result.anchor;
  changeSelected(result.selected);
 };
 const handleClick=(event:CellClickedEvent<Row>)=>{
  if(!selection||!event.data||event.colDef.colId==="__select"||event.colDef.colId==="__actions")return;
  const target=event.event?.target;
  if(target instanceof HTMLElement&&target.closest("button,a,input,label,select,textarea,[role=button],[role=checkbox]"))return;
  const native=event.event;
  const modifiers=native instanceof MouseEvent?{
   shiftKey:native.shiftKey,ctrlKey:native.ctrlKey,metaKey:native.metaKey,
  }:{};
  const id=rowKey(event.data);
  const result=gridSelectionClick(currentVisibleIds(),selection.selected,id,anchor.current,modifiers,allowedIds);
  anchor.current=result.anchor;
  changeSelected(result.selected);
 };
 const copyVisible=()=>{
  // Respect AG Grid's currently filtered AND sorted order. Reading original rows
  // here silently copied a different order from the one users saw on screen.
  const byId=new Map(rows.map(row=>[rowKey(row),row] as const));
  const visible=currentVisibleIds().flatMap(id=>{
   const row=byId.get(id);
   return row===undefined?[]:[row];
  });
  const selectedIds=new Set(selection?.selected??[]);
  const selectedVisible=visible.filter(row=>selectedIds.has(rowKey(row)));
  const copied=selection?.selected.length?selectedVisible:visible;
  if(!navigator.clipboard?.writeText){setNotice("Clipboard unavailable. Use Export CSV instead.");return;}
  void navigator.clipboard.writeText(gridClipboardTsv(display,copied,true))
   .then(()=>setNotice("Copied "+copied.length+" authorized row(s) as TSV."))
   .catch(()=>setNotice("Clipboard unavailable. Use Export CSV instead."));
 };
 const definitions=useMemo<ColDef<Row>[]>(()=>{
  const result:ColDef<Row>[]=[];
  if(selection)result.push({
   colId:"__select",headerName:"Select",width:48,minWidth:48,maxWidth:48,
   pinned:"left",lockPinned:true,suppressMovable:true,resizable:false,sortable:false,
   headerComponent:()=> <Checkbox aria-label="Select all filtered students"
    checked={currentVisibleIds().length>0&&currentVisibleIds().every(id=>selection.selected.includes(id))}
    indeterminate={currentVisibleIds().some(id=>selection.selected.includes(id))&&
      !currentVisibleIds().every(id=>selection.selected.includes(id))}
    onChange={event=>selectAll(event.target.checked)}/>,
   cellRenderer:(p:{data?:Row})=>p.data?<Checkbox
    aria-label={"Select "+(openPrimary?.ariaLabel(p.data)??rowKey(p.data))}
    checked={selection.selected.includes(rowKey(p.data))}
    onChange={event=>{if(p.data)selectOne(p.data,event.target.checked,event.nativeEvent instanceof MouseEvent&&event.nativeEvent.shiftKey);}}/>:null,
  });
  for(const col of display)result.push({
   colId:col.key,headerName:col.label,
   minWidth, maxWidth, width:160,resizable:true,sortable:Boolean(col.sortKind),
   valueGetter:p=>p.data?col.read(p.data):null,
   ...(col.sortKind?{comparator:(a:unknown,b:unknown,nodeA:{data?:Row},nodeB:{data?:Row},isDescending:boolean)=>compareNumberDate(
    col.sortKind!,
    col.sortValue&&nodeA.data?col.sortValue(nodeA.data):a,
    col.sortValue&&nodeB.data?col.sortValue(nodeB.data):b,
    isDescending,
   )}:{}),
   ...(col.tooltip?{tooltipValueGetter:(p:{data?:Row})=>p.data?col.tooltip?.(p.data):undefined}:{}),
   ...(openPrimary?.columnKey===col.key?{cellRenderer:(p:{data?:Row})=>p.data?<Button variant="ghost" className="min-h-9 px-0 text-left underline"
      aria-label={openPrimary.ariaLabel(p.data)} onClick={()=>openPrimary.onOpen(p.data!)}>
      {col.render?col.render(p.data):cellValue(col.read(p.data))}</Button>:null}
    :col.render?{cellRenderer:(p:{data?:Row})=>p.data?col.render?.(p.data):null}:{}),
  });
  if(rowActions)result.push({
   colId:"__actions",headerName:"Actions",width:220,minWidth:160,sortable:false,
   cellRenderer:(p:{data?:Row})=>p.data?rowActions(p.data):null,
  });
  return result;
 },[display,selection,openPrimary,rowActions,rowKey]);
 const rowData=useMemo(()=>[...rows],[rows]);
 return <section className="min-w-0 space-y-3" data-slot="tpo-grid" data-grid-engine={TPO_GRID_ENGINE} aria-label="TPO spreadsheet">
  {!integratedWorkspace?<div className="flex flex-wrap items-center gap-2">
   <TpoGridColumnChooser columns={columns} selected={activeKeys} onChange={choose}/>
   <Button variant="secondary" onClick={copyVisible}>Copy visible TSV</Button>
  </div>:null}
  {notice?<p role="status" className="text-xs text-muted-foreground">{notice}</p>:null}
  <div className="hidden min-w-0 md:block" onKeyDown={event=>{
   if(!(event.ctrlKey||event.metaKey)||event.key.toLowerCase()!=="c"||event.defaultPrevented)return;
   if(event.target instanceof HTMLElement&&event.target.closest("input,textarea,select,[contenteditable=true]"))return;
   if(window.getSelection()?.toString())return;
   event.preventDefault();copyVisible();
  }}>
   <div className="h-[32.5rem] w-full overflow-hidden rounded-[var(--lms-radius-md)] border border-[var(--lms-canvas-border)]">
    <AgGridReact<Row> theme={quartz} rowData={rowData} columnDefs={definitions}
     getRowId={p=>rowKey(p.data)} suppressCellFocus={false}
     defaultColDef={{sortable:false,filter:false,resizable:true}}
     rowHeight={44} headerHeight={44} animateRows={false}
     onGridReady={event=>{
      api.current=event.api;setGridApiReady(true);
      if(!layoutKey)return;
      try{
       const saved=parseGridViewMemory(window.localStorage.getItem(layoutKey),permitted);
       if(saved.length)event.api.applyColumnState({state:saved.map(col=>({
        colId:col.key,width:col.width,pinned:col.pinned?"left":null,
       })),applyOrder:true});
      }catch{/* Optional layout. */}
     }}
     onCellClicked={handleClick}
     onColumnResized={event=>{if(event.finished)persistLayout();}}
     onColumnMoved={event=>{if(event.finished)persistLayout();}}
     onColumnPinned={persistLayout}
     onColumnVisible={persistLayout}
     overlayNoRowsTemplate="<span>No matching records.</span>"
     ensureDomOrder
    />
   </div>
   {gridApiReady&&selection?<p className="sr-only" role="status">
    {selection.selected.length} selected from the authorized filtered spreadsheet
   </p>:null}
  </div>
  <div className="md:hidden">
   <TpoSpreadsheetGrid<Row> rows={rows} columns={columns} rowKey={rowKey}
    {...(selection!==undefined?{selection}:{})} {...(rowActions!==undefined?{rowActions}:{})} {...(openPrimary!==undefined?{openPrimary}:{})}
    {...(mobilePrimaryKeys!==undefined?{mobilePrimaryKeys}:{})} mobileActionsCollapsible={mobileActionsCollapsible}
    integratedWorkspace {...(storageKey!==undefined?{storageKey}:{})}/>
  </div>
 </section>;
}
