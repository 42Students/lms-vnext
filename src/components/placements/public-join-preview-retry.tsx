import { PageHeader } from "@/components/ui/page-header";
import authStyles from "@/components/public/public-auth-skin.module.css";
import Link from "next/link";
import {Card} from "@/components/ui/card";

/** Transient preview failures are not equivalent to an invalid or expired link. */
export function PublicJoinPreviewRetry({scope,token}:{
 scope:"COMPANY"|"COLLEGE";token:string;
}){
 const root=scope==="COMPANY"?"/company-join/":"/college-join/";
 return <main className={`${authStyles.page} mx-auto flex min-h-dvh w-full max-w-xl min-w-0 items-center px-4 py-8 sm:py-12`}>
  <Card as="section" role="alert" className="w-full">
   <PageHeader title="We couldn&apos;t load this page" />
   <p className="text-sm text-body">Check your connection and try again. Your invitation was not used.
    If the problem continues, ask the placement cell for help.</p>
   <Link href={root+encodeURIComponent(token)}
    className="mt-4 inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-5 text-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Retry</Link>
  </Card>
 </main>;
}
