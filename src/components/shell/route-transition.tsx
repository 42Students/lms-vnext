"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import "./route-transition.css";

/** The legacy learner and admin page body enters over 250ms.
 * Keep the topbar/sidebar outside this wrapper. Query-only changes retain
 * the same key so a filter or pagination update never remounts its form. */
export function RouteTransition({children}:{children:ReactNode}) {
 const pathname=usePathname();
 const [leaving,setLeaving]=useState(false);
 return <div key={pathname} data-slot="route-content" data-route-transitioning={leaving?"true":undefined}
   className="lms-shell-route-content">{children}</div>;
}
