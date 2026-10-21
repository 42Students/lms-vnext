import { courseAction } from "@/redux/store";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Empty, Input, Spin, Table, message, Modal } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import NameWithDp from "./NameWithDp";
import AbsentPresntBtnCol from "./AbsentPresntBtnCol";
import {
  getStudentAttendanceByDaterange,
  getStudentsListbyClassid,
  markStudentAbsent,
  markBulkAttendance as submitBulkAttendance,
  removeStudentAbsent,
  scheduleClass,
} from "@/api/Services/attendanceServices";
import SheduleClassDrawer from "@/components/Global/Offcanvas/Attendance/SheduleClassDrawer";
import CustomButton from "@/components/Global/Button/button";
import dayjs from "dayjs";
import Router from "next/router";
const TakeAttendance = () => {
  const dispatch = useDispatch();
  const [takeAtndnceDisplayData, setTakeAtndnceDisplayData] = useState([]);
  const loginUser = useSelector(state => state.loginUser);
  const course = useSelector(state => state.course);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attendanceConfirm, setAttendanceConfirm] = useState(null);
  const [attendanceSubmitError, setAttendanceSubmitError] = useState(null);
  const attendanceSubmitRef = useRef(false);
  const [scheduling, setScheduling] = useState(false);
  const schedulingRef = useRef(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataLoadError, setDataLoadError] = useState(null);
  const [nameFilter, setNameFilter] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const key = "updatable";
  const {
    takeAttendanceData,
    selectedClass,
    takeAttendanceDate,
    selectedCourseId,
    selectedCourseSlug,
    takeAttendanceDirty,
  } = useSelector(state => state.course);
  // const [absentes, setAbsentes] = useState([]);

  useEffect(() => {
    if (!takeAttendanceDirty || typeof window === "undefined") return undefined;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard your unsaved attendance changes?")) {
        dispatch(courseAction.handleCourseData({ key: "takeAttendanceDirty", value: false }));
        return;
      }
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve unsaved attendance changes.";
    };
    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [dispatch, takeAttendanceDirty]);

  const columns = [
    {
      title: "Student Name",
      dataIndex: "name",
      width: "50%",
      //   ...getColumnSearchProps("name"),
    },
    {
      title: "Status",
      dataIndex: "isAbsent",
      width: "50%",
      //   ...getColumnSearchProps("Type"),
    },
    // {
    //   title: "Absent",
    //   dataIndex: "absentCount",
    //   width: "15%",
    //   //   sorter: (a, b) => a.Created.length - b.Created.length,
    //   //   sortDirections: ["descend", "ascend"],
    // },
  ];
  const attendanceList = Array.isArray(takeAttendanceData) ? takeAttendanceData : [];
  const absentCount = attendanceList.filter(student => student?.isAbsent).length;
  const presentCount = Math.max(attendanceList.length - absentCount, 0);
  const selectedScheduleStart = selectedClass?.startTime ? dayjs(selectedClass.startTime) : null;
  const selectedScheduleEnd = selectedClass?.endTime ? dayjs(selectedClass.endTime) : null;

  useEffect(() => {
    let cancelled = false;
    const classScheduleId = selectedClass?.value ?? selectedClass;
    if (!classScheduleId) {
      // Switching courses briefly clears selectedClass while the new course's schedule options
      // load — without this, the table kept showing the previous course's roster/absences until
      // the new class resolved.
      setDataLoading(false);
      setDataLoadError(null);
      dispatch(courseAction.handleCourseData({ key: "takeAttendanceData", value: [] }));
      return () => { cancelled = true; };
    }
    setDataLoading(true);
    setDataLoadError(null);
    getStudentsListbyClassid({ classScheduleId })
      .then(res => {
        if (cancelled) return;
        const studentRows = Array.isArray(res?.data) ? res.data : [];
        const classId = selectedClass?.classId != null ? Number(selectedClass.classId) : Number(loginUser?.classId);
        const params = {
          classId,
          startDate: dayjs(takeAttendanceDate).format("YYYY-MM-DD"),
          endDate: dayjs(takeAttendanceDate).format("YYYY-MM-DD"),
          facultyId: Number(loginUser?.id),
        };
        if (selectedCourseSlug) params.courseSlug = selectedCourseSlug;
        else if (selectedCourseId) params.courseId = Number(selectedCourseId);
        return getStudentAttendanceByDaterange(params).then(resData => {
          if (cancelled) return;
          const absentees = Array.isArray(resData?.absentees)
            ? resData.absentees
            : [];
          const absentByStudentId = new Map(
            absentees.map(a => [
              String(a.studentId),
              Array.isArray(a.absent) ? a.absent : [],
            ])
          );
          const studentList = studentRows.map(student => ({
            ...student,
            isAbsent:
              absentByStudentId
                .get(String(student.learner_id))
                ?.includes(classScheduleId) ?? false,
          }));
          dispatch(
            courseAction.handleCourseData({
              key: "takeAttendanceData",
              value: studentList,
            })
          );
        });
      })
      .catch((error) => {
        if (cancelled) return;
        const errorMessage = error?.response?.data?.message || "Failed to load students or attendance.";
        setDataLoadError(errorMessage);
        dispatch(
          courseAction.handleCourseData({
            key: "takeAttendanceData",
            value: [],
          })
        );
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedClass?.value, takeAttendanceDate, selectedCourseId, selectedCourseSlug, loginUser?.id, refreshKey]);

  useEffect(() => {
    const list = Array.isArray(takeAttendanceData) ? takeAttendanceData : [];
    if (list.length === 0) {
      setTakeAtndnceDisplayData([]);
      return;
    }
    const term = nameFilter.trim().toLowerCase();
    const visible = term
      ? list.filter(student =>
          [student?.first_name, student?.last_name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(term)
        )
      : list;
    const tempData = visible.map((student, i) => ({
      key: i,
      name: <NameWithDp student={student} />,
      isAbsent: (
        <AbsentPresntBtnCol
          attendanceStd={student}
          handleAttendanceButtonClick={(stu, change) => {
            handleAttendanceButtonClick(student, change);
          }}
        />
      ),
    }));
    setTakeAtndnceDisplayData(tempData);
  }, [takeAttendanceData, nameFilter]);

  return (
    <div>
      {contextHolder}
      {openDrawer && (
        <SheduleClassDrawer
          open={openDrawer}
          onClose={() => setOpenDrawer(false)}
          submitting={scheduling}
          onApply={formParams => {
            if (schedulingRef.current) return;
            let courseIdNum = null;
            if (selectedCourseSlug) {
              courseIdNum = undefined;
            } else if (selectedCourseId && !isNaN(Number(selectedCourseId))) {
              courseIdNum = Number(selectedCourseId);
            }
            const params = {
              faculty_id: Number(loginUser?.id),
              class_id: Number(loginUser?.classId),
              start_time: getCombinedDate(formParams?.startTime, formParams?.date),
              end_time: getCombinedEndDate(formParams?.startTime, formParams?.endTime, formParams?.date),
            };
            if (selectedCourseSlug) {
              params.course_slug = selectedCourseSlug;
            } else if (courseIdNum != null) {
              params.course_id = courseIdNum;
            }
            schedulingRef.current = true;
            setScheduling(true);
            scheduleClass(params)
              .then(res => {
                if (res?.data) {
                  messageApi.open({
                    type: `success`,
                    content: "Class scheduled successfully.",
                    duration: 4,
                    key,
                  });
                  dispatch(
                    courseAction.handleCourseData({
                      key: "scheduleRefreshKey",
                      value: Date.now(),
                    })
                  );
                  setOpenDrawer(false);
                }
              })
              .catch(error => {
                messageApi.open({
                  type: `error`,
                  content: error?.response?.data?.message || "Failed to schedule class.",
                  duration: 4,
                  key,
                });
              })
              .finally(() => {
                schedulingRef.current = false;
                setScheduling(false);
              });
          }}
        />
      )}
      <div className="take-attendance-view mt-3">
        {dataLoading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spin size="large" />
          </div>
        ) : dataLoadError ? (
          <Alert
            type="error"
            showIcon
            message="Could not load the attendance roster"
            description={dataLoadError}
            action={<Button size="small" onClick={() => setRefreshKey((value) => value + 1)}>Retry</Button>}
          />
        ) : Array.isArray(takeAtndnceDisplayData) &&
        takeAtndnceDisplayData.length > 0 ? (
          <div className="take-attendance-panel">
            <div className="take-attendance-panel__header">
              <div>
                <span>Attendance Session</span>
                <h3>
                  {selectedScheduleStart
                    ? dayjs(selectedScheduleStart).format("ddd, D MMM YYYY")
                    : "Selected schedule"}
                </h3>
                <p>
                  {selectedScheduleStart
                    ? `${selectedScheduleStart.format("hh:mm A")}${selectedScheduleEnd ? ` - ${selectedScheduleEnd.format("hh:mm A")}` : ""}`
                    : "Select a scheduled class to mark attendance."}
                </p>
              </div>
              <div className="take-attendance-panel__header-actions">
                {/* Marking attendance is no longer time-gated -- a faculty member can schedule a
                    class and mark it whenever suits them, so this always reads "Ready to mark"
                    instead of branching on whether the scheduled start time has passed. */}
                <div className="take-attendance-panel__status">Ready to mark</div>
                {/* The "Schedule Class" button previously only existed inside the empty state
                    below, so once any session existed for the selected date there was no way to
                    add a second one later that same day — even though the backend only rejects
                    genuinely overlapping time slots, not a second session after the first ends. */}
                <CustomButton
                  title={"Schedule Class"}
                  buttonType={"primaryTrans"}
                  onClick={() => setOpenDrawer(true)}
                />
              </div>
            </div>
            <div className="take-attendance-panel__summary" aria-label="Attendance marking summary">
              <span><strong>{attendanceList.length}</strong> Students</span>
              <span><strong>{presentCount}</strong> Present</span>
              <span><strong>{absentCount}</strong> Absent</span>
            </div>
            <div className="take-attendance-panel__tools">
              <Input
                allowClear
                size="middle"
                prefix={<SearchOutlined />}
                placeholder="Find a student by name"
                aria-label="Find a student by name"
                value={nameFilter}
                onChange={event => setNameFilter(event.target.value)}
                className="take-attendance-panel__search"
              />
              <div className="take-attendance-panel__bulk">
                <Button
                  size="small"
                  disabled={attendanceList.length === 0}
                  onClick={() => setAllAttendance(false)}
                >
                  Mark all present
                </Button>
                <Button
                  size="small"
                  disabled={attendanceList.length === 0}
                  onClick={() => setAllAttendance(true)}
                >
                  Mark all absent
                </Button>
              </div>
            </div>
            <Table
              className="ln-table ln-table-filter px-0"
              scroll={{ x: "500px", y: 420 }}
              columns={columns}
              dataSource={takeAtndnceDisplayData}
              pagination={false}
            />
            {/* Was a plain button below all 60 rows, so submitting required scrolling the
                entire roster. */}
            <div className="take-attendance-panel__submit">
              <span className="take-attendance-panel__submit-hint">
                {absentCount} absent · {presentCount} present
              </span>
              <CustomButton
                title={submitting ? "Submitting…" : "Submit Attendance"}
                buttonType={"primary"}
                onClick={markBulkAttendance}
                disabled={submitting}
                loading={submitting}
              />
            </div>
          </div>
        ) : (
          <Empty description="No class scheduled for this date">
            <CustomButton
              title={"Schedule Class"}
              buttonType={"primaryTrans"}
              styleClass={"m-auto"}
              onClick={() => setOpenDrawer(true)}
            />
          </Empty>
        )}
      </div>

      <Modal
        open={Boolean(attendanceConfirm)}
        title="Submit Attendance"
        onOk={performBulkAttendance}
        onCancel={() => {
          if (submitting) return;
          setAttendanceConfirm(null);
          setAttendanceSubmitError(null);
        }}
        okText={submitting ? "Submitting…" : "Confirm"}
        cancelText="Cancel"
        confirmLoading={submitting}
        okButtonProps={{ disabled: submitting }}
        cancelButtonProps={{ disabled: submitting }}
        closable={!submitting}
        maskClosable={!submitting}
        keyboard={!submitting}
        destroyOnClose
        rootClassName="ln-confirm-modal-root"
      >
        {attendanceConfirm ? (
          <>
            <p>
              Mark {attendanceConfirm.absentStudentIds.length} {attendanceConfirm.absentStudentIds.length === 1 ? "student" : "students"} absent
              {" "}and {attendanceConfirm.presentStudentIds.length} {attendanceConfirm.presentStudentIds.length === 1 ? "student" : "students"} present?
            </p>
            {attendanceSubmitError ? (
              <Alert
                type={attendanceSubmitError.partial ? "warning" : "error"}
                showIcon
                message={attendanceSubmitError.partial ? "Attendance was only partially saved" : "Attendance was not saved"}
                description={attendanceSubmitError.message}
              />
            ) : null}
          </>
        ) : null}
      </Modal>
    </div>
  );

  function markAttendance(std, action) {
    const list = Array.isArray(takeAttendanceData) ? takeAttendanceData : [];
    if (list.length === 0) return list;
    return list.map(s => {
      const obj = { ...s };
      if (s.learner_id === std.learner_id) {
        obj.isAbsent = action === "present" ? false : true;
      }
      return obj;
    });
  }

  function handleAttendanceButtonClick(std, action) {
    const updatedData = markAttendance(std, action);
    dispatch(
      courseAction.handleCourseData({
        key: "takeAttendanceData",
        value: updatedData,
      })
    );
    dispatch(courseAction.handleCourseData({ key: "takeAttendanceDirty", value: true }));
  }


  /** Mark every student in the class at once — for a cancelled session, or as a starting point
   *  before flipping the handful of exceptions. */
  function setAllAttendance(isAbsent) {
    const list = Array.isArray(takeAttendanceData) ? takeAttendanceData : [];
    if (list.length === 0) return;
    dispatch(
      courseAction.handleCourseData({
        key: "takeAttendanceData",
        value: list.map(student => ({ ...student, isAbsent })),
      })
    );
    dispatch(courseAction.handleCourseData({ key: "takeAttendanceDirty", value: true }));
  }

  function markBulkAttendance() {
    if (submitting || attendanceSubmitRef.current) return;
    const classScheduleId = selectedClass?.value ?? selectedClass;
    if (!classScheduleId) {
      messageApi.open({
        type: "warning",
        content: "Please select a class.",
        duration: 4,
        key,
      });
      return;
    }
    const list = Array.isArray(takeAttendanceData) ? takeAttendanceData : [];
    const toMark = list.filter(std => std?.isAbsent === true);
    const toPresent = list.filter(std => std?.isAbsent === false);
    // NOTE: do NOT short-circuit when `toMark` is empty. "Nobody is absent" is not the same as
    // "nothing to save" — corrections back to present must still be persisted.
    if (toMark.length === 0 && toPresent.length === 0) {
      messageApi.open({
        type: "warning",
        content: "Nothing to submit — mark at least one student present or absent.",
        duration: 4,
        key,
      });
      return;
    }
    setAttendanceSubmitError(null);
    setAttendanceConfirm({
      classScheduleId,
      absentStudentIds: toMark.map(std => String(std.learner_id)),
      presentStudentIds: toPresent.map(std => String(std.learner_id)),
    });
  }

  async function performBulkAttendance() {
    if (!attendanceConfirm || submitting || attendanceSubmitRef.current) return;
    attendanceSubmitRef.current = true;
    setSubmitting(true);
    setAttendanceSubmitError(null);
    const request = attendanceConfirm;
    let persisted = false;
    try {
      const res = await submitBulkAttendance({
        classScheduleId: request.classScheduleId,
        absentStudentIds: request.absentStudentIds,
        presentStudentIds: request.presentStudentIds,
        reason: "Mark Absent",
      });
      const result = res?.data ?? res ?? {};
      const failedRows = Array.isArray(result.failed) ? result.failed : [];
      const fulfilled = (result.markedAbsent ?? 0) + (result.markedPresent ?? 0);
      const rejected = failedRows.length;
      persisted = rejected === 0 || fulfilled > 0;
      if (rejected === 0) {
        messageApi.open({
          type: "success",
          content: "Attendance marked successfully.",
          duration: 4,
          key,
        });
        dispatch(courseAction.handleCourseData({ key: "takeAttendanceDirty", value: false }));
        setAttendanceConfirm(null);
      } else {
        const failedIds = new Set(failedRows.map(row => String(row.studentId)));
        const failedAbsentIds = request.absentStudentIds.filter(id => failedIds.has(String(id)));
        const failedPresentIds = request.presentStudentIds.filter(id => failedIds.has(String(id)));
        const names = failedRows.slice(0, 5).map(row => row.studentName || row.studentId).join(", ");
        const more = rejected > 5 ? `, and ${rejected - 5} more` : "";
        const partial = fulfilled > 0;
        setAttendanceSubmitError({
          partial,
          message: partial
            ? `${fulfilled} recorded, ${rejected} failed (${names}${more}). This class is not marked as taken until they are saved; Retry sends only the failed students.`
            : `No attendance was saved. ${rejected} student record${rejected === 1 ? "" : "s"} failed (${names}${more}).`,
        });
        // Retry only the failed learner IDs; never replay rows that the server already accepted.
        if (failedAbsentIds.length + failedPresentIds.length > 0) {
          setAttendanceConfirm(prev => prev ? {
            ...prev,
            absentStudentIds: failedAbsentIds,
            presentStudentIds: failedPresentIds,
          } : prev);
        }
      }
    } catch (error) {
      setAttendanceSubmitError({
        partial: false,
        message: error?.response?.data?.message || error?.message || "Failed to mark attendance. Check the session and retry.",
      });
    } finally {
      attendanceSubmitRef.current = false;
      setSubmitting(false);
      // Re-read from the server once something was saved, so the grid shows persisted state. A complete failure keeps
      // the teacher's local markings for the retry (faculty audit F-025).
      if (persisted) setRefreshKey(k => k + 1);
    }
  }

  // `date` is the SheduleClassDrawer's own Date field (it used to have none, and silently
  // inherited whatever date the attendance page behind it happened to have selected). Falls back
  // to that page-level date for every other caller of getCombinedDate that isn't scheduling a class.
  function getCombinedDate(time, date) {
    return dayjs(
      `${dayjs(date ?? takeAttendanceDate).format("YYYY-MM-DD")} ${dayjs(time).format(
        "HH:mm:ss"
      )}`
    ).format("YYYY-MM-DD HH:mm:ss");
  }

  // A class that runs past midnight (e.g. 11 PM - 1 AM) has an end clock-time earlier than its
  // start clock-time; combining both with the same calendar date made the end look like it was
  // before the start. Roll the end onto the next day in that case (SheduleClassDrawer's own
  // validator already allows this, capped at 12h, so this only ever fires for a schedule it let
  // through).
  function getCombinedEndDate(startTime, endTime, date) {
    const start = dayjs(getCombinedDate(startTime, date));
    let end = dayjs(getCombinedDate(endTime, date));
    if (!end.isAfter(start)) {
      end = end.add(1, "day");
    }
    return end.format("YYYY-MM-DD HH:mm:ss");
  }
};

export default TakeAttendance;