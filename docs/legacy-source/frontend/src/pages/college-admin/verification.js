import AdminLayout from "@/layouts/AdminLayout";
import PageShell from "@/components/Common/PageShell";
import VerificationWorkspace from "@/components/verification/VerificationWorkspace";

/** Profile verification for the college admin: verify students' Education and Identity, and decide whether the placement cell may too. */
export default function AdminProfileVerification() {
  return (
    <div className="ln-module admin-list-page">
      <PageShell title="Profile verification" subtitle="Check each student's education and identity against their documents. Verified profiles are what companies and the placement cell rely on.">
        <VerificationWorkspace canChangeSetting />
      </PageShell>
    </div>
  );
}

AdminProfileVerification.adminLayout = AdminLayout;
