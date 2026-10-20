import {CollegeDriveLegacyNav} from "@/components/placements/college-drive-legacy-nav";
export default async function CollegeDriveDetailLayout({
  children,params,
}:Readonly<{children:React.ReactNode;params:Promise<{jobId:string}>}>) {
  const {jobId}=await params;
  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <CollegeDriveLegacyNav jobId={jobId}/>
    {children}
  </div>;
}
