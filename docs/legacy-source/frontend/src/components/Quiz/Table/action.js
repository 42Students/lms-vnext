import React from "react";
import { Button } from "antd";

// The only caller (table.js) always passes both `click` and `text`, so the icon-button +
// Popconfirm branch and the plain "View" fallback this component used to have were unreachable
// dead code (confirmed via a repo-wide search — table.js is the sole usage). Simplified down to
// what's actually rendered: a single primary action button.
const ActionQuiz = ({ click, text, disabled = false }) => (
  <div className="learn-quiz-actions">
    <Button
      type="primary"
      size="small"
      className="learn-quiz-action-btn learn-quiz-action-btn--primary"
      onClick={click}
      disabled={disabled}
    >
      {text}
    </Button>
  </div>
);

export default ActionQuiz;
