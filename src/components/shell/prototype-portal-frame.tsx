"use client";

import type {ReactNode} from "react";
import {usePathname} from "next/navigation";

/**
 * Apply the uploaded prototype styles to the portal actually being viewed,
 * including multi-role Faculty+Mentor / Admin+TPO accounts. A pathname is only
 * a presentation switch: every page still enforces its server-side RBAC.
 */
export function PrototypePortalFrame({children,className}:{
  children:ReactNode;className:string;
}){
  const pathname=usePathname();
  const portal=pathname==="/mentor"||pathname.startsWith("/mentor/")?"mentor":
    pathname==="/tpo"||pathname.startsWith("/tpo/")?"tpo":
    pathname==="/hr"||pathname.startsWith("/hr/")?"recruiter":null;
  return <div data-prototype-portal={portal??undefined} className={className}>
    {children}
  </div>;
}
