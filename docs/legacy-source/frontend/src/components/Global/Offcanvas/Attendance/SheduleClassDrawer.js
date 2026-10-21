import React from "react";
import DrawerWidget from "../../RightDrawer/DrawerWidget";
import { DatePicker, Form, Input, Modal, TimePicker, message } from "antd";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
var minMax = require("dayjs/plugin/minMax");
dayjs.extend(minMax);

function SheduleClassDrawer({ open, onClose, onApply = () => {}, submitting = false }) {
  const [form] = Form.useForm();
  const loginUser = useSelector(state => state?.loginUser);
  const takeAttendanceDate = useSelector(state => state?.course?.takeAttendanceDate);

  // Was silently inherited from whatever date was selected elsewhere on the attendance page -
  // this form had no date field of its own, so scheduling read as disconnected from any visible
  // calendar. Defaulting to that same date keeps existing behavior when nothing changes, but the
  // faculty member can now see and change it right here.
  const combineWithAttendanceDate = (timeValue, dateValue) => {
    const date = dateValue ?? takeAttendanceDate;
    if (!timeValue || !date) return null;
    return dayjs(date)
      .hour(dayjs(timeValue).hour())
      .minute(dayjs(timeValue).minute())
      .second(0)
      .millisecond(0);
  };

  const finishClose = () => {
    form.resetFields();
    onClose?.();
  };

  const requestClose = () => {
    if (submitting) {
      message.info("Wait for the class schedule to finish saving.");
      return;
    }
    if (!form.isFieldsTouched()) {
      finishClose();
      return;
    }
    Modal.confirm({
      title: "Discard class schedule changes?",
      content: "The date, time and class details in this drawer have not been scheduled yet.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: finishClose,
    });
  };

  // A class that starts late at night and ends after midnight (e.g. 11 PM - 1 AM) has an end
  // clock-time earlier than its start clock-time. Combined with the same calendar date for both,
  // the end always landed "before" the start and the form rejected every such class outright.
  // Roll the end onto the next day when that happens, capped at 12h so a genuine mistake (e.g.
  // picking AM/PM wrong) still gets rejected instead of silently becoming a day-long "class".
  const MAX_CLASS_DURATION_HOURS = 12;
  const combineEndWithRollover = (startValue, endValue, dateValue) => {
    const start = combineWithAttendanceDate(startValue, dateValue);
    let end = combineWithAttendanceDate(endValue, dateValue);
    if (!start || !end) return end;
    if (!end.isAfter(start)) {
      const rolled = end.add(1, "day");
      if (rolled.diff(start, "hour", true) <= MAX_CLASS_DURATION_HOURS) {
        end = rolled;
      }
    }
    return end;
  };
  return (
    <DrawerWidget
      title={"Schedule Class"}
      primaryButtonTitle={"Cancel"}
      secondaryButtonTitle={submitting ? "Scheduling…" : "Schedule"}
      disablePrimary={submitting}
      disableSecondary={submitting}
      primaryLoading={false}
      secondaryLoading={submitting}
      onClickPrimary={requestClose}
      onClickSecondary={() => {
        // Belt-and-suspenders: disableSecondary above already blocks the button, but a queued
        // double-click (or a click fired just before the disabled state re-renders) must not
        // fire a second scheduleClass call - that's what produced the duplicate-request
        // conflict/false "server error" this guard exists for.
        if (submitting) return;
        form.validateFields().then(values => {
          onApply(values);
        }).catch(() => {});
      }}
      drawerOpen={open}
      onClose={requestClose}
      maskClosable={false}
      closable={!submitting}
      keyboard={!submitting}
      showFooter
      footerClass={"ln-comn-foot"}
      buttonJustification={"justify-content-end"}
    >
      <Form
        form={form}
        layout="vertical"
        name="basic"
        labelCol={{
          span: 100,
        }}
        wrapperCol={{
          span: 100,
        }}
        autoComplete="off"
        disabled={submitting}
        initialValues={{
          date: takeAttendanceDate ? dayjs(takeAttendanceDate) : null,
        }}
      >
        <div className="ln-drawer-body">
          <Form.Item
            label={<label className="ln-lb2">Date</label>}
            name="date"
            rules={[
              {
                required: true,
                message: "Select Date",
              },
            ]}
          >
            {/* No longer restricted to today-or-later -- a faculty member should be able to
                schedule (and then mark) a class for a past date too, e.g. to log a session that
                already happened before they got around to entering it. */}
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label={<label className="ln-lb2">Start Time</label>}
            name="startTime"
            dependencies={["date"]}
            rules={[
              {
                type: "object",
                required: true,
                message: "Select Start Time",
              },
              // A start time already in the past used to be rejected outright, which blocked
              // exactly the "log a class that already happened" case the date field above now
              // allows for. Scheduling (and marking) a class is the faculty member's call.
            ]}
          >
            <TimePicker format={"hh:mm A"} use12Hours />
          </Form.Item>
          <Form.Item
            label={<label className="ln-lb2">End Time</label>}
            name="endTime"
            dependencies={["startTime", "date"]}
            rules={[
              {
                type: "object",
                required: true,
                message: "Select End Time",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start = getFieldValue("startTime");
                  const date = getFieldValue("date");
                  const combinedStart = combineWithAttendanceDate(start, date);
                  const combinedEnd = combineEndWithRollover(start, value, date);
                  if (!value || !start || !combinedStart || !combinedEnd) return Promise.resolve();
                  if (!combinedEnd.isAfter(combinedStart)) {
                    return Promise.reject(new Error("End time must be after start time"));
                  }
                  // Same-day spans were never capped here (11:00 AM to 11:30 PM passed), and the server
                  // then refused them with "cannot exceed 12 hours".
                  if (combinedEnd.diff(combinedStart, "minute") > MAX_CLASS_DURATION_HOURS * 60) {
                    return Promise.reject(new Error("A class can be at most 12 hours. Check AM/PM."));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <TimePicker format={"hh:mm A"} use12Hours />
          </Form.Item>
          <label className="ln-lb2">Course</label>
          <Input
            className="ln-in2 mt-2"
            value={loginUser?.selectedCourse?.name}
            disabled
          />
        </div>
      </Form>
    </DrawerWidget>
  );
}

export default SheduleClassDrawer;
