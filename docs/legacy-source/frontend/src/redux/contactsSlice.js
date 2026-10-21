const { createSlice } = require("@reduxjs/toolkit");

export const contactsSlice = createSlice({
  name: "contacts",
  initialState: {
    selectedCourseTabIndex: "1",
  },
  reducers: {
    setContactsTabIndex: (state, actionObj) => {
      return { ...state, selectedCourseTabIndex: actionObj.payload };
    },
    resetState: () => ({ selectedCourseTabIndex: "1" }),
  },
});
