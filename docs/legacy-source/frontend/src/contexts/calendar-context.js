import { createContext, useCallback, useState } from "react";

const INITIAL_STATE = {
  view: "week",
  date: new Date(),
  isModule: true,
  events: [],
  originalEvents: [],
  contents: [],
  originalContents: [],
  courses: [],
  originalCourses: [],
  filteredCourses: [],
};

const NOOP = () => {};
const VALID_VIEWS = new Set(["day", "week", "month"]);

const CalendarContext = createContext({
  activeCalendarState: INITIAL_STATE,
  calendarStateHandler: NOOP,
  onView: NOOP,
  onNavigate: NOOP,
  resetCalendarState: NOOP,
});

export function CalendarContextProvider({ children }) {
  const [activeCalendarState, setActiveCalendarState] = useState({ ...INITIAL_STATE });

  const viewChangeHandler = useCallback(
    (newView) => {
      if (typeof newView !== "string" || !VALID_VIEWS.has(newView)) return;
      setActiveCalendarState((prev) => ({ ...prev, view: newView }));
    },
    []
  );

  const dateChangeHandler = useCallback(
    (newDate) => {
      if (!(newDate instanceof Date) || isNaN(newDate.getTime())) return;
      setActiveCalendarState((prev) => ({ ...prev, date: newDate }));
    },
    []
  );

  const calendarStateHandler = useCallback(
    (payload) => {
      if (payload == null || typeof payload !== "object") return;
      setActiveCalendarState((prev) => ({ ...prev, ...payload }));
    },
    []
  );

  /** Reset to initial state. Call on page mount to avoid stale data from other pages. */
  const resetCalendarState = useCallback(() => {
    setActiveCalendarState({ ...INITIAL_STATE, date: new Date() });
  }, []);

  return (
    <CalendarContext.Provider
      value={{
        activeCalendarState,
        calendarStateHandler,
        onView: viewChangeHandler,
        onNavigate: dateChangeHandler,
        resetCalendarState,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export default CalendarContext;
