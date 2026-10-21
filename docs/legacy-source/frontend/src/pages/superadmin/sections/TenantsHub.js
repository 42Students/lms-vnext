import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Card, Col, Row, Tabs, Tag, Typography, message } from "antd";
import Organizations from "./Organizations";
import Colleges from "./Colleges";
import CollegeSubdomain from "./CollegeSubdomain";
import CollegeBranding from "./CollegeBranding";
import CollegeSignIn from "./CollegeSignIn";
import ReadinessGate from "./ReadinessGate";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import AdminControlOverview from "@/components/admin/AdminControlOverview";

const { Text } = Typography;

// Shared intro block. Each tab opens with one sentence saying what it is for and who it affects —
// the two tabs have different blast radii (create a customer vs configure one) and nothing used
// to say so.
//
// A third "Advanced" tab used to live here, wrapping AppSettings. It was removed: at org/college
// scope it was a free-form key/value box with no valid keys (the only real ones, ff.*, have their
// own Feature Controls screen), and at global scope it was a second source of truth for
// baseDomain/globalHost/cookieDomain — which already fall back to deploy config in
// AppSettingsService, with the DB row silently winning. Its two mobile fields
// (mobileEntryUrl, mobileAlwaysShowOrgChooser) had no reader anywhere in the repo.
function TabIntro({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <Text type="secondary">{children}</Text>
    </div>
  );
}

