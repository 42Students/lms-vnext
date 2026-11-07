import { notFound } from "next/navigation";
import { PublicExternalJobDetails } from "@/components/placements/public-external-job-details";

export const dynamic = "force-dynamic";
export default function UXG058ExternalJobFixture() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <PublicExternalJobDetails job={{
    title: "Junior Data Analyst",
    companyName: "Example Employer",
    description: "Analyze customer data.\nBuild accessible dashboards and reports.",
    workMode: "ON_SITE",
    applyHref: "https://careers.example.test/jobs/data-analyst",
  }} />;
}
