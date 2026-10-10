const INDIA_OFFSET_MINUTES = 5 * 60 + 30;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Attendance calendars are authored/rendered in India local time in the
 * legacy LMS. India has a fixed UTC+05:30 offset and no daylight-saving
 * transition, so month membership must not use UTC midnight boundaries.
 */
export function indiaAttendanceMonthWindow(
  month: string,
) {
  if (!MONTH_PATTERN.test(month)) {
    throw new Error(
      "Attendance month must use YYYY-MM",
    );
  }

  const [year, monthNumber] =
    month.split("-").map(Number);
  const offsetMs =
    INDIA_OFFSET_MINUTES * 60 * 1000;
  const start = new Date(
    Date.UTC(
      year!,
      monthNumber! - 1,
      1,
    ) - offsetMs,
  );
  const end = new Date(
    Date.UTC(year!, monthNumber!, 1) -
      offsetMs,
  );

  return {
    month,
    start,
    end,
  };
}
