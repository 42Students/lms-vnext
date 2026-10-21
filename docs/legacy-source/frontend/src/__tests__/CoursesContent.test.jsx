import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CoursesContent from "@/components/Course/CoursesContent";
import { useSelector, useDispatch } from "react-redux";
import { getStudentCoursesBySemester, getLearnerSemesters } from "@/api/Services/SemesterService";
import { getActiveAssignmentsByFaculty } from "@/api/Services/FacultyAssignmentService";

jest.mock("next/image", () => function MockImage({ alt, src }) { return <img alt={alt} src={src} />; });
jest.mock("next/link", () => function MockLink({ children, href, onClick, ...props }) {
  return <a href={href} onClick={onClick} {...props}>{children}</a>;
});
jest.mock("react-redux", () => ({ useSelector: jest.fn(), useDispatch: jest.fn() }));
jest.mock("@/api/Services/SemesterService", () => ({
  getStudentCoursesBySemester: jest.fn(), getLearnerSemesters: jest.fn(),
}));
jest.mock("@/api/Services/FacultyAssignmentService", () => ({
  getActiveAssignmentsByFaculty: jest.fn(),
}));
jest.mock("@/redux/store", () => ({ loginUserAction: { handleUserData: jest.fn((data) => data) } }));
jest.mock("@/components/Global/ListingPageHeader/ListingPageHeader", () =>
  function MockHeader({ title, rightContent, metrics }) {
    return <header><h1>{title}</h1>{metrics}{rightContent}</header>;
  });
jest.mock("@/components/Common/PageShell", () =>
  function MockShell({ children }) { return <main>{children}</main>; });
jest.mock("@/components/Global/MetricPill/MetricPill", () =>
  function MockMetric({ label }) { return <span>{label}</span>; });
jest.mock("antd", () => {
  const Empty = ({ description }) => <div>{description}</div>;
  Empty.PRESENTED_IMAGE_SIMPLE = "simple";
  return {
    Empty,
    Tag: ({ children }) => <span>{children}</span>,
    Skeleton: () => <div>Loading</div>,
    Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
    Input: ({ value, onChange, placeholder }) =>
      <input aria-label="Search courses" placeholder={placeholder} value={value} onChange={onChange} />,
    Select: ({ value, onChange, options, "aria-label": ariaLabel, ...rest }) => <select
      aria-label={ariaLabel || "Select semester"} data-testid={rest["data-testid"]}
      value={value ?? ""} onChange={(event) => {
        const raw = event.target.value;
        const matched = options.find((option) => String(option.value) === raw);
        onChange(matched ? matched.value : raw);
      }}>
      <option value="">Select semester</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>,
    Popover: ({ children, content }) => <div>{children}{content}</div>,
  };
});

const learner = (id, collegeId = 1) => ({
  id, collegeId, organizationId: 1, classId: id + 10,
  userType: "LEARNER", isUserLoggedIn: true,
});
const faculty = (id, collegeId = 1) => ({
  id, collegeId, organizationId: 1, classId: null,
  userType: "FACULTY", isUserLoggedIn: true,
});
const courseResult = (name, semesterId = 11) => ({ data: { data: {
  semester_id: semesterId, current_semester: semesterId === 11 ? 1 : 2,
  semester_name: `Semester ${semesterId === 11 ? 1 : 2}`,
  class_id: 20, batch_id: 4, program_id: 6,
  courses: [{ id: semesterId * 10, course_name: name, slug: `course-${semesterId}` }],
} } });
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

let currentUser;
beforeEach(() => {
  currentUser = learner(10);
  useSelector.mockImplementation((selector) => selector({ loginUser: currentUser, globalSearch: {} }));
  useDispatch.mockReturnValue(jest.fn());
  getLearnerSemesters.mockResolvedValue({ data: { data: [
    { id: 11, semester_number: 1, name: "Semester 1" },
    { id: 12, semester_number: 2, name: "Semester 2" },
  ] } });
  getStudentCoursesBySemester.mockResolvedValue(courseResult("Initial Course"));
  getActiveAssignmentsByFaculty.mockResolvedValue({ data: { data: [] } });
});

test("latest Learner semester wins even when older request resolves last", async () => {
  const older = deferred();
  const newer = deferred();
  getStudentCoursesBySemester.mockImplementation((id, { semesterId }) => {
    if (semesterId === 11) return older.promise;
    if (semesterId === 12) return newer.promise;
    return Promise.resolve(courseResult("Initial Course"));
  });
  render(<CoursesContent isTeacher={false} />);
  const select = await screen.findByRole("combobox", { name: "Select semester" });
  await screen.findByText("Initial Course");
  fireEvent.change(select, { target: { value: "11" } });
  fireEvent.change(select, { target: { value: "12" } });
  await act(async () => { newer.resolve(courseResult("Newest Course", 12)); });
  expect(await screen.findByText("Newest Course")).toBeInTheDocument();
  await act(async () => { older.resolve(courseResult("Outdated Course", 11)); });
  expect(screen.getByText("Newest Course")).toBeInTheDocument();
  expect(screen.queryByText("Outdated Course")).not.toBeInTheDocument();
});

