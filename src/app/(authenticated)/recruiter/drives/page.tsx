import { RecruiterDrivesPageView } from "@/components/hr/recruiter-drives-page";

export default function RecruiterDrivesPage({ searchParams }: {searchParams: Parameters<typeof RecruiterDrivesPageView>[0]["searchParams"]}) {
  return <RecruiterDrivesPageView searchParams={searchParams} basePath="/recruiter/drives" />;
}
