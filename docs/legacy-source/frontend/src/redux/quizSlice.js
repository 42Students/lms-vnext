import { createSlice } from "@reduxjs/toolkit";
//admin: 1111, student: 1234, teacher: 1235
export const quizSlice = createSlice({
  name: "quiz",
  initialState: {
    refresh: false,
    loading: false,
    Edit: false,
    ExternalQuiz: false,
    QuizData: {},
    SubmissionData: [],
    DataIndex: 0,
    currentQuiz: null,
  },
  reducers: {
    handleRefresh: (state, actionObj) => {
      // const {
      //   payload: { key, value },
      // } = actionObj;
      // state.loginUser[key] = value;
      return {
        ...state,
        refresh: !state?.refresh,
      };
    },
    handleLoading: (state, actionObj) => {
      return {
        ...state,
        loading: state?.loading,
      };
    },
    setEdit: (state, actionObj) => {
      return {
        ...state,
        Edit: actionObj?.payload,
      };
    },
    setCurrentEditQuiz: (state, actionObj) => {
      return {
        ...state,
        currentQuiz: actionObj?.payload,
      };
    },
    setExternalQuiz: (state, actionObj) => {
      return {
        ...state,
        ExternalQuiz: actionObj?.payload,
      };
    },
    setIndex: (state, actionObj) => {
      return {
        ...state,
        DataIndex: actionObj?.payload,
      };
    },
    handleQuizUpadte: (state, actionObj) => {
      return {
        ...state,
        QuizData: actionObj?.payload,
      };
    },
    handleQuizSubmissionData: (state, actionObj) => {
      return {
        ...state,
        SubmissionData: actionObj?.payload,
      };
    },
    resetState: () => ({
      refresh: false, loading: false, Edit: false, ExternalQuiz: false,
      QuizData: {}, SubmissionData: [], DataIndex: 0, currentQuiz: null,
    }),
  },
});
