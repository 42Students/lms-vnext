jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn(), query: {} }) }));
jest.mock("react-redux", () => ({ useSelector: jest.fn(), useDispatch: () => jest.fn() }));

const { QUIZ_COLUMNS_TEACHER, QUIZ_COLUMNS_STUDENT } = require("@/components/Quiz/Table/table");

const total = (cols) => cols.reduce((t, c) => t + parseFloat(c.width), 0);
const col = (cols, title) => cols.find((c) => c.title === title);

test("both quiz tables use exactly the full width", () => {
  expect(total(QUIZ_COLUMNS_TEACHER)).toBe(100);
  expect(total(QUIZ_COLUMNS_STUDENT)).toBe(100);
});

test("faculty: Submissions stays on one line and Actions has the room the student table has (test run, 15 Oct 2026)", () => {
  const submissions = col(QUIZ_COLUMNS_TEACHER, "Submissions");
  expect(parseFloat(submissions.width)).toBeGreaterThanOrEqual(11);
  expect(submissions.onHeaderCell().style.whiteSpace).toBe("nowrap");
  expect(col(QUIZ_COLUMNS_TEACHER, "Actions").width).toBe(col(QUIZ_COLUMNS_STUDENT, "Actions").width);
  // the columns that gave the room cut long names off with "…" instead of wrapping
  expect(col(QUIZ_COLUMNS_TEACHER, "Course").ellipsis).toBe(true);
  expect(col(QUIZ_COLUMNS_TEACHER, "Lesson").ellipsis).toBe(true);
});
