import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Space, Tag, Tooltip, message } from "antd";
import {
  ReloadOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { getCollegeOnboardingReadiness } from "@/api/Services/TenantAdminService";

// The API returns machine codes (NO_PRIMARY_DOMAIN, MISSING_LOGO, ...) and a
// SEPARATE flat list of recommendedActions. Previously both were rendered as-is, so a superadmin
// read "NO_VERIFIED_PRIMARY_DOMAIN" in one box and had to guess which of the sentences in the box
// underneath fixed it. Every code now carries its own plain-English title, consequence and fix, so
// each row states the problem AND the way out in one place.
//
// `where` routes the fix button: "domains"/"branding" scroll to that card (same tab, already
// on-screen); "academic" jumps to other nav groups entirely.
const CHECK_INFO = {
  NO_DOMAIN: {
    title: "No web address allotted",
    why: "Nobody can reach this college yet.",
    fix: "Allot a subdomain, e.g. college.42lms.com. It is live straight away.",
    where: "domains",
  },
  // Older addresses made before the one-subdomain setup can still report these; allotting the subdomain fixes them.
  NO_PRIMARY_DOMAIN: {
    title: "No main web address",
    why: "This college's old addresses have none marked as the main one.",
    fix: "Allot the subdomain again in Web address.",
    where: "domains",
  },
  MULTIPLE_PRIMARY_DOMAINS: {
    title: "More than one main web address",
    why: "Two old addresses both claim to be the main one.",
    fix: "Allot the subdomain again in Web address.",
    where: "domains",
  },
  NO_VERIFIED_PRIMARY_DOMAIN: {
    title: "Web address not active",
    why: "The main address was made before the one-subdomain setup and isn't active.",
    fix: "Allot the subdomain again in Web address.",
    where: "domains",
  },
  PRIMARY_DOMAIN_NOT_VERIFIED: {
    title: "Web address not active",
    why: "The main address was made before the one-subdomain setup.",
    fix: "Allot the subdomain again in Web address.",
    where: "domains",
  },
  NO_VERIFIED_DOMAIN: {
    title: "Web address not active",
    why: "None of this college's old addresses is active.",
    fix: "Allot the subdomain again in Web address.",
    where: "domains",
  },
  MISSING_LOGO: {
    title: "No logo",
    why: "The login card shows the college's initials instead of its logo.",
    fix: "Upload the college logo.",
    where: "branding",
  },
  EMPTY_COLLEGE_NO_ACADEMIC_DATA: {
    title: "Academic setup incomplete",
    why: "It's missing at least one of departments, faculty, or students — so even once login works, there isn't a full academic setup for people to use yet.",
    fix: "Add whichever of departments, faculty, or students is still missing.",
    where: "academic",
  },
};

function FixAction({ code, router }) {
  const info = CHECK_INFO[code];
  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (info?.where === "domains") {
    return (
      <Button size="small" type="link" icon={<ArrowRightOutlined />} onClick={() => scrollTo("tenant-domains-card")}>
        Fix in Web address
      </Button>
    );
  }
  if (info?.where === "branding") {
    return (
      <Button size="small" type="link" icon={<ArrowRightOutlined />} onClick={() => scrollTo("college-branding-card")}>
        Fix in Branding
      </Button>
    );
  }
  if (info?.where === "academic") {
    return (
      <Space size={0} wrap>
        <Button size="small" type="link" onClick={() => router.push("/superadmin/departments")}>Departments</Button>
        <Button size="small" type="link" onClick={() => router.push("/superadmin/teachers")}>Faculty</Button>
        <Button size="small" type="link" onClick={() => router.push("/superadmin/students")}>Students</Button>
      </Space>
    );
  }
  return null;
}

function CheckRow({ code, severity, router }) {
  const info = CHECK_INFO[code];
  const isBlocker = severity === "blocker";
  // An unmapped code still has to render something a human can act on rather than vanishing.
  const title = info?.title || code;

  return (
    <li
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "10px 0",
        borderTop: "1px solid #f0f0f0",
      }}
    >
      {isBlocker ? (
        <CloseCircleFilled style={{ color: "#cf1322", marginTop: 3, flex: "0 0 auto" }} />
      ) : (
        <ExclamationCircleFilled style={{ color: "#d48806", marginTop: 3, flex: "0 0 auto" }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: "#141414" }}>
          {title}
          {!info && (
            <Tooltip title="This check has no description yet — raise it with the platform team.">
              <InfoCircleOutlined style={{ marginLeft: 6, color: "#8c8c8c" }} />
            </Tooltip>
          )}
        </div>
        {info?.why && <div style={{ color: "#595959", fontSize: 13, marginTop: 2 }}>{info.why}</div>}
        {info?.fix && (
          <div style={{ color: "#141414", fontSize: 13, marginTop: 4 }}>
            <b>What to do:</b> {info.fix}
          </div>
        )}
      </div>
      <div style={{ flex: "0 0 auto" }}>
        <FixAction code={code} router={router} />
      </div>
    </li>
  );
}

