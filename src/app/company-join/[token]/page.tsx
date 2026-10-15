import Link from "next/link";
import {getPublicJoinPreview} from "@/modules/placements/public-join/preview-service";

/** Token scope is checked against persisted COMPANY invitation before disclosing it. */
export default async function CompanyJoinPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 const preview=await getPublicJoinPreview(token,"COMPANY");
 return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
  <section className="min-w-0 rounded-xl border border-border bg-surface p-5 sm:p-6">
   <p className="text-sm font-medium text-muted-foreground">42Students · Company invitation</p>
   <h1 className="mt-2 break-words text-2xl font-semibold text-foreground">
    {preview.kind==="READY" ? "Company invitation for "+preview.collegeName : "Invitation unavailable"}
   </h1>
   {preview.kind==="READY"?<>
    <p className="mt-4 text-sm leading-6 text-body">
     This link is intended for work email addresses at <strong className="break-all">{preview.companyDomain}</strong>.
     Your organization must be verified with a one-time code before any college access can be granted.
    </p>
    <p role="status" className="mt-3 text-sm text-muted-foreground">
     One-time-code verification and company membership grants are not active yet.
     No access has been created from this link.
    </p>
   </>:<p role="alert" className="mt-4 text-sm text-body">
    This company invitation is invalid, expired or unavailable. Contact the placement cell for a current link.
   </p>}
   <Link href="/" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Return home</Link>
  </section>
 </main>;
}
