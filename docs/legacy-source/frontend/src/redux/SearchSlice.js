import { createSlice } from "@reduxjs/toolkit";
export const globalSearchSlice = createSlice({
  name: "globalSearch",
  initialState: {},
  reducers: {
    saveSearchedCourse: (state, payload) => {
      return { ...state, ...payload.payload };
    },
    resetState: () => ({}),
  },
});
