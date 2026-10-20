"use client";

import {Button} from "@/components/ui/button";
import {cx} from "@/lib/class-names";
import {normalizedPageCount,paginationWindow} from "@/components/ui/pagination";

/** Button-based sibling of Pagination for client views that must clear local
 * selection/preview state when their guarded onPageChange handler runs.
 * The server-link Pagination remains server safe and unchanged.
 */
export function ActionPagination({
 page,pageCount,onPageChange,hasMore,disabled=false,label="Pages",className,
}:{
 page:number;
 pageCount:number;
 onPageChange:(page:number)=>void;
 hasMore?:boolean;
 disabled?:boolean;
 label?:string;
 className?:string;
}){
 const total=normalizedPageCount(pageCount);
 const current=Number.isFinite(page)?Math.max(1,Math.min(total,Math.trunc(page))):1;
 const pages=paginationWindow(current,total);
 const hasPrevious=current>1;
 const hasNext=current<total&&(hasMore??true);
 const base="min-h-11 min-w-11 rounded-[8px] border border-[var(--lms-canvas-border)] bg-white px-3 text-[14px] font-semibold leading-[42px] text-[var(--lms-body-text)] md:min-h-9 md:min-w-9 md:rounded-[var(--lms-control-radius)] md:leading-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]";
 const go=(target:number)=>{
  if(disabled||target===current||target<1||target>total)return;
  if(target>current&&!hasNext)return;
  onPageChange(target);
 };
 return <nav data-slot="action-pagination" aria-label={label}
  className={cx("flex min-w-0 flex-wrap items-center justify-center gap-1 md:justify-start md:gap-[var(--lms-space-2)]",className)}>
   <Button variant="secondary" type="button" className={base} disabled={disabled||!hasPrevious}
    onClick={()=>go(current-1)} aria-label="Previous page">Previous</Button>
   <span role="status" className="px-1 text-[12px] font-medium text-[var(--lms-neutral-500)] md:sr-only">
    Page {current} of {total}
   </span>
   {pages.map(target=>target===current?
    <span key={target} aria-current="page" aria-label={"Current page "+target+" of "+total}
     className={cx("inline-flex items-center justify-center",base,
      "cursor-default border-[var(--lms-primary)] bg-white text-[var(--lms-primary)]")}>
     {target}
    </span>:
    <Button key={target} variant="secondary" type="button" disabled={disabled}
      aria-label={"Page "+target+" of "+total}
      className={cx(base,"hidden md:inline-flex")} onClick={()=>go(target)}>{target}</Button>
   )}
   <Button variant="secondary" type="button" className={base} disabled={disabled||!hasNext}
    onClick={()=>go(current+1)} aria-label="Next page">Next</Button>
  </nav>;
}
