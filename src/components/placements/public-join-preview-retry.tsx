import Link from "next/link";

/** Transient preview failures are not equivalent to an invalid or expired link. */
export function PublicJoinPreviewRetry({scope,token}:{
 scope:"COMPANY"|"COLLEGE";token:string;
}){
 const root=scope==="COMPANY"?"/company-join/":"/college-join/";
 return <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
  <section role="alert" className="w-full space-y-4 rounded-xl border border-border bg-surface p-6">
   <h1 className="text-xl font-semibold text-foreground">We couldn&apos;t load this page</h1>
   <p className="text-sm text-body">Check your connection and try again. Your invitation was not used.
    If the problem continues, ask the placement cell for help.</p>
   <Link href={root+encodeURIComponent(token)}
    className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary">
    Retry
   </Link>
  </section>
 </main>;
}