export default function ReadinessGate({ fixedCollegeId = null } = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const requestSeq = useRef(0);

  const collegeId = fixedCollegeId;

  const status = useMemo(() => {
    if (!data) return null;
    const ready = data?.readyForDomainLogin === true;
    const warnings = Array.isArray(data?.warnings) ? data.warnings : [];
    if (ready && warnings.length === 0) return "READY";
    if (ready && warnings.length > 0) return "READY_WITH_WARNINGS";
    return "BLOCKED";
  }, [data]);

  const load = async () => {
    if (!collegeId) return;
    const requestId = ++requestSeq.current;
    const requestedCollegeId = collegeId;
    setLoading(true);
    setLoadError(null);
    try {
      const r = (await getCollegeOnboardingReadiness(requestedCollegeId))?.data ?? null;
      if (requestId !== requestSeq.current) return;
      if (!r || typeof r !== "object" || typeof r.readyForDomainLogin !== "boolean"
          || !Array.isArray(r.blockers) || !Array.isArray(r.warnings)) {
        throw new Error("Unexpected readiness response");
      }
      setData(r);
    } catch (e) {
      if (requestId !== requestSeq.current) return;
      setData(null);
      setLoadError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Couldn't load the launch checklist.");
    } finally {
      if (requestId === requestSeq.current) setLoading(false);
    }
  };

  useEffect(() => {
    ++requestSeq.current;
    setData(null);
    setLoadError(null);
    if (collegeId) load();
    else setLoading(false);
    return () => { ++requestSeq.current; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  if (!collegeId) {
    return (
      <Card title="Launch checklist" size="small">
        <Alert
          type="info"
          showIcon
          message="Pick a college first"
          description="Choose a college in the header to see what's still needed before it can go live."
        />
      </Card>
    );
  }

  const blockers = Array.isArray(data?.blockers) ? data.blockers : [];
  const warnings = Array.isArray(data?.warnings) ? data.warnings : [];

  const headline = {
    READY: {
      type: "success",
      icon: <CheckCircleFilled style={{ color: "#389e0d" }} />,
      text: "Ready to go live",
      detail: "Students and staff can log in at this college's web address.",
    },
    READY_WITH_WARNINGS: {
      type: "warning",
      icon: <CheckCircleFilled style={{ color: "#389e0d" }} />,
      text: "Can go live, but some things are missing",
      detail: "Login works. The items below affect how it looks or how usable it is.",
    },
    BLOCKED: {
      type: "error",
      icon: <CloseCircleFilled style={{ color: "#cf1322" }} />,
      text: "Not ready — login will not work",
      detail: "Fix the items marked in red before sharing the address with anyone.",
    },
  }[status] || {};

  return (
    <Card
      title="Launch checklist"
      size="small"
      loading={loading}
      extra={
        <Button size="small" icon={<ReloadOutlined />} onClick={load}>
          Recheck
        </Button>
      }
    >
      <div style={{ color: "#595959", fontSize: 13, marginBottom: 12 }}>
        Everything that has to be true before this college can be handed over.
      </div>

      {loadError ? (
        <Alert
          type="error"
          showIcon
          message="Launch checklist could not be loaded"
          description={loadError}
          action={<Button size="small" onClick={load}>Retry</Button>}
          style={{ marginBottom: 12 }}
        />
      ) : null}

      {status && (
        <div
          role="status"
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            padding: "12px 14px",
            borderRadius: 8,
            background: status === "BLOCKED" ? "#fff2f0" : status === "READY" ? "#f6ffed" : "#fffbe6",
            border: `1px solid ${status === "BLOCKED" ? "#ffccc7" : status === "READY" ? "#b7eb8f" : "#ffe58f"}`,
          }}
        >
          <span style={{ marginTop: 2 }}>{headline.icon}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{headline.text}</div>
            <div style={{ color: "#595959", fontSize: 13 }}>{headline.detail}</div>
          </div>
        </div>
      )}

      {blockers.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>
            Must fix before launch{" "}
            <Tag color="red" style={{ marginLeft: 4 }}>{blockers.length}</Tag>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {blockers.map((b) => (
              <CheckRow key={b} code={b} severity="blocker" router={router} />
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>
            Recommended{" "}
            <Tag color="gold" style={{ marginLeft: 4 }}>{warnings.length}</Tag>
          </div>
          <div style={{ color: "#8c8c8c", fontSize: 12, marginBottom: 2 }}>
            These don&apos;t block login — they affect how the college looks and feels.
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {warnings.map((w) => (
              <CheckRow key={w} code={w} severity="warning" router={router} />
            ))}
          </ul>
        </div>
      )}

      {data?.meta?.requireVerifiedDomains && (
        <div style={{ marginTop: 16, color: "#8c8c8c", fontSize: 12 }}>
          <InfoCircleOutlined style={{ marginRight: 6 }} />
          This platform requires web addresses to be DNS-verified before they can serve logins.
        </div>
      )}
    </Card>
  );
}
