"use client";

import type {ReactNode} from "react";
import {usePathname} from "next/navigation";
import {prototypeRoleSkinForPath} from "./prototype-role-skin-model";

/**
 * Apply the uploaded prototype styles to the portal actually being viewed,
 * including multi-role Faculty+Mentor / Admin+TPO accounts. A pathname is only
 * a presentation switch: every page still enforces its server-side RBAC.
 */
export function PrototypePortalFrame({
  children,className,facultyEnabled,mentorEnabled,tpoEnabled,recruiterEnabled,
}:{
  children:ReactNode;className:string;
  facultyEnabled:boolean;mentorEnabled:boolean;tpoEnabled:boolean;recruiterEnabled:boolean;
}){
  const pathname=usePathname();
  // A College Admin's /tpo/home shortcut is NOT a TPO membership. Likewise
  // another role's route must not activate its prototype without a role grant.
  const portal=prototypeRoleSkinForPath({
    pathname,facultyEnabled,mentorEnabled,tpoEnabled,recruiterEnabled,
  });
  return <div data-prototype-portal={portal??undefined} className={className}>
    {children}
  </div>;
}
