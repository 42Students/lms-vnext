import Api from "../ApiMethod";
import {
  fetchAllTypesAnnouncementUrl,
  getAnnouncementsForLearnerUrl,
  getNotificationsUrl,
} from "../serviceUrl";

export async function getNotifications(queryParams, options = {}) {
  return Api.get(getNotificationsUrl, { params: queryParams, signal: options.signal }).then(res => res?.data);
}

export async function fetchAllTypesAnnouncement(queryParams) {
  return Api.get(fetchAllTypesAnnouncementUrl, { params: queryParams }).then(res => res?.data);
}

/**
 * Fetch LMS announcements for the authenticated learner (college, program, class scope).
 * Returns announcements created by college admin. Merge with notifications for full feed.
 */
export async function getAnnouncementsForLearner() {
  return Api.get(getAnnouncementsForLearnerUrl)
    .then(res => {
      const data = res?.data?.data ?? res?.data ?? res;
      return Array.isArray(data) ? data : [];
    })
    .catch(() => {
      return [];
    });
}
