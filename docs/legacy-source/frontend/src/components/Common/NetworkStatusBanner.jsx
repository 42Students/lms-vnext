import { useEffect, useState } from "react";
import { Alert } from "antd";

const ONLINE = "online";
const OFFLINE = "offline";
const RECONNECTED = "reconnected";

export default function NetworkStatusBanner() {
  const [status, setStatus] = useState(ONLINE);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let reconnectTimer;

    const syncInitial = () => {
      if (window.navigator?.onLine === false) setStatus(OFFLINE);
    };
    const onOffline = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      setStatus(OFFLINE);
    };
    const onOnline = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      setStatus(RECONNECTED);
      reconnectTimer = setTimeout(() => setStatus(ONLINE), 4000);
    };

    syncInitial();
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (status === ONLINE) return null;

  const offline = status === OFFLINE;
  return (
    <div
      data-testid="network-status-banner"
      role={offline ? "alert" : "status"}
      aria-live={offline ? "assertive" : "polite"}
      style={{
        position: "fixed",
        left: "50%",
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        transform: "translateX(-50%)",
        width: "min(560px, calc(100vw - 24px))",
        zIndex: 2200,
        pointerEvents: "none",
      }}
    >
      <Alert
        banner
        showIcon
        type={offline ? "error" : "success"}
        message={offline ? "You're offline" : "Back online"}
        description={
          offline
            ? "Your current screen is being kept. Reconnect before retrying actions or refreshing data."
            : "Connection restored. Pages can refresh normally again."
        }
        style={{ borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
      />
    </div>
  );
}
