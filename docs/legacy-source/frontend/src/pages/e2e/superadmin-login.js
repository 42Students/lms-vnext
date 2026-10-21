import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { storeAuthResponse } from "@/utils/authUtils";
import { API_URL } from "@/config/appConfig";

export default function E2eSuperAdminLogin() {
  const router = useRouter();
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    const phone = typeof router.query.phone === "string" ? router.query.phone : "";
    if (!phone) {
      setErr("Missing phone");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/public/e2e/auth/superadmin`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErr(json?.message || json?.error || `HTTP_${res.status}`);
          return;
        }
        const auth = json?.data || json;
        const user = storeAuthResponse(auth);
        if (!user) {
          setErr("Failed to store auth");
          return;
        }
        router.replace("/superadmin/dashboard");
      } catch (e) {
        setErr(e?.message || "Login failed");
      }
    })();
  }, [router.isReady, router.query.phone]);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h3>E2E Superadmin Login</h3>
      {err ? <pre style={{ color: "crimson" }}>{err}</pre> : <p>Logging in…</p>}
    </div>
  );
}

E2eSuperAdminLogin.nolayout = true;