test("old account cannot repopulate courses after identity changes", async () => {
  const previous = deferred();
  getStudentCoursesBySemester.mockImplementation((id) =>
    id === 10 ? previous.promise : Promise.resolve(courseResult("Current Account Course")));
  const view = render(<CoursesContent isTeacher={false} />);
  currentUser = learner(20, 2);
  view.rerender(<CoursesContent isTeacher={false} />);
  expect(await screen.findByText("Current Account Course")).toBeInTheDocument();
  await act(async () => { previous.resolve(courseResult("Previous Account Course")); });
  expect(screen.queryByText("Previous Account Course")).not.toBeInTheDocument();
});

test("401 is an authentication error and not an empty course catalog", async () => {
  getStudentCoursesBySemester.mockRejectedValue({ response: { status: 401 } });
  render(<CoursesContent isTeacher={false} />);
  expect(await screen.findByText("Your session has expired. Please sign in again.")).toBeInTheDocument();
  expect(screen.queryByText(/No courses found for/)).not.toBeInTheDocument();
});

test("retry reloads the selected semester rather than defaulting back to current", async () => {
  let selectedCalls = 0;
  getStudentCoursesBySemester.mockImplementation((id, { semesterId }) => {
    if (semesterId === 12 && ++selectedCalls === 1) return Promise.reject({ response: { status: 500 } });
    return Promise.resolve(courseResult(semesterId === 12 ? "Recovered Course" : "Initial Course", semesterId || 11));
  });
  render(<CoursesContent isTeacher={false} />);
  const select = await screen.findByRole("combobox", { name: "Select semester" });
  await screen.findByText("Initial Course");
  fireEvent.change(select, { target: { value: "12" } });
  // A failed switch keeps the previous courses visible and offers to retry that semester.
  expect(await screen.findByText(/Could not load the selected semester/)).toBeInTheDocument();
  expect(screen.getByText("Initial Course")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("Recovered Course")).toBeInTheDocument();
  expect(getStudentCoursesBySemester.mock.calls.at(-1)[1].semesterId).toBe(12);
});

test("Faculty listing rejects a non-Faculty identity without requesting assignments", async () => {
  render(<CoursesContent isTeacher={true} basePath="/teacher" />);
  expect(await screen.findByText("Faculty access is required to view teaching assignments.")).toBeInTheDocument();
  expect(getActiveAssignmentsByFaculty).not.toHaveBeenCalled();
});

test("Faculty cards retain class context and separate repeated section names", async () => {
  currentUser = faculty(30);
  getActiveAssignmentsByFaculty.mockResolvedValue({ data: { data: [
    { id: 1, course_id: 15, course_slug: "structures", course_name: "Structures", class_id: 4, class_name: "A" },
    { id: 2, course_id: 16, course_slug: "mechanics", course_name: "Mechanics", class_id: 5, class_name: "A" },
  ] } });
  render(<CoursesContent isTeacher={true} basePath="/teacher" />);
  await waitFor(() => expect(screen.getByText("2 Sections")).toBeInTheDocument());
  expect(screen.getByRole("link", { name: /Structures/ })).toHaveAttribute("href", "/teacher/courses/structures/home?cls=4");
  expect(screen.getByRole("link", { name: /Mechanics/ })).toHaveAttribute("href", "/teacher/courses/mechanics/home?cls=5");
});

// #1: once a faculty member teaches more than one section, a filter narrows the list to one --
// with a single section there's nothing to filter, so the control must not even render.
test("faculty section filter narrows the list to one class and is absent for a single-section faculty", async () => {
  currentUser = faculty(30);
  getActiveAssignmentsByFaculty.mockResolvedValue({ data: { data: [
    { id: 1, course_id: 15, course_slug: "structures", course_name: "Structures", class_id: 4, class_name: "A" },
    { id: 2, course_id: 16, course_slug: "mechanics", course_name: "Mechanics", class_id: 5, class_name: "B" },
  ] } });
  render(<CoursesContent isTeacher={true} basePath="/teacher" />);
  const filter = await screen.findByRole("combobox", { name: "Filter by section" });
  await screen.findByText("Structures");
  expect(screen.getByText("Mechanics")).toBeInTheDocument();

  fireEvent.change(filter, { target: { value: "id:4" } });
  expect(screen.getByText("Structures")).toBeInTheDocument();
  expect(screen.queryByText("Mechanics")).not.toBeInTheDocument();

  fireEvent.change(filter, { target: { value: "all" } });
  expect(screen.getByText("Structures")).toBeInTheDocument();
  expect(screen.getByText("Mechanics")).toBeInTheDocument();
});

