"use client";

import {GracefulErrorBoundary} from "@/components/public/graceful-error-boundary";

/** Retry transient storage and session failures without leaking internal codes. */
export default function MyTrackerDetailError({error,reset}:{
 error:Error&{digest?:string};reset:()=>void;
}){
 return <GracefulErrorBoundary error={error} reset={reset} insideShell homeHref="/tracker/mine" />;
}
