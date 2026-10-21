import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  upcoming: [],
  past: [],
  lastFetchedUpcoming: null,
  lastFetchedPast: null,
  loading: false,
  pastLoading: false,
  error: null,
};

export const interviewSlice = createSlice({
  name: "interviews",
  initialState,
  reducers: {
    setUpcoming: (state, action) => {
      state.upcoming = action.payload;
      state.lastFetchedUpcoming = Date.now();
      state.error = null;
    },
    setPast: (state, action) => {
      state.past = action.payload;
      state.lastFetchedPast = Date.now();
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setPastLoading: (state, action) => {
      state.pastLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    resetState: () => initialState,
  },
});

export const interviewAction = interviewSlice.actions;
