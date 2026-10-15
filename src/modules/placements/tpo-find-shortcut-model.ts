/** T-S2-01: exact legacy Ctrl K command-launch semantics for the TPO finder. */
export function isTpoFindShortcut(event:{
 key:string;ctrlKey:boolean;metaKey:boolean;altKey:boolean;shiftKey:boolean;
}):boolean{
 return event.key.toLowerCase()==="k"&&
  (event.ctrlKey||event.metaKey)&&!event.altKey&&!event.shiftKey;
}
