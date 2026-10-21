import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import React, { useEffect, useRef } from "react";

export default function ConfirmationModal({
  open,
  onClose,
  onApply,
  confirmText,
  title = "Confirm action",
}) {
  const [modal, contextHolder] = Modal.useModal();
  const triggerRef = useRef(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      confirm();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const restoreTriggerFocus = () => {
    setTimeout(() => {
      if (
        triggerRef.current &&
        typeof document !== "undefined" &&
        document.contains(triggerRef.current)
      ) {
        triggerRef.current.focus?.();
      }
    }, 0);
  };

  const handleClose = () => {
    onClose?.();
    restoreTriggerFocus();
  };

  const handleApply = () => {
    const result = onApply?.();

    // Ant keeps the confirmation open when onOk returns a rejecting Promise.
    // Returning that Promise preserves retry/focus behavior for failed async confirms.
    if (result && typeof result.then === "function") {
      return result.then((value) => {
        restoreTriggerFocus();
        return value;
      });
    }

    restoreTriggerFocus();
    return result;
  };

  const confirm = () => {
    modal.confirm({
      className: "ln-cnfrm-mod",
      rootClassName: "ln-confirm-modal-root",
      title,
      icon: <ExclamationCircleOutlined aria-hidden="true" />,
      content: confirmText,
      okText: "Confirm",
      cancelText: "Cancel",
      onCancel: handleClose,
      onOk: handleApply,
      okButtonProps: { size: "large" },
      cancelButtonProps: { size: "large" },
    });
  };

  return <>{contextHolder}</>;
}
