import { createSlice } from "@reduxjs/toolkit";
import dayjs from "dayjs";

let dt = dayjs(new Date()).format();
export const courseSlice = createSlice({
  name: "course",
  initialState: {
    currentLessonIndex: null,
    selectedCourseId: null,
    selectedCourseSlug: null,
    selectedCourseTabIndex: "1",
    attendeeCurMonth: dt,
    attendeeData: [],
    attendeeOrgData: [],
    takeAttendanceData: [],
    takeAttendanceOrgData: [],
    takeAttendanceDate: dt,
    currAdminCourse: {},
    classList: [],
    courseClassAssignments: [],
    scheduleRefreshKey: 0,
    selectedClass: null,
  },
  reducers: {
    handleCourseData: (state, actionObj) => {
      const {
        payload: { key, value },
      } = actionObj;
      return { ...state, [key]: value };
    },
    setAdminCourse: (state, actionObj) => {
      return { ...state, currAdminCourse: actionObj.payload };
    },
    setCourseTabIndex: (state, actionObj) => {
      return { ...state, selectedCourseTabIndex: actionObj.payload };
    },
    setCurrentLessonIndex: (state, actionObj) => {
      return { ...state, currentLessonIndex: actionObj.payload };
    },
    resetState: () => {
      const dt = dayjs(new Date()).format();
      return {
        currentLessonIndex: null, selectedCourseId: null, selectedCourseSlug: null,
        selectedCourseTabIndex: "1", attendeeCurMonth: dt, attendeeData: [],
        attendeeOrgData: [], takeAttendanceData: [], takeAttendanceOrgData: [],
        takeAttendanceDate: dt, currAdminCourse: {}, classList: [],
        courseClassAssignments: [], scheduleRefreshKey: 0, selectedClass: null,
      };
    },
  },
});
