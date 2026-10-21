import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Button, message } from "antd";
import { LoginOutlined } from "@ant-design/icons";
import { getAccessToken, setAccessToken, setRefreshToken, decodeJwtPayload } from "@/utils/authUtils";
import { endImpersonation } from "@/api/Services/AdminUserLifecycleService";

// Mounted globally in _app.js (not inside any one role's layout) — an impersonated session can
// land on any page (learner/faculty/mentor), not just the superadmin panel, so this can't live
// inside superadmin/index.js the way the scope-switcher banner does. Presence is derived purely
// from the current access token's impersonatorId claim, not from any Redux/app state, so it stays
// correct across a full page navigation (which is exactly what starting/ending impersonation does).
export default function ImpersonationBanner() {
  const loginUser = useSelector((state) => state.loginUser);
  const [impersonating, setImpersonating] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const check = () => {
      const claims = decodeJwtPayload(getAccessToken());
      setImpersonating(claims?.impersonatorId != null);
    };
    check();
    // Re-check on focus — covers the case where impersonation was started/ended in another tab.
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, []);

  if (!impersonating) return null;

  const handleExit = async () => {
    setEnding(true);
    try {
      const res = await endImpersonation();
      const data = res?.data;
      if (data?.accessToken) setAccessToken(data.accessToken);
      if (data?.refreshToken) setRefreshToken(data.refreshToken);
      window.location.href = "/superadmin/dashboard";
    } catch (error) {
      message.error("Failed to exit impersonation: " + (error?.response?.data?.error || error?.response?.data?.message || error.message));
      setEnding(false);
    }
  };

  const name = [loginUser?.firstName, loginUser?.lastName].filter(Boolean).join(" ") || loginUser?.name || "this user";

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        background: "#a16207",
        color: "#fff",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <LoginOutlined aria-hidden />
      <span>Acting as {name} — this is an impersonated support session.</span>
      <Button size="small" loading={ending} onClick={handleExit}>
        Exit impersonation
      </Button>
    </div>
  );
}
