import HrDrivesPage from "@/app/(authenticated)/hr/drives/page";

/** Preserve the legacy recruiter namespace for list filters and pagination. */
export default function RecruiterDrivesPage(props: Parameters<typeof HrDrivesPage>[0]) {
  return <HrDrivesPage {...props} basePath="/recruiter/drives" />;
}
