"use client";

import {useEffect,useState,type ReactNode} from "react";
import Link from "next/link";

/** Preserve a successful, user/college/filter-bound recruiter inbox if its
 * server refresh fails. No conversation data is stored outside React memory.
 * A different user, role membership, filter or open thread changes the key.
 */
export function TpoInboxRefreshBoundary({
  scopeKey,failed,retryHref,children,
}:{
  scopeKey:string;
  failed:boolean;
  retryHref:string;
  children:ReactNode;
}){
  const [lastGood,setLastGood]=useState<{scope:string;content:ReactNode}|null>(
    failed?null:{scope:scopeKey,content:children},
  );
  useEffect(()=>{
    if(!failed)setLastGood({scope:scopeKey,content:children});
  },[failed,scopeKey,children]);
  const snapshot=lastGood?.scope===scopeKey?lastGood.content:null;
  if(!failed||!snapshot)return <>{children}</>;

  return <section aria-label="Last loaded recruiter inbox" className="min-w-0 space-y-3">
    <p role="status" className="border-l-2 border-warning bg-warning-subtle px-3 py-2 text-sm text-warning-text">
      This refresh failed. Your last loaded conversations remain visible, but may be out of date.{" "}
      <Link href={retryHref} className="font-semibold text-link underline">Retry</Link>
    </p>
    {snapshot}
  </section>;
}
