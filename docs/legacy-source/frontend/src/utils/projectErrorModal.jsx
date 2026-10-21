import { Modal } from "antd";
import { ExclamationCircleOutlined, WarningOutlined, LockOutlined, WifiOutlined } from "@ant-design/icons";
import { getApiErrorMessage, getApiErrorStatus } from "./apiError";

// "changed since you opened it": the section/details/template tokens and the bulk college compare-and-set (Projects audit R3/R7).
const CONCURRENCY_MESSAGE = /(updated|modified|changed) by someone else|changed since you opened it|version is required|version mismatch|refresh (the page )?(and|then) try again/i;

export const isProjectConcurrencyConflict = (status, message) =>
  status === 409 && CONCURRENCY_MESSAGE.test(String(message || ""));

// Projects-wide API failure presentation. Business/validation conditions are warnings the user can
// act on; network/server failures are errors. A 409 is NOT automatically a concurrency failure —
// sprint lifecycle rules and other state-machine conflicts intentionally use 409 too.
export const showProjectError = (err, { fallback = "Something went wrong. Please try again.", onRetry } = {}) => {
  const status = getApiErrorStatus(err);
  const serverMessage = getApiErrorMessage(err, fallback);

  if (isProjectConcurrencyConflict(status, serverMessage)) {
    Modal.warning({
      title: "This was updated by someone else",
      icon: <WarningOutlined style={{ color: "#faad14" }} />,
      content: serverMessage || "Someone else changed this while you were working on it. Refresh the page to see the latest version, then try again.",
      okText: "Refresh",
      onOk: onRetry || (() => window.location.reload()),
    });
    return;
  }

  if (status === 409) {
    Modal.warning({
      title: "Action needs attention",
      icon: <WarningOutlined style={{ color: "#faad14" }} />,
      content: serverMessage,
      okText: "OK",
    });
    return;
  }

  if (status === 403) {
    Modal.warning({
      title: "You don't have permission to do that",
      icon: <LockOutlined style={{ color: "#faad14" }} />,
      content:
        serverMessage && serverMessage !== fallback
          ? serverMessage
          : "Your role doesn't allow this action on this project. If you think that's wrong, check with your mentor or admin.",
      okText: "OK",
    });
    return;
  }

  if (status === 401) {
    Modal.warning({
      title: "Your session has expired",
      icon: <WarningOutlined style={{ color: "#faad14" }} />,
      content: "Please sign in again to continue.",
      okText: "OK",
    });
    return;
  }

  if (status === 400 || status === 404 || status === 422 || status === 428) {
    Modal.warning({
      title: status === 404 ? "This item is no longer available" : "Check the details and try again",
      icon: <WarningOutlined style={{ color: "#faad14" }} />,
      content: serverMessage,
      okText: "OK",
    });
    return;
  }

  if (!status) {
    Modal.error({
      title: "Connection problem",
      icon: <WifiOutlined style={{ color: "#ff4d4f" }} />,
      content: "We couldn't reach the server. Check your connection and try again.",
      okText: "OK",
    });
    return;
  }

  if (status >= 500) {
    Modal.error({
      title: "Server error",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: "Something went wrong on our end. Please try again in a moment.",
      okText: "OK",
    });
    return;
  }

  Modal.error({
    title: "Couldn't complete that action",
    icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
    content: serverMessage,
    okText: "OK",
  });
};

// For failure paths that already resolved to a plain message string (e.g. a
// `{success, message}` result object) rather than a thrown error/response to inspect.
export const showProjectErrorMessage = (content, { title = "Couldn't complete that action" } = {}) => {
  Modal.warning({
    title,
    icon: <WarningOutlined style={{ color: "#faad14" }} />,
    content,
    okText: "OK",
  });
};
