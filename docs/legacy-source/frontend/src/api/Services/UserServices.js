import Api from "../ApiMethod";
import {
  getAllNotificationByClassIdUrl,
  getNotificationsForRecipientUrl,
  getCollegeUrl,
  getFacultyDetailsUrl,
  getStudentDetailsUrl,
  registerFacultyUrl,
  registerLearnerUrl,
} from "../serviceUrl";

export async function getFacultyDetails(queryParams) {
  return Api.get(getFacultyDetailsUrl, { params: queryParams })
    .then(res => {
      return res?.data;
    })
    .catch(error => {
      throw error;
    });
}

export async function getStudentDetails(queryParams) {
  const params =
    typeof queryParams === "number" || typeof queryParams === "string"
      ? { learnerId: queryParams }
      : queryParams;
  return Api.get(getStudentDetailsUrl, { params })
    .then(res => {
      return res?.data;
    })
    .catch(error => {
      throw error;
    });
}

export async function getCollegeDetails(queryParams) {
  return Api.get(getCollegeUrl, { params: queryParams })
    .then(res => {
      return res?.data;
    })
    .catch(error => {
      throw error;
    });
}

export async function getAllNotificationByClassId(queryParams) {
  return Api.get(getAllNotificationByClassIdUrl, { params: queryParams })
    .then(res => res?.data)
    .catch(error => {
      if (process.env.NODE_ENV !== 'production') console.error("getAllNotificationByClassId failed:", error);
      return Promise.reject(error);
    });
}

// Self-service: notifications addressed to the caller directly (not scoped to one class), e.g.
// a mentor's project-assignment notifications. Backend enforces recipientId === caller's own id.
export async function getNotificationsForRecipient(recipientId, params = {}) {
  return Api.get(getNotificationsForRecipientUrl, { params: { recipientId, ...params } })
    .then(res => res?.data)
    .catch(error => {
      if (process.env.NODE_ENV !== 'production') console.error("getNotificationsForRecipient failed:", error);
      return Promise.reject(error);
    });
}

export async function registerFaculty(payload) {
  return Api.post(registerFacultyUrl, payload)
    .then(res => {
      return { data: res?.data, success: true };
    })
    .catch(error => {
      throw new Error(error?.response?.data?.message || error?.message || "Registration failed");
    });
}

export async function getProgramDetailsByLearnerId(learnerId) {
  return Api.get("api/v1/learner/getProgramDetailsByLearnerId", { params: { learnerId } })
    .then(res => res?.data)
    .catch(error => {
      throw error;
    });
}

export async function registerLearner(payload) {
  return Api.post(registerLearnerUrl, payload)
    .then(res => {
      return { data: res?.data, success: true };
    })
    .catch(error => {
      throw new Error(error?.response?.data?.message || error?.message || "Registration failed");
    });
}
