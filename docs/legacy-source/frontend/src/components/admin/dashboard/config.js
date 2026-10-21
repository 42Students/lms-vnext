import {
  BankOutlined,
  BookOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  ApartmentOutlined,
  ReadOutlined,
  ArrowRightOutlined,
  ScheduleOutlined,
  CalendarOutlined,
  FolderOpenOutlined,
  SolutionOutlined,
  CheckSquareOutlined,
  FormOutlined,
  FileTextOutlined,
  TeamOutlined,
} from "@ant-design/icons";

// LMS-aligned palette: slate (#1e363f), teal (#26bac7), blue-slate (#266891), blue (#3b87ad), muted (#54505d)
const LMS_COLORS = {
  slate: "#1e363f",
  teal: "#26bac7",
  blueSlate: "#266891",
  blue: "#3b87ad",
  muted: "#54505d",
};

/** Quick actions for college-scoped admin (no org/college; add Jobs and Hiring Dashboard) */
export const quickActionsCollegeScoped = [
  { key: "departments", label: "Departments", icon: ApartmentOutlined, color: LMS_COLORS.slate },
  { key: "course-list", label: "Courses", icon: BookOutlined, color: LMS_COLORS.teal },
  { key: "programs", label: "Programs", icon: ReadOutlined, color: LMS_COLORS.blueSlate },
  { key: "faculty", label: "Faculty", icon: UserOutlined, color: LMS_COLORS.blue },
  { key: "students", label: "Students", icon: UsergroupAddOutlined, color: LMS_COLORS.muted },
  { key: "jobs", label: "Jobs", icon: SolutionOutlined, color: LMS_COLORS.teal },
  { key: "hiring-dashboard", label: "Hiring Dashboard", icon: TeamOutlined, color: LMS_COLORS.blueSlate },
  { key: "attendance", label: "Attendance", icon: CheckSquareOutlined, color: LMS_COLORS.slate },
  { key: "assignments", label: "Assignments", icon: FormOutlined, color: LMS_COLORS.teal },
  { key: "quizzes", label: "Quizzes", icon: FileTextOutlined, color: LMS_COLORS.blueSlate },
  { key: "people", label: "People Directory", icon: UsergroupAddOutlined, color: LMS_COLORS.blue },
];

/** College-scoped: remove org/college steps and renumber steps sequentially */
export function getSetupStepsCollegeScoped() {
  const setupStepsFull = [
    {
      phase: 1,
      phaseTitle: "Structure",
      phaseColor: LMS_COLORS.slate,
      steps: [
        { step: 1, title: "Create Departments", key: "departments", desc: "Academic departments", icon: ApartmentOutlined },
      ],
    },
    {
      phase: 2,
      phaseTitle: "Courses",
      phaseColor: LMS_COLORS.teal,
      steps: [
        { step: 2, title: "Create Courses", key: "course-list", desc: "Add the subjects you teach (needs a department)", icon: BookOutlined },
        { step: 3, title: "Add Lessons", key: "lessons", desc: "Create lessons for courses", icon: FolderOpenOutlined },
        { step: 4, title: "Add Lesson Content", key: "lesson-content", desc: "Videos, resources and live classes", icon: ReadOutlined },
      ],
    },
    {
      phase: 3,
      phaseTitle: "Academic Structure",
      phaseColor: LMS_COLORS.blueSlate,
      steps: [
        { step: 5, title: "Set up Programs", key: "programs", desc: "Degree programs (B.Tech, MBA)", icon: ReadOutlined },
        { step: 6, title: "Create Semesters", key: "semesters", desc: "Semesters within programs", icon: ScheduleOutlined },
        { step: 7, title: "Map courses to semesters", key: "semester-courses", desc: "Which courses each semester teaches", icon: BookOutlined },
        { step: 8, title: "Create Batches", key: "batches", desc: "Year batches (2024-2028)", icon: CalendarOutlined },
        { step: 9, title: "Create Classes", key: "classes", desc: "Sections within each batch (e.g. CSE - A)", icon: ScheduleOutlined },
      ],
    },
    {
      phase: 4,
      phaseTitle: "People",
      phaseColor: LMS_COLORS.blue,
      steps: [
        { step: 10, title: "Add Faculty", key: "faculty", desc: "Teaching staff accounts", icon: UserOutlined },
        { step: 11, title: "Assign Faculty", key: "faculty-assignment", desc: "Who teaches which course for which section", icon: SolutionOutlined },
        { step: 12, title: "Add Students", key: "students", desc: "Student accounts, placed in a section", icon: UsergroupAddOutlined },
      ],
    },
    {
      phase: 5,
      phaseTitle: "Lecture Halls & Jobs (Optional)",
      phaseColor: LMS_COLORS.muted,
      steps: [
        { step: 13, title: "Add Lecture Halls", key: "lecture-halls", desc: "Rooms used in the timetable", icon: BankOutlined },
        { step: 16, title: "Jobs & Placements", key: "jobs", desc: "Post and manage job openings", icon: SolutionOutlined },
      ],
    },
  ];

  const filtered = setupStepsFull.filter((phase) => phase.steps.length > 0);
  let stepNum = 1;
  return filtered.map((phase, pIndex) => ({
    ...phase,
    phase: pIndex + 1,
    steps: phase.steps.map((s) => ({ ...s, step: stepNum++ })),
  }));
}
