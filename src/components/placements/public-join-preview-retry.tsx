import { PageHeader } from "@/components/ui/page-header";
import authStyles from "@/components/public/public-auth-skin.module.css";
import {Card} from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";

/** Transient preview failures are not equivalent to an invalid or expired link. */
export function PublicJoinPreviewRetry({scope,token}:{
 scope:"COMPANY"|"COLLEGE";token:string;
}){
 const root=scope==="COMPANY"?"/company-join/":"/college-join/";
 return <main className={`${authStyles["page"]} mx-auto flex w-full max-w-xl min-w-0 items-center px-4 pb-8 pt-24 md:py-12`}>
  <Card as="section" aria-label="Invitation preview unavailable" className="w-full">
   <PageHeader title="We couldn’t load this page" />
   <p role="alert" className="max-w-prose break-words text-sm leading-6 text-body">Check your connection and try again. Your invitation was not used.
    If the problem continues, ask the placement cell for help.</p>
   <ButtonLink variant="primary" href={root+encodeURIComponent(token)}
    className="mt-4 w-full md:w-auto">Retry</ButtonLink>
  </Card>
 </main>;
}
