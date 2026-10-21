import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import RecruiterNotificationBell from "@/components/recruiter/RecruiterNotificationBell";

/**
 * The recruiter's header: one thing to do (request a drive) and the bell. The college is shown once, in the account area on the right,
 * and the page name is the page's own heading and the highlighted sidebar item, so neither is repeated here.
 * There is no search: a recruiter has a handful of drives, and the sidebar reaches every page.
 */
export default function RecruiterTopBar() {
  const router = useRouter();
  return (
    <div className="ln-glob-sch recruiter-command-bar" data-testid="recruiter.topbar">
      <div className="recruiter-command-bar__actions">
        {/* The one place to request a drive, on every page (pages no longer repeat it). A phone shows the short label. */}
        <Button className="recruiter-command-bar__plan" type="primary" icon={<PlusOutlined />} aria-label="Request a drive" onClick={() => router.push("/recruiter/drives/new")}>
          <span className="recruiter-command-bar__plan-long">Request a drive</span>
          <span className="recruiter-command-bar__plan-short">New drive</span>
        </Button>
        <span className="recruiter-command-bar__bell">
          <RecruiterNotificationBell onNavigate={(link) => router.push(link)} />
        </span>
      </div>
    </div>
  );
}
