/** Tailwind semantic layout tokens for a future storage-backed Project Resources UI. */
export const resourceFileListLayout={
 container:"min-w-0 max-w-full space-y-3 overflow-x-clip",
 list:"grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2",
 row:"min-w-0 rounded-xl border border-border bg-surface p-4",
 name:"min-w-0 break-all text-sm font-semibold text-foreground",
 actions:"flex min-w-0 flex-wrap items-center gap-2",
 control:"min-h-11 max-w-full rounded-md border border-border px-3 py-2 text-sm",
 feedback:"break-words text-sm text-body",
} as const;
export function resourceFileListA11y(fileCount:number,busy:boolean){
 const count=Number.isSafeInteger(fileCount)&&fileCount>=0?fileCount:0;
 return {regionLabel:"Files attached to Project resource",statusText:
  busy?"Updating resource files…":count===1?"1 attached file":count+" attached files",
  listLabel:"Resource files",deleteDialogLabel:"Confirm resource file deletion"};
}
