"use client";

import { TpoUnifiedJobTypesEditor, type EditableJobType } from "./tpo-unified-job-types-editor";

/** Compatibility with earlier Settings callers. The live Settings route uses
 * this same five-column, staged editor, with built-ins and custom types in a
 * single ordered list and one atomic PUT save. */
type JobType = {
 id:string; label:string; active:boolean; updatedAt:string;
 countsAsPlaced:boolean|null; isBuiltin:boolean; drives?:number;
};
export function TpoJobTypesEditor({types}:{types:readonly JobType[]}){
 const editable:EditableJobType[]=types.map(item=>({
  id:item.id,
  label:item.label,
  active:item.active,
  expectedVersion:item.updatedAt,
  countsAsPlaced:item.countsAsPlaced??false,
  isBuiltin:item.isBuiltin,
  drives:item.drives??0,
 }));
 return <TpoUnifiedJobTypesEditor types={editable}/>;
}
