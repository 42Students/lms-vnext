"use client";

import {useEffect,useState,type ReactNode} from "react";
import Link from "next/link";
import {Banner} from "@/components/ui/banner";

/** Keep only a same-user, same-college, same-filter successful directory
 * visible when a subsequent server refresh fails. No local storage is used;
 * switching college/role or changing filters unmounts this keyed boundary.
 */
export function SemesterRefreshBoundary({
  scopeKey,failed,retryHref,children,
}:{
  scopeKey:string;
  failed:boolean;
  retryHref:string;
  children:ReactNode;
}){
  const [lastSuccess,setLastSuccess]=useState<{key:string;node:ReactNode}|null>(
    failed?null:{key:scopeKey,node:children},
  );
  useEffect(()=>{
    if(!failed)setLastSuccess({key:scopeKey,node:children});
  },[failed,scopeKey,children]);
  const previous=lastSuccess?.key===scopeKey?lastSuccess.node:null;
  if(!failed||!previous)return <>{children}</>;

  return <div className="min-w-0 space-y-4" role="region" aria-label="Previously loaded semesters">
    <Banner tone="warning">
      Couldn't refresh semesters. Showing the last successfully loaded list for this college and these filters.
      Changes since that load may be missing.{" "}
      <Link href={retryHref} className="font-semibold text-link underline underline-offset-4">Retry loading semesters</Link>
    </Banner>
    {previous}
  </div>;
}
