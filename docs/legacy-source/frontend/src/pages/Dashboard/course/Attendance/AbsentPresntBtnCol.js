import React from "react";
import { useSelector } from "react-redux";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

const AbsentPresntBtnCol = (props) => {
  const { attendanceStd, handleAttendanceButtonClick, disabled = false } = props;
  // (removed) `const course = useSelector(...)` — never read, but it subscribed every student
  // row to the entire course slice, so all 60 rows re-rendered on any course state change.
  const isPresent = !attendanceStd?.isAbsent;

  return (
    <div
      className="attendance-btns-wrapper d-flex"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={`att-btn att-btn--present${isPresent ? " att-btn--active" : ""}`}
        onClick={() => !disabled && handleAttendanceButtonClick(attendanceStd, "present")}
        aria-label="Mark present"
        aria-pressed={isPresent}
        disabled={disabled}
      >
        <CheckOutlined aria-hidden />
        <span>P</span>
      </button>
      <button
        type="button"
        className={`att-btn att-btn--absent${!isPresent ? " att-btn--active" : ""}`}
        onClick={() => !disabled && handleAttendanceButtonClick(attendanceStd, "absent")}
        aria-label="Mark absent"
        aria-pressed={!isPresent}
        disabled={disabled}
      >
        <CloseOutlined aria-hidden />
        <span>A</span>
      </button>
    </div>
  );
};

export default AbsentPresntBtnCol;
