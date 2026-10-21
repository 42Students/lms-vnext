import { configureStore, createSlice } from "@reduxjs/toolkit";
import { attendanceSlice } from "./attendanceSlice";
import { courseSlice } from "./courseSlice";
import { loggedinUserSlice } from "./loggedinUserSlice";
import { globalSearchSlice } from "./SearchSlice";
import { sequenceSlice } from "./sequenceSlice";
import { quizSlice } from "./quizSlice";
import { appSlice } from "./appSlice";
import { contactsSlice } from "./contactsSlice";
import { interviewSlice } from "./interviewSlice";

export const loaderSlice = createSlice({
  name: "loader",
  initialState: {
    isLoading: false,
  },
  reducers: {
    showProgress: state => {
      state.isLoading = true;
    },
    hideProgress: state => {
      state.isLoading = false;
    },
  },
});

export const userSlice = createSlice({
  name: "user",
  initialState: {},
  reducers: {
    saveUser: (state, payload) => {
      return { ...state, ...payload.payload };
    },
  },
});

// config the store
const store = configureStore({
  reducer: {
    loader: loaderSlice.reducer,
    attendance: attendanceSlice.reducer,
    loginUser: loggedinUserSlice.reducer,
    course: courseSlice.reducer,
    user: userSlice.reducer,
    globalSearch: globalSearchSlice.reducer,
    sequence: sequenceSlice.reducer,
    quiz: quizSlice.reducer,
    app: appSlice.reducer,
    contacts: contactsSlice.reducer,
    interviews: interviewSlice.reducer,
  },
});

// export default the store
export default store;

// export the action
export const loaderAction = loaderSlice.actions;
export const attendanceAction = attendanceSlice.actions;
export const loginUserAction = loggedinUserSlice.actions;
export const courseAction = courseSlice.actions;
export const userAction = userSlice.actions;
export const globalSearchAction = globalSearchSlice.actions;
export const sequenceAction = sequenceSlice.actions;
export const quizAction = quizSlice.actions;
export const appAction = appSlice.actions;
export const contactsAction = contactsSlice.actions;
export const interviewAction = interviewSlice.actions;

// Dispatch this on logout to wipe all user-scoped state from Redux
export const clearAllUserState = (orgPayload) => (dispatch) => {
  dispatch(loginUserAction.clearUser(orgPayload));
  dispatch(attendanceAction.resetState());
  dispatch(courseAction.resetState());
  dispatch(quizAction.resetState());
  dispatch(appAction.resetState());
  dispatch(contactsAction.resetState());
  dispatch(globalSearchAction.resetState());
  dispatch(sequenceAction.resetState());
  dispatch(interviewAction.resetState());
};
