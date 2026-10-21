// NOTE: File is named "calenderServices" (typo). Correct spelling is "calendarServices".
// Not renamed to avoid breaking imports across the codebase.
import Api from "../ApiMethod";
import {
  getFacultyCalenderEventsUrl,
  getStudentsCalenderEventsUrl,
} from "../serviceUrl";

export async function getCalenderEvents(queryParams, isFaculty, signal) {
  const config = { params: queryParams };
  if (signal instanceof AbortSignal) config.signal = signal;
  const response = await Api.get(
    isFaculty ? getFacultyCalenderEventsUrl : getStudentsCalenderEventsUrl,
    config
  );
  return response?.data;
}
