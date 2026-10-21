import { createSlice } from "@reduxjs/toolkit";
import dayjs from "dayjs";
var localizedFormat = require("dayjs/plugin/localizedFormat");
dayjs.extend(localizedFormat);
const initialDate = dayjs().toISOString();
export const attendanceSlice = createSlice({
  name: "attendance",
  initialState: {
    studentData: {
      date: initialDate,
      data: [],
      orgData: [],
      courses: [],
      selectedCourse: "",
      //   selectedDate: dt,
    },
    teacherData: {
      date: initialDate,
      data: [],
    },
  },
  reducers: {
    handleStudentData: (state, actionObj) => {
      const {
        payload: { key, value },
      } = actionObj;
      state.studentData[key] = value;
    },
    handleTeacherData: state => {},
    resetState: () => ({
      studentData: { date: dayjs().toISOString(), data: [], orgData: [], courses: [], selectedCourse: "" },
      teacherData: { date: dayjs().toISOString(), data: [] },
    }),
  },
});
