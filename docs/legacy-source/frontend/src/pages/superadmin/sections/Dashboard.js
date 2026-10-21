import Link from "next/link";
import { Button, Card, Col, Row, Space, Typography } from "antd";
import {
  ApartmentOutlined,
  AuditOutlined,
  ControlOutlined,
  GlobalOutlined,
  RightOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import AtAGlance from "@/components/admin/dashboard/AtAGlance";
import AttentionBoard from "@/components/admin/dashboard/AttentionBoard";
import QuickActionsGrid from "@/components/admin/dashboard/QuickActionsGrid";
import { quickActionsCollegeScoped } from "@/components/admin/dashboard/config";

const { Paragraph, Text } = Typography;

const GLOBAL_LINKS = [
  {
    path: "/superadmin/tenants",
    label: "Tenant setup",
    description: "Create and manage colleges, domains and tenant settings.",
    icon: <GlobalOutlined />,
  },
  {
    path: "/superadmin/features",
    label: "Feature controls",
    description: "Control platform capabilities and rollout state.",
    icon: <ControlOutlined />,
  },
  {
    path: "/superadmin/audit",
    label: "Activity log",
    description: "Investigate important changes across the platform.",
    icon: <AuditOutlined />,
  },
  {
    path: "/superadmin/recruiters",
    label: "Recruiter accounts",
    description: "Manage recruiter identities that can span colleges.",
    icon: <TeamOutlined />,
  },
];

const Dashboard = ({ collegeId, onNavigate }) => {
  if (!collegeId) {
    return (
      <div className="admin-dashboard-page admin-dashboard-platform">
        <section className="admin-dashboard-platform__hero">
          <Text className="admin-dashboard-platform__eyebrow">Platform operations</Text>
          <h2 className="admin-dashboard-platform__title">Choose the level you need to operate at.</h2>
          <Paragraph type="secondary" className="admin-dashboard-platform__description">
            Start with a platform-wide control below, or select a college in the header to switch this dashboard into that college&apos;s operational view.
          </Paragraph>
        </section>

        <Row gutter={[16, 16]} className="admin-dashboard-platform__grid">
          {GLOBAL_LINKS.map((link) => (
            <Col xs={24} sm={12} key={link.path}>
              <Link href={link.path}>
                <Card hoverable className="admin-dashboard-platform__card">
                  <div className="admin-dashboard-platform__card-icon" aria-hidden="true">{link.icon}</div>
                  <div className="admin-dashboard-platform__card-copy">
                    <div className="admin-dashboard-platform__card-title">{link.label}</div>
                    <Paragraph type="secondary">{link.description}</Paragraph>
                  </div>
                  <RightOutlined className="admin-dashboard-platform__card-arrow" aria-hidden="true" />
                </Card>
              </Link>
            </Col>
          ))}
        </Row>

        <div className="admin-dashboard-platform__scope-tip">
          <ApartmentOutlined aria-hidden="true" />
          <span>Select a college in the header to see live college totals, issues needing attention, and college-scoped shortcuts.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dash-hello">
        <div className="admin-dash-hello__college">Selected college operations</div>
        <div className="admin-dash-hello__date">Super Admin scoped view</div>
      </div>
      <AtAGlance collegeId={collegeId} />
      <AttentionBoard collegeId={collegeId} basePath="/superadmin" />
      <QuickActionsGrid actions={quickActionsCollegeScoped} onNavigate={onNavigate} />
      <Space wrap>
        <Link href="/superadmin/tenants"><Button>Back to tenant setup</Button></Link>
        <Link href="/superadmin/audit"><Button>Platform activity</Button></Link>
      </Space>
    </div>
  );
};

export default Dashboard;
