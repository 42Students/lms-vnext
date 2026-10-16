import { RecruiterDrivesPageView } from "@/components/hr/recruiter-drives-page";

export default function HrDrivesPage({ searchParams }: {searchParams: Parameters<typeof RecruiterDrivesPageView>[0]["searchParams"]}) {
  return <RecruiterDrivesPageView searchParams={searchParams} basePath="/hr/drives" />;
}