export default function TenantsHub({ selectedOrganizationId, selectedCollegeId }) {
  const router = useRouter();
  const scoped = selectedOrganizationId != null || selectedCollegeId != null;
  const collegeScoped = selectedCollegeId != null;
  const { handleCollegeChange, currentCollegeName } = useSuperAdminScope();
  const requestedTab = Array.isArray(router.query.tab) ? router.query.tab[0] : router.query.tab;
  const requestedTabValid = requestedTab === "structure" || requestedTab === "identity";
  const [activeTab, setActiveTab] = useState(requestedTabValid ? requestedTab : (collegeScoped ? "identity" : "structure"));

  // That initial value is evaluated on the FIRST render, when selectedCollegeId is still null —
  // SuperAdminScopeContext resolves the saved college asynchronously, after its college-list
  // fetch. So loading /superadmin/tenants with a college already selected always landed on
  // "1. Create" and immediately showed the "creating is turned off" warning, which reads as if
  // the page were broken. The intended landing tab for a scoped session never appeared.
  //
  // Re-sync once the real scope arrives, but never fight the user: once they pick a tab
  // themselves, their choice wins for the life of the page.
  const userPickedTab = useRef(false);
  useEffect(() => {
    if (!router.isReady) return;
    const queryTab = Array.isArray(router.query.tab) ? router.query.tab[0] : router.query.tab;
    if (queryTab === "structure" || queryTab === "identity") {
      userPickedTab.current = true;
      setActiveTab(queryTab);
      return;
    }
    if (userPickedTab.current) return;
    setActiveTab(collegeScoped ? "identity" : "structure");
  }, [router.isReady, router.query.tab, collegeScoped]);

  const persistTab = (key) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab: key } },
      undefined,
      { shallow: true }
    );
  };

  const handleTabChange = (key) => {
    userPickedTab.current = true;
    setActiveTab(key);
    persistTab(key);
  };
  // Prefills the College form's Organization field right after creating one — a default value,
  // not a scope change, so it doesn't re-lock the College form the way selecting scope would.
  const [lastCreatedOrgId, setLastCreatedOrgId] = useState(null);

  // Creating a college selects it via the same scope mechanism the header dropdown uses, then
  // jumps straight to the launch checklist — no manual header click needed to continue.
  const handleCollegeCreated = async (college) => {
    try {
      await handleCollegeChange(college.id);
      setActiveTab("identity");
      persistTab("identity");
    } catch (e) {
      message.error("College created, but couldn't auto-select it — pick it from the header.");
    }
  };

  return (
    <>
      <AdminControlOverview
        eyebrow="Tenant lifecycle"
        title="Create the customer, then make one college launch-ready"
        description="Creating organizations and colleges is a platform-level action. Domains, branding and readiness checks are college-specific, so the current scope is always visible before you edit."
        scopeLabel={collegeScoped ? `College: ${currentCollegeName || selectedCollegeId}` : scoped ? "Organization-scoped" : "Platform view"}
        scopeColor={collegeScoped ? "blue" : scoped ? "gold" : "green"}
        metrics={[
          { label: "Current step", value: activeTab === "structure" ? "1 · Tenant structure" : "2 · Launch setup" },
          { label: "Creation", value: scoped ? "Locked" : "Available", hint: scoped ? "Clear scope to create tenants" : "Organizations and colleges" },
          { label: "College setup", value: collegeScoped ? "Available" : "Select college", hint: "Domains, branding and readiness" },
        ]}
      />
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: "structure",
            label: "1. Tenant structure",
            children: (
              <div style={{ padding: 16 }}>
                <TabIntro title="Create an organization and its colleges">
                  Start here for a brand-new customer. Create the organization first, then the
                  college under it. Creating a college selects it and takes you straight to
                  <b> 2. Set up</b>.
                </TabIntro>

                {scoped && (
                  <Alert
                    type="warning"
                    showIcon
                    message={collegeScoped ? "You're working inside one college, so creating is turned off" : "A tenant scope is selected, so creating is turned off"}
                    description={collegeScoped
                      ? "Clear the college in the header to view or manage the platform tenant structure. Global organization/college lists stay hidden while a tenant scope is active."
                      : "Clear the organization scope in the header to view or manage the platform tenant structure. Global organization/college lists stay hidden while a tenant scope is active."}
                    style={{ marginBottom: 16 }}
                  />
                )}
                {/* Stacked, not side by side — two forms-plus-tables squeezed into half-width
                    columns each read as cramped. Full width, one after the other, reads as two
                    separate steps instead of one crowded row. */}
                {!scoped ? (
                  <Row gutter={[16, 16]} align="top">
                    <Col xs={24}>
                      <Organizations onCreated={(org) => setLastCreatedOrgId(org.id)} />
                    </Col>
                    <Col xs={24}>
                      <Colleges defaultOrgId={lastCreatedOrgId} onCreated={handleCollegeCreated} />
                    </Col>
                  </Row>
                ) : null}
              </div>
            ),
          },
          {
            key: "identity",
            label: "2. Launch setup",
            children: (
              <div style={{ padding: 16 }}>
                <TabIntro title="Get this college ready to go live">
                  Give the college a web address people can reach it at, and make the login page
                  look like theirs. The checklist tells you what&apos;s still missing.
                  {/* The counterpart note on Tenant Settings — both screens deal with "domains"
                      (this one: a college's own hostnames; that one: the platform-wide
                      baseDomain/cookieDomain), and the near-synonymous sidebar names give no clue
                      which is which. */}
                  <br />
                  <Text type="secondary">
                    Platform-wide values (base domain, auth cookie domain, OTP and SMS policy,
                    operational limits) live under <strong>Tenant Settings</strong>, not here.
                  </Text>
                </TabIntro>

                {collegeScoped ? (
                  <div style={{ marginBottom: 16 }}>
                    <Tag color="blue">Working on: {currentCollegeName}</Tag>
                  </div>
                ) : (
                  <Alert
                    type="info"
                    showIcon
                    message="Pick a college first"
                    description="Web addresses and branding belong to one college. Choose one in the header to continue."
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Row gutter={[16, 16]} align="top">
                  <Col xs={24}>
                    <ReadinessGate fixedCollegeId={collegeScoped ? selectedCollegeId : null} />
                  </Col>
                  {collegeScoped ? (
                    <Col xs={24} xxl={12} id="tenant-domains-card">
                      <CollegeSubdomain fixedCollegeId={selectedCollegeId} />
                    </Col>
                  ) : null}
                  {collegeScoped ? (
                    <Col xs={24} xxl={12} id="college-signin-card">
                      <CollegeSignIn fixedCollegeId={selectedCollegeId} />
                    </Col>
                  ) : null}
                  <Col xs={24} xxl={12} id="college-branding-card">
                    <CollegeBranding fixedCollegeId={collegeScoped ? selectedCollegeId : null} hideCollegePicker={collegeScoped} />
                  </Col>
                </Row>
              </div>
            ),
          },
        ]}
      />
      </Card>
    </>
  );
}
