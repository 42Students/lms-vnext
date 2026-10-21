import { useRef, useState } from "react";
import { Modal } from "antd";

/**
 * A Modal whose OK waits for its own work: while onOk's promise runs the button spins and a second click does nothing.
 * A plain antd Modal ignores the promise, so a double click on Save sent the request twice (two saved views, two team adds).
 */
export default function AsyncModal({ onOk, confirmLoading, ...rest }) {
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const handleOk = async (e) => {
    if (running.current || !onOk) return;
    running.current = true;
    setBusy(true);
    try { await onOk(e); } finally { running.current = false; setBusy(false); }
  };
  return <Modal {...rest} onOk={handleOk} confirmLoading={Boolean(busy || confirmLoading)} />;
}
