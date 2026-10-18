"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Announce pagination/query navigation without stealing focus from controls. */
export function RouteAnnouncer() {
  const pathname=usePathname();
  const query=useSearchParams().toString();
  const previous=useRef<{path:string;query:string}|null>(null);
  const [announcement,setAnnouncement]=useState("");
  useEffect(()=>{
    const prior=previous.current;
    previous.current={path:pathname,query};
    if(!prior || (prior.path===pathname && prior.query===query))return;
    const raf=requestAnimationFrame(()=>{
      const main=document.getElementById("lms-main-content");
      const heading=main?.querySelector("h1")?.textContent?.trim() || "Page";
      const queryOnly=prior.path===pathname;
      const pagination=main?.querySelector('[data-slot="pagination"] [aria-current="page"]');
      const paginationLabel=pagination?.getAttribute("aria-label");
      const nextMessage=queryOnly && paginationLabel
        ? `${heading}. ${paginationLabel}`
        : queryOnly ? `${heading} results updated` : `${heading} opened`;
      setAnnouncement(nextMessage);
      // Focus belongs to the currently active filter/overlay on query-only
      // updates; changing only ?page=2 must not yank keyboard focus into main.
      if(!queryOnly && !document.querySelector('dialog[open],[role="dialog"][aria-modal="true"]')){
        main?.focus({preventScroll:true});
      }
    });
    return ()=>cancelAnimationFrame(raf);
  },[pathname,query]);
  return <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</span>;
}
