"use client";

import {useEffect} from "react";
import {installClientErrorReporting} from "@/lib/report-client-error";

/** Persistent on every role and public route; listener cleanup is idempotent. */
export function ClientErrorMonitor(){
 useEffect(()=>installClientErrorReporting(),[]);
 return null;
}
