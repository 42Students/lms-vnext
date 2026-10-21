import React from "react";
import { Alert, Button, Space } from "antd";
import { reportReactBoundaryError } from "@/utils/clientErrorReporting";

/**
 * Content-level boundary for routed LMS pages.
 *
 * This intentionally lives inside the persistent role layout so a render failure in one page
 * does not tear down navigation/header context. The app-level boundary in _app remains the final
 * safety net for failures in providers or the shell itself.
 */
export default class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error, errorInfo) {
    reportReactBoundaryError(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div style={{ padding: "clamp(16px, 3vw, 32px)" }}>
        <Alert
          type="error"
          showIcon
          role="alert"
          message="This page could not be displayed"
          description="Your LMS navigation is still available. Try loading this page again; if the problem continues, refresh the page."
          action={
            <Space wrap>
              <Button onClick={this.handleRetry}>Try again</Button>
              <Button onClick={this.handleReload}>Refresh page</Button>
            </Space>
          }
        />
      </div>
    );
  }
}
