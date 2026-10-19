"use client";
import { ErrorState } from "@/components/ui/error-state";
import {Button} from "@/components/ui/button";
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}) {
  return <ErrorState title="Interview rounds unavailable" description="The round schedule could not be loaded. No zero-value conclusion is assumed."
    action={<Button variant="ghost" type="button" onClick={reset}>Retry</Button>} />;
}