test("faculty section filter does not render for a faculty member teaching only one section", async () => {
  currentUser = faculty(31);
  getActiveAssignmentsByFaculty.mockResolvedValue({ data: { data: [
    { id: 1, course_id: 15, course_slug: "structures", course_name: "Structures", class_id: 4, class_name: "A" },
  ] } });
  render(<CoursesContent isTeacher={true} basePath="/teacher" />);
  await screen.findByText("Structures");
  expect(screen.queryByRole("combobox", { name: "Filter by section" })).not.toBeInTheDocument();
});

test("semester switch clears prior search while preserving latest selected courses", async () => {
  render(<CoursesContent isTeacher={false} />);
  const select = await screen.findByRole("combobox", { name: "Select semester" });
  await screen.findByText("Initial Course");
  fireEvent.change(screen.getByRole("textbox", { name: "Search courses" }), { target: { value: "nomatch" } });
  expect(screen.getByText(/No courses match/)).toBeInTheDocument();
  getStudentCoursesBySemester.mockResolvedValue(courseResult("Second Course", 12));
  fireEvent.change(select, { target: { value: "12" } });
  expect(await screen.findByText("Second Course")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Search courses" })).toHaveValue("");
});

test("semester refetch keeps current cards visible until replacement data arrives", async () => {
  const nextSemester = deferred();
  getStudentCoursesBySemester.mockImplementation((id, { semesterId }) =>
    semesterId === 12 ? nextSemester.promise : Promise.resolve(courseResult("Initial Course")));

  render(<CoursesContent isTeacher={false} />);
  const select = await screen.findByRole("combobox", { name: "Select semester" });
  await screen.findByText("Initial Course");

  fireEvent.change(select, { target: { value: "12" } });

  expect(screen.getByText("Initial Course")).toBeInTheDocument();
  expect(screen.getByText("Updating courses for the selected semester…")).toBeInTheDocument();

  await act(async () => { nextSemester.resolve(courseResult("Second Course", 12)); });

  expect(await screen.findByText("Second Course")).toBeInTheDocument();
  expect(screen.queryByText("Initial Course")).not.toBeInTheDocument();
});

test("failed semester refetch preserves previous courses and restores the confirmed semester", async () => {
  getStudentCoursesBySemester.mockImplementation((id, { semesterId }) =>
    semesterId === 12
      ? Promise.reject({ response: { status: 500 } })
      : Promise.resolve(courseResult("Initial Course")));

  render(<CoursesContent isTeacher={false} />);
  const select = await screen.findByRole("combobox", { name: "Select semester" });
  await screen.findByText("Initial Course");

  fireEvent.change(select, { target: { value: "12" } });

  expect(await screen.findByText(
    "Could not load the selected semester. Your previous courses are still shown."
  )).toBeInTheDocument();
  expect(screen.getByText("Initial Course")).toBeInTheDocument();
  expect(select).toHaveValue("11");
});

test("missing academic semester gives actionable information instead of no courses", async () => {
  getStudentCoursesBySemester.mockResolvedValue({ data: { data: {
    courses: [], class_id: 20, batch_id: 4, program_id: 6,
    configuration_status: "NO_SEMESTER",
  } } });
  render(<CoursesContent isTeacher={false} />);
  expect(await screen.findByText("Your current semester is not configured. Please contact your administrator."))
    .toBeInTheDocument();
});

test("large Faculty list mounts bounded cards until Show more is activated", async () => {
  currentUser = faculty(30);
  getActiveAssignmentsByFaculty.mockResolvedValue({ data: { data: Array.from({ length: 65 }, (_, i) => ({
    id: i + 1, course_id: i + 1, course_slug: `course-${i + 1}`,
    course_name: `Course ${i + 1}`, class_id: i + 100,
  })) } });
  render(<CoursesContent isTeacher={true} basePath="/teacher" />);
  await waitFor(() => expect(screen.getAllByTestId("teacher.courses.card.wrap")).toHaveLength(48));
  fireEvent.click(screen.getByRole("button", { name: /Show more courses/ }));
  expect(screen.getAllByTestId("teacher.courses.card.wrap")).toHaveLength(65);
});
