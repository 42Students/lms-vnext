import Api from "../ApiMethod";

const LEARNER_BASE = "/api/v1/profile/learner";
const FACULTY_BASE = "/api/v1/profile/faculty";

// ==================== Learner Profile APIs ====================

// Profile Header
export const getLearnerHeader = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/header`);

export const updateLearnerHeader = (learnerId, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/header`, data);

// About Me
export const getLearnerAbout = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/about`);

export const updateLearnerAbout = (learnerId, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/about`, data);

// Personal Details
export const getLearnerPersonalDetails = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/personal-details`);

export const updateLearnerPersonalDetails = (learnerId, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/personal-details`, data);

// Identity Documents
export const getLearnerIdentity = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/identity`);

export const updateLearnerIdentity = (learnerId, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/identity`, data);

// Languages
export const getLearnerLanguages = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/languages`);

export const addLearnerLanguage = (learnerId, data) => 
  Api.post(`${LEARNER_BASE}/${learnerId}/languages`, data);

export const updateLearnerLanguage = (learnerId, index, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/languages/${index}`, data);

export const deleteLearnerLanguage = (learnerId, index) => 
  Api.delete(`${LEARNER_BASE}/${learnerId}/languages/${index}`);

// Contact Information
export const getLearnerContact = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/contact`);

export const updateLearnerContact = (learnerId, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/contact`, data);

// Address
export const getLearnerAddress = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/address`);

export const updateLearnerAddress = (learnerId, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/address`, data);

// Social Profiles
export const getLearnerSocial = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/social`);

export const updateLearnerSocial = (learnerId, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/social`, data);

// Education
export const getLearnerEducation = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/education`);

export const addLearnerEducation = (learnerId, data) => 
  Api.post(`${LEARNER_BASE}/${learnerId}/education`, data);

export const updateLearnerEducation = (learnerId, index, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/education/${index}`, data);

export const deleteLearnerEducation = (learnerId, index) => 
  Api.delete(`${LEARNER_BASE}/${learnerId}/education/${index}`);

// Education Configuration
export const getEducationConfig = () => 
  Api.get(`${LEARNER_BASE}/education/config`);

export const getGradingTypes = () => 
  Api.get(`${LEARNER_BASE}/education/grading-types`);

export const getExamConfigs = () => 
  Api.get(`${LEARNER_BASE}/education/exam-configs`);

export const getExamConfig = (examCode) => 
  Api.get(`${LEARNER_BASE}/education/exam-configs/${examCode}`);

export const getColleges = (searchQuery = null, config = {}) => {
  const url = searchQuery 
    ? `${LEARNER_BASE}/education/colleges?search=${encodeURIComponent(searchQuery)}`
    : `${LEARNER_BASE}/education/colleges`;
  return Api.get(url, config);
};

// Job Preferences
export const getLearnerJobPreferences = (learnerId) =>
  Api.get(`${LEARNER_BASE}/${learnerId}/job-preferences`);

export const updateLearnerJobPreferences = (learnerId, data) =>
  Api.put(`${LEARNER_BASE}/${learnerId}/job-preferences`, data);

// Profile Resume (default resume for job applications)
export const getLearnerResume = (learnerId) =>
  Api.get(`${LEARNER_BASE}/${learnerId}/resume`);

export const updateLearnerResume = (learnerId, data) =>
  Api.put(`${LEARNER_BASE}/${learnerId}/resume`, data);

// Certifications
export const getLearnerCertifications = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/certifications`);

export const addLearnerCertification = (learnerId, data) => 
  Api.post(`${LEARNER_BASE}/${learnerId}/certifications`, data);

export const updateLearnerCertification = (learnerId, index, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/certifications/${index}`, data);

export const deleteLearnerCertification = (learnerId, index) => 
  Api.delete(`${LEARNER_BASE}/${learnerId}/certifications/${index}`);

// Academic Achievements
export const getLearnerAchievements = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/achievements`);

export const addLearnerAchievement = (learnerId, data) => 
  Api.post(`${LEARNER_BASE}/${learnerId}/achievements`, data);

export const updateLearnerAchievement = (learnerId, index, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/achievements/${index}`, data);

export const deleteLearnerAchievement = (learnerId, index) => 
  Api.delete(`${LEARNER_BASE}/${learnerId}/achievements/${index}`);

// Skills
export const getLearnerSkills = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/skills`);

export const addLearnerSkill = (learnerId, data) => 
  Api.post(`${LEARNER_BASE}/${learnerId}/skills`, data);

export const updateLearnerSkill = (learnerId, index, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/skills/${index}`, data);

export const deleteLearnerSkill = (learnerId, index) => 
  Api.delete(`${LEARNER_BASE}/${learnerId}/skills/${index}`);

// Projects
export const getLearnerProjects = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/projects`);

export const addLearnerProject = (learnerId, data) => 
  Api.post(`${LEARNER_BASE}/${learnerId}/projects`, data);

export const updateLearnerProject = (learnerId, index, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/projects/${index}`, data);

export const deleteLearnerProject = (learnerId, index) => 
  Api.delete(`${LEARNER_BASE}/${learnerId}/projects/${index}`);

// Experiences/Internships
export const getLearnerExperiences = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/experiences`);

export const addLearnerExperience = (learnerId, data) => 
  Api.post(`${LEARNER_BASE}/${learnerId}/experiences`, data);

export const updateLearnerExperience = (learnerId, index, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/experiences/${index}`, data);

export const deleteLearnerExperience = (learnerId, index) => 
  Api.delete(`${LEARNER_BASE}/${learnerId}/experiences/${index}`);

