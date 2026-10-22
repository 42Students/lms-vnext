import { PageHeader } from "@/components/ui/page-header";
import authStyles from "@/components/public/public-auth-skin.module.css";
import Link from "next/link";
import {Card} from "@/components/ui/card";

/** Transient preview failures are not equivalent to an invalid or expired link. */
export function PublicJoinPreviewRetry({scope,token}:{
 scope:"COMPANY"|"COLLEGE";token:string;
}){
 const root=scope==="COMPANY"?"/company-join/":"/college-join/";
 return <main className={`${authStyles["page"]} mx-auto flex w-full max-w-xl min-w-0 items-center px-4 pb-8 pt-24 min-[768px]:py-12`}>
  <Card as="section" aria-label="Invitation preview unavailable" className="w-full">
   <PageHeader title="We couldn’t load this page" />
   <p role="alert" className="max-w-prose break-words text-sm leading-6 text-body">Check your connection and try again. Your invitation was not used.
    If the problem continues, ask the placement cell for help.</p>
   <Link href={root+encodeURIComponent(token)}
    className="mt-4 inline-flex min-h-11 w-full items-center justify-center md:min-h-9 md:w-auto rounded-[var(--lms-control-radius)] border border-primary bg-primary px-5 text-sm font-semibold text-on-primary hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Retry</Link>
  </Card>
 </main>;
}
