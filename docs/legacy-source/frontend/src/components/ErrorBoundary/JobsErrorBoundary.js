import React from "react";
import { Alert, Button, Space } from "antd";
import { reportReactBoundaryError } from "@/utils/clientErrorReporting";

/**
 * Error Boundary for Jobs/Applications/Placement flows.
 * Phase 7 - 21.5.1: Catches render errors and shows recovery UI instead of crashing the page.
 */
export default class JobsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    reportReactBoundaryError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <Alert
            type="error"
            message="Something went wrong"
            description="An error occurred while loading this page. This may be caused by unexpected data. Try refreshing or go back."
            showIcon
            action={
              <Space>
                <Button size="small" onClick={this.handleReset}>
                  Try Again
                </Button>
                {this.props.onBack && (
                  <Button size="small" type="primary" onClick={this.props.onBack}>
                    Go Back
                  </Button>
                )}
              </Space>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
