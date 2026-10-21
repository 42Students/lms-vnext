import React, { useState, useEffect, useCallback, memo } from "react";
import { Alert, Button, DatePicker, Select } from "antd";

import styles from "./TakeAttendanceHeaderFilters.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { courseAction } from "@/redux/store";
import dayjs from "dayjs";
import { getClassSheduleByDaterange } from "@/api/Services/attendanceServices";
var localizedFormat = require("dayjs/plugin/localizedFormat");
dayjs.extend(localizedFormat);
const TakeAttendanceHeaderFilters = () => {
  const loginUser = useSelector(state => state?.loginUser);
  const dispatch = useDispatch();
  const [classesOptions, setClassesOption] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const { selectedClass, takeAttendanceDate, selectedCourseSlug, selectedCourseId, scheduleRefreshKey, takeAttendanceDirty } = useSelector(
    state => state.course
  );

  const confirmDiscardAttendanceDraft = () => {
    if (!takeAttendanceDirty) return true;
    if (!window.confirm("Discard your unsaved attendance changes?")) return false;
    dispatch(courseAction.handleCourseData({ key: "takeAttendanceDirty", value: false }));
    return true;
  };

  const handleClassChange = value => {
    if (!confirmDiscardAttendanceDraft()) return;
    dispatch(
      courseAction.handleCourseData({
        key: "selectedClass",
        value: value,
      })
    );
  };
  // const prevNextDateHandler = value => {
  //   let dt = new Date();
  //   if (value === "next") {
  //     let momdate = moment(takeAttendanceDate).add(1, "days");
  //     dt = new Date(momdate);
  //   } else if (value === "previous") {
  //     let momdate = moment(takeAttendanceDate).subtract(1, "days");
  //     dt = new Date(momdate);
  //   }
  //   dispatch(
  //     courseAction.handleCourseData({
  //       key: "takeAttendanceDate",
  //       value: dt,
  //     })
  //   );
  // };
  useEffect(() => {
    let cancelled = false;
    const classId = loginUser?.classId;
    if (classId == null || classId === "") {
      dispatch(courseAction.handleCourseData({ key: "takeAttendanceData", value: [] }));
      dispatch(courseAction.handleCourseData({ key: "selectedClass", value: null }));
      setClassesOption([]);
      return () => { cancelled = true; };
    }
    const startDate = takeAttendanceDate
      ? dayjs(takeAttendanceDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");
    const params = { classId, startDate, endDate: startDate };
    if (selectedCourseSlug) params.courseSlug = selectedCourseSlug;
    else if (selectedCourseId) params.courseId = Number(selectedCourseId);
    setScheduleLoading(true);
    setScheduleError(null);
    getClassSheduleByDaterange(params)
      .then(res => {
        if (cancelled) return;
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        let classSheduleOptions = list.map(classSheduled => ({
          label: dayjs(classSheduled?.startTime).format("h:mm A"),
          value: classSheduled?.classScheduleId,
          classId: classSheduled?.classId,
          startTime: classSheduled?.startTime,
          endTime: classSheduled?.endTime,
          title: classSheduled?.title,
        }));
        setClassesOption(classSheduleOptions);
        if (classSheduleOptions.length > 0) {
          handleClassChange(classSheduleOptions[0]);
        } else {
          dispatch(
            courseAction.handleCourseData({
              key: "takeAttendanceData",
              value: [],
            })
          );
          dispatch(
            courseAction.handleCourseData({
              key: "selectedClass",
              value: null,
            })
          );
        }
      })
      .catch((error) => {
        if (cancelled) return;
        // A failed schedule lookup is unknown state, not proof that there are no classes on this
        // date. Keep the selector in an explicit error state instead of claiming "No classes scheduled".
        setClassesOption([]);
        setScheduleError(error?.response?.data?.message || "Could not load class schedules for this date.");
        dispatch(
          courseAction.handleCourseData({
            key: "takeAttendanceData",
            value: [],
          })
        );
        dispatch(
          courseAction.handleCourseData({
            key: "selectedClass",
            value: null,
          })
        );
      })
      .finally(() => {
        if (!cancelled) setScheduleLoading(false);
      });
    return () => { cancelled = true; };
  }, [takeAttendanceDate, loginUser?.classId, selectedCourseSlug, selectedCourseId, scheduleRefreshKey, retryKey]);

  return (
    <div className="col-md-6 col-12 attendee-header-filters">
      {scheduleError && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 8 }}
          message="Class schedules unavailable"
          description={scheduleError}
          action={<Button size="small" onClick={() => setRetryKey((value) => value + 1)}>Retry</Button>}
        />
      )}
      <div className={styles.courseWrapper + " px-1"}>
        <i className={`${styles.bookIcon} bi bi-book`}></i>
        <Select
          aria-label={scheduleError ? "Class schedules unavailable" : classesOptions.length ? "Select class schedule" : "No classes scheduled for this date"}
          popupClassName={styles.antSelectDrop}
          // At 113px, an empty, unlabeled-looking select next to the date picker with nothing to
          // pick from ("Select Sc...", truncated) read as a broken or pointless control on a day
          // with no classes -- there was nothing distinguishing "no options loaded yet" from "this
          // date has no classes". Disabling it and saying so directly removes the ambiguity.
          placeholder={scheduleLoading ? "Loading schedules…" : scheduleError ? "Schedules unavailable" : classesOptions.length ? "Select Schedule" : "No classes scheduled"}
          loading={scheduleLoading}
          disabled={scheduleLoading || Boolean(scheduleError) || classesOptions.length === 0}
          value={selectedClass?.value ?? selectedClass}
          style={{
            width: classesOptions.length ? "113px" : "160px",
            fontWeight: 600,
            marginTop: "0px",
            padding: "3px 0",
          }}
          onChange={(value, option) => handleClassChange(option)}
          options={classesOptions}
        />
      </div>

      <DatePicker
        aria-label="Select attendance date"
        allowClear={false}
        className="py-2"
        value={takeAttendanceDate ? dayjs(takeAttendanceDate) : null}
        placeholder="Select Date"
        onChange={(date, dateString) => {
          if (!confirmDiscardAttendanceDraft()) return;
          dispatch(
            courseAction.handleCourseData({
              key: "takeAttendanceDate",
              value: dayjs(date).format(),
            })
          );
        }}
      />
      <div className="">
        {/* <div className={styles.courseWrapper}>
        <i className={`${styles.bookIcon} bi bi-book`}></i>
        <span className={`${styles.courseType}`}>Class :</span>
        <Select
          defaultValue={selectedClass}
          style={{ width: 100, fontWeight: 600, marginTop: "0px" }}
          onChange={handleClassChange}
          options={classList}
        />
      </div> */}
        {/* <div className={styles.curDateWrapper}>
        <LeftOutlined
          onClick={prev => prevNextDateHandler("previous")}
          className={styles.leftArrow}
        />
        <span className={styles.selectedDate}>
          {moment(new Date())
            .format("DD MMM YYYY")
            .localeCompare(
              moment(new Date(takeAttendanceDate)).format("DD MMM YYYY")
            ) === 0
            ? "Today"
            : moment(takeAttendanceDate).format("DD MMMM YYYY")}
        </span>
        <RightOutlined
          onClick={prev => prevNextDateHandler("next")}
          className={styles.rightArrow}
        />
      </div> */}
        {/* <div className={styles.pipe}>|</div>
        <div className={styles.printerIcon}>
          <PrinterOutlined />
        </div> */}
      </div>
    </div>
  );
};

export default memo(TakeAttendanceHeaderFilters);
