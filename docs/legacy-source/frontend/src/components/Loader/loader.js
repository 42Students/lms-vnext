import { useEffect, useState } from "react";
import { Button, Spin, Typography } from "antd";

const { Text } = Typography;

const Loader = ({ timeoutMs = 20000, onTimeout }) => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setTimedOut(false);
    const t = setTimeout(() => {
      setTimedOut(true);
      if (onTimeout) onTimeout();
    }, timeoutMs);
    return () => clearTimeout(t);
  }, [timeoutMs, onTimeout]);

  return (
    <div className="spin">
      <Spin size="large" />
      {timedOut && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <Text type="secondary">Still loading…</Text>
          <div style={{ marginTop: 8 }}>
            <Button size="small" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loader;
