"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}) {
  return <ErrorState title="Interview rounds unavailable" description="The round schedule could not be loaded. No zero-value conclusion is assumed."
    action={<button type="button" onClick={reset}>Retry</button>} />;
}
