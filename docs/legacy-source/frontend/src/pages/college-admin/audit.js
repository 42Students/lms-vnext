import { useSelector } from "react-redux";
import Link from "next/link";
import { Alert, Button } from "antd";
import ActivityCenter from "@/components/admin/activity/ActivityCenter";
import AdminLayout from "@/layouts/AdminLayout";
import PageShell from "@/components/Common/PageShell";

// Was superadmin-exclusive before — SuperAdminAuditController's endpoint already accepts a
// requirePerformAdminActionForCollege-style caller (it just checks requireSuperAdmin today, see
// the audit findings), but there was no admin-tier entry point at all despite college admins
// routinely performing destructive edits (student/faculty delete, announcement delete) with zero
// audit trail of their own. This page reuses the exact same AuditLogs component, pinned to the
// admin's own college (never global — that stays superadmin-only via allowGlobal).
export default function AdminAudit() {
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view the audit trail. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module admin-list-page">
      <PageShell
        title="Activity Log"
        actions={
          <Link href="/college-admin/projects/audit">
            <Button>View project activity</Button>
          </Link>
        }
      >
        {/* A readable feed (categories, sentences, details folded away) instead of the raw audit
            table. The backend still pins the search to the admin's own college from the JWT. */}
        <ActivityCenter collegeId={collegeId} />
      </PageShell>
    </div>
  );
}

AdminAudit.adminLayout = AdminLayout;
