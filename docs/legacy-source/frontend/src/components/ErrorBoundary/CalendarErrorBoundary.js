import React from "react";
import { Alert, Button } from "antd";
import { reportReactBoundaryError } from "@/utils/clientErrorReporting";

/**
 * Error Boundary for calendar components.
 * Catches render errors in react-big-calendar or data parsing
 * and shows a recovery UI instead of crashing the whole page.
 */
export default class CalendarErrorBoundary extends React.Component {
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
            message="Calendar failed to render"
            description="An error occurred while displaying the calendar. This may be caused by malformed event data. Try refreshing."
            showIcon
            action={
              <Button size="small" onClick={this.handleReset}>
                Try Again
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
