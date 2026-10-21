import { createSlice } from "@reduxjs/toolkit";
export const sequenceSlice = createSlice({
  name: "sequence",
  initialState: {
    TotalSequence: 0,
    id: 0,
    AddQuetionSequence: 0,
  },
  reducers: {
    handleSequenceData: (state, actionObj) => {
      const {
        payload: { key, value },
      } = actionObj;
      state[key] = value;
    },
    resetState: () => ({ TotalSequence: 0, id: 0, AddQuetionSequence: 0 }),
  },
});
