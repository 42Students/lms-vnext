import Link from "next/link";
import {getPublicJoinPreview} from "@/modules/placements/public-join/preview-service";

/** Public GET only previews a hashed, live college link. It cannot join a recruiter. */
export default async function CollegeJoinPage({params}:{
  params:Promise<{token:string}>;
}){
 const {token}=await params;
 const preview=await getPublicJoinPreview(token,"COLLEGE");
 return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
  <section className="min-w-0 rounded-xl border border-border bg-surface p-5 sm:p-6">
   <p className="text-sm font-medium text-muted-foreground">42Students · Recruiter access</p>
   <h1 className="mt-2 break-words text-2xl font-semibold text-foreground">
    {preview.kind==="READY" ? "Join "+preview.collegeName : "Invitation unavailable"}
   </h1>
   {preview.kind==="READY"?<>
    <p className="mt-4 text-sm leading-6 text-body">
     This invitation is valid for a recruiter work-email verification.
     Joining is not available until one-time-code delivery and verified company access are enabled.
     No account or membership has been created.
    </p>
    <p role="status" className="mt-3 text-sm text-muted-foreground">
     Work-email and six-digit code verification are pending activation.
    </p>
   </>:<p role="alert" className="mt-4 text-sm text-body">
    This link is invalid, expired or unavailable. Request a new link from the placement cell.
   </p>}
   <Link href="/" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Return home</Link>
  </section>
 </main>;
}
