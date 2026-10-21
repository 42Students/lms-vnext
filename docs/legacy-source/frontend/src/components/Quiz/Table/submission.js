import React from "react";

const QuizSubmissions = (props) => {
  return (
    <div className="d-flex align-items-center">
      <button
        type="button"
        className="ln-icon-action"
        style={{ marginRight: "15px", border: "0", padding: "0", background: "none", fontSize: "14px" }}
        onClick={props.onClick}
        disabled={props.disabled}
        aria-label="View quiz submissions"
        title="View submissions"
      >
        View
      </button>
    </div>
  );
};

export default QuizSubmissions;