// Extra-curricular
export const getLearnerExtracurricular = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/extracurricular`);

export const addLearnerExtracurricular = (learnerId, data) => 
  Api.post(`${LEARNER_BASE}/${learnerId}/extracurricular`, data);

export const updateLearnerExtracurricular = (learnerId, index, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/extracurricular/${index}`, data);

export const deleteLearnerExtracurricular = (learnerId, index) => 
  Api.delete(`${LEARNER_BASE}/${learnerId}/extracurricular/${index}`);

// Hobbies & Interests
export const getLearnerHobbies = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/hobbies`);

export const updateLearnerHobbies = (learnerId, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/hobbies`, data);

// ==================== Faculty Profile APIs ====================

// Profile Header
export const getFacultyHeader = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/header`);

export const updateFacultyHeader = (facultyId, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/header`, data);

// About Me
export const getFacultyAbout = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/about`);

export const updateFacultyAbout = (facultyId, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/about`, data);

// Personal Details
export const getFacultyPersonalDetails = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/personal-details`);

export const updateFacultyPersonalDetails = (facultyId, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/personal-details`, data);

// Identity Documents
export const getFacultyIdentity = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/identity`);

export const updateFacultyIdentity = (facultyId, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/identity`, data);

// Languages
export const getFacultyLanguages = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/languages`);

export const addFacultyLanguage = (facultyId, data) => 
  Api.post(`${FACULTY_BASE}/${facultyId}/languages`, data);

export const updateFacultyLanguage = (facultyId, index, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/languages/${index}`, data);

export const deleteFacultyLanguage = (facultyId, index) => 
  Api.delete(`${FACULTY_BASE}/${facultyId}/languages/${index}`);

// Contact Information
export const getFacultyContact = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/contact`);

export const updateFacultyContact = (facultyId, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/contact`, data);

// Address
export const getFacultyAddress = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/address`);

export const updateFacultyAddress = (facultyId, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/address`, data);

// Social Profiles
export const getFacultySocial = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/social`);

export const updateFacultySocial = (facultyId, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/social`, data);

// Education
export const getFacultyEducation = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/education`);

export const addFacultyEducation = (facultyId, data) => 
  Api.post(`${FACULTY_BASE}/${facultyId}/education`, data);

export const updateFacultyEducation = (facultyId, index, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/education/${index}`, data);

export const deleteFacultyEducation = (facultyId, index) => 
  Api.delete(`${FACULTY_BASE}/${facultyId}/education/${index}`);

// Certifications
export const getFacultyCertifications = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/certifications`);

export const addFacultyCertification = (facultyId, data) => 
  Api.post(`${FACULTY_BASE}/${facultyId}/certifications`, data);

export const updateFacultyCertification = (facultyId, index, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/certifications/${index}`, data);

export const deleteFacultyCertification = (facultyId, index) => 
  Api.delete(`${FACULTY_BASE}/${facultyId}/certifications/${index}`);

// Work Experience
export const getFacultyExperiences = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/experiences`);

export const addFacultyExperience = (facultyId, data) => 
  Api.post(`${FACULTY_BASE}/${facultyId}/experiences`, data);

export const updateFacultyExperience = (facultyId, index, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/experiences/${index}`, data);

export const deleteFacultyExperience = (facultyId, index) => 
  Api.delete(`${FACULTY_BASE}/${facultyId}/experiences/${index}`);

// Skills
export const getFacultySkills = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/skills`);

export const addFacultySkill = (facultyId, data) => 
  Api.post(`${FACULTY_BASE}/${facultyId}/skills`, data);

export const updateFacultySkill = (facultyId, index, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/skills/${index}`, data);

export const deleteFacultySkill = (facultyId, index) => 
  Api.delete(`${FACULTY_BASE}/${facultyId}/skills/${index}`);

// Publications & Research
export const getFacultyPublications = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/publications`);

export const addFacultyPublication = (facultyId, data) => 
  Api.post(`${FACULTY_BASE}/${facultyId}/publications`, data);

export const updateFacultyPublication = (facultyId, index, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/publications/${index}`, data);

export const deleteFacultyPublication = (facultyId, index) => 
  Api.delete(`${FACULTY_BASE}/${facultyId}/publications/${index}`);

// Awards & Recognitions
export const getFacultyAwards = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/awards`);

export const addFacultyAward = (facultyId, data) => 
  Api.post(`${FACULTY_BASE}/${facultyId}/awards`, data);

export const updateFacultyAward = (facultyId, index, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/awards/${index}`, data);

export const deleteFacultyAward = (facultyId, index) => 
  Api.delete(`${FACULTY_BASE}/${facultyId}/awards/${index}`);

// ==================== Video Intro (Learner Only) ====================
export const getLearnerVideoIntro = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/video-intro`);

export const updateLearnerVideoIntro = (learnerId, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/video-intro`, data);


// ==================== Profile Metadata ====================
// Learner Metadata
export const getLearnerMetadata = (learnerId) => 
  Api.get(`${LEARNER_BASE}/${learnerId}/metadata`);

export const updateLearnerMetadata = (learnerId, data) => 
  Api.put(`${LEARNER_BASE}/${learnerId}/metadata`, data);

// Faculty Metadata
export const getFacultyMetadata = (facultyId) => 
  Api.get(`${FACULTY_BASE}/${facultyId}/metadata`);

export const updateFacultyMetadata = (facultyId, data) => 
  Api.put(`${FACULTY_BASE}/${facultyId}/metadata`, data);
