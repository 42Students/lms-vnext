import React from "react";

const MyWeekHeader = props => {
  const lbl = (props.label || "").split(" ");
  const dayName = lbl[1] || "";
  const isSunday = dayName.toUpperCase() === "SUNDAY";
  return (
    <div style={{ fontWeight: 600 }}>
      <span className={isSunday ? "rbc-calendar-sunday" : ""}>
        {lbl[0] || ""}{" "}
      </span>
      <br />
      <span className={isSunday ? "rbc-calendar-sunday" : ""}>
        {dayName}
      </span>
    </div>
  );
};

export default MyWeekHeader;
