import moment from "moment";
let dt = new Date();
let nextDate = moment(dt).add(1, "days");
nextDate = new Date(nextDate);
nextDate = moment(nextDate).format("DD MMM YYYY");
let prevDate = moment(dt).subtract(1, "days");
prevDate = new Date(prevDate);
prevDate = moment(prevDate).format("DD MMM YYYY");
dt = moment(new Date()).format("DD MMM YYYY");

export const studentData = [
  {
    courseId: 2123,
    courseName: "UAV Estimation",
    attendanceDate: dt,
    attendanceDay: "Wednesday",
    punchTime: "04:00 pm",
    isPresent: true,
  },
  {
    courseId: 2123,
    courseName: "UAV Estimation",
    attendanceDate: dt,
    attendanceDay: "Wednesday",
    punchTime: "04:00 pm",
    isPresent: false,
  },
  {
    courseId: 2123,
    courseName: "UAV Estimation",
    attendanceDate: nextDate,
    attendanceDay: "Wednesday",
    punchTime: "04:00 pm",
    isPresent: true,
  },
  {
    courseId: 2123,
    courseName: "UAV Estimation",
    attendanceDate: dt,
    attendanceDay: "Wednesday",
    punchTime: "04:00 pm",
    isPresent: false,
  },
  {
    courseId: 2124,
    courseName: "UAV Estimation1",
    attendanceDate: prevDate,
    attendanceDay: "Wednesday",
    punchTime: "04:00 pm",
    isPresent: true,
  },
  {
    courseId: 2124,
    courseName: "UAV Estimation1",
    attendanceDate: nextDate,
    attendanceDay: "Wednesday",
    punchTime: "04:00 pm",
    isPresent: true,
  },
  {
    courseId: 2125,
    courseName: "UAV Estimation2",
    attendanceDate: dt,
    attendanceDay: "Wednesday",
    punchTime: "04:00 pm",
    isPresent: false,
  },
  {
    courseId: 2125,
    courseName: "UAV Estimation2",
    attendanceDate: dt,
    attendanceDay: "Wednesday",
    punchTime: "04:00 pm",
    isPresent: true,
  },
  {
    courseId: 2123,
    courseName: "UAV Estimation",
    attendanceDate: nextDate,
    attendanceDay: "Wednesday",
    punchTime: "04:00 pm",
    isPresent: true,
  },
  {
    courseId: 2123,
    courseName: "UAV Estimation",
    attendanceDate: prevDate,
    attendanceDay: "Wednesday",
    punchTime: "04:00 pm",
    isPresent: true,
  },
  {
    courseId: 2124,
    courseName: "UAV Estimation1",
    attendanceDate: dt,
    attendanceDay: "Wednesday",
    punchTime: "04:00 pm",
    isPresent: true,
  },
];

export const teachersData = [];
