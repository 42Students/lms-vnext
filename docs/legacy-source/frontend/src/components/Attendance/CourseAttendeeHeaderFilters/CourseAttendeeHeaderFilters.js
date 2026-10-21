import React, { useContext, useState, useEffect } from "react";
import { DatePicker, Select } from "antd";
import {
  LeftOutlined,
  RightOutlined,
  } from "@ant-design/icons";
import dayjs from "dayjs";
import moment from "moment";

import styles from "./CourseAttendeeHeaderFilters.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { courseAction } from "@/redux/store";

const CourseAttendeeHeaderFilters = () => {
  const { attendeeCurMonth } = useSelector(state => state.course);
  const dispatch = useDispatch();

  const prevNextDateHandler = value => {
    let dt = new Date();
    if (value === "next") {
      let momdate = moment(attendeeCurMonth).add(1, "months");
      dt = new Date(momdate);
    } else if (value === "previous") {
      let momdate = moment(attendeeCurMonth).subtract(1, "months");
      dt = new Date(momdate);
    }
    dispatch(
      courseAction.handleCourseData({
        key: "attendeeCurMonth",
        value: dt.toISOString(),
      })
    );
  };

  // Stepping one month per click meant reaching a month several back (or forward) took one click
  // per month in between — the same friction reported on the learner-facing attendance page. A
  // direct month/year picker alongside the arrows lets a faculty jump straight there.
  const handleMonthPick = value => {
    if (!value) return;
    dispatch(
      courseAction.handleCourseData({
        key: "attendeeCurMonth",
        value: value.toDate().toISOString(),
      })
    );
  };

  return (
    <div className="col-xl-3 col-md-4 col-12 attendee-header-filters">
      <div
        className={
          styles.curDateWrapper +
          " d-flex justify-content-evenly w-100 align-items-center "
        }
      >
        {/* These were <span>-rendered icons with onClick: not focusable, no role, no aria-label,
            no key handler, and 15x15px targets with no focus ring. Since this is the only month
            control on the page, a keyboard-only or screen-reader user could not view any month
            other than the current one. */}
        <button
          type="button"
          onClick={() => prevNextDateHandler("previous")}
          className={styles.leftArrow}
          aria-label="Previous month"
        >
          <LeftOutlined aria-hidden="true" />
        </button>
        <DatePicker
          picker="month"
          value={dayjs(attendeeCurMonth ? new Date(attendeeCurMonth) : new Date())}
          onChange={handleMonthPick}
          allowClear={false}
          bordered={false}
          inputReadOnly
          format="MMMM YYYY"
          className={styles.selectedDate}
          suffixIcon={null}
          aria-label="Jump to month"
        />
        <button
          type="button"
          onClick={() => prevNextDateHandler("next")}
          className={styles.rightArrow}
          aria-label="Next month"
        >
          <RightOutlined aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default CourseAttendeeHeaderFilters;
