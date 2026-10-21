import { Alert, Row, Col, Card, Button, Popconfirm, Space, message, Upload, Typography } from "antd";
import { UploadOutlined, FilePdfOutlined } from "@ant-design/icons";
import Contacts from "./about/contacts";
import Experiences from "./about/experiences";
import Skills from "./about/skills";
import UserInfo from "./userInfo";
import Qualifications from "./about/qualifications";
import Projects from "./about/projects";
import Certifications from "./about/certifications";
import Achievements from "./about/achievements";
import Languages from "./about/languages";
import Identity from "./about/identity";
import Extracurricular from "./about/extracurricular";
import SocialProfiles from "./about/socialProfiles";
import Address from "./about/address";
import PersonalDetails from "./about/personalDetails";
import Hobbies from "./about/hobbies";
import Publications from "./about/publications";
import Awards from "./about/awards";
import Metadata from "./about/metadata";
import CardHeader from "@/components/Global/CardHeader/cardHeader";
import UploadFromLinkButton from "@/components/Global/Upload/UploadFromLinkButton";
import ProfileCompleteness from "./ProfileCompleteness";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Router from "next/router";
import { appAction } from "@/redux/store";
import { uploadFileViaPresign } from "@/utils/uploadToR2";
import * as ProfileService from "@/api/Services/ProfileService";
import { extractErrorMessage, handleValidationError } from "@/utils/errorHandlers";
import {
  isValidResumeUrl,
  validateResumeFileAsync,
} from "@/utils/resumeUploadUtils";

const { Text } = Typography;

const PROFILE_CARD_ACCENT = "#BDE9FA";


function EditButton({ onClick, disabled }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="profile-btn profile-btn--edit"
      icon={<i className="bi bi-pencil" />}
      size="middle"
    >
      Edit
    </Button>
  );
}

function AddButton({ onClick, disabled }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="profile-btn profile-btn--add"
      icon={<i className="bi bi-plus" />}
      size="middle"
    >
      Add
    </Button>
  );
}

// compact: the college-admin profile. An admin's account is a faculty record, but teaching and CV
// sections (education, skills, publications, ID documents...) mean nothing for running a college,
// so only who they are and how to reach them is shown. Nothing stored is removed.
const About = ({ userDetails, setRefresh, programName, compact = false }) => {
  const loginUser = useSelector(state => state.loginUser);
  const dispatch = useDispatch();
  const useFacultyApis = loginUser?.userType === "FACULTY";
  const isFacultyProfileSchema = useFacultyApis; // Used for conditional rendering/labels (faculty-shaped profile schema, incl. college-admin)
  const userId = userDetails?.id;
  
  const [messageApi, contextHolder] = message.useMessage();
  
  // State for all sections
  const [skillsEdit, setSkillsEdit] = useState(false);
  const [contactsEdit, setContactsEdit] = useState(false);
  const [socialEdit, setSocialEdit] = useState(false);
  const [addressEdit, setAddressEdit] = useState(false);
  const [personalDetailsEdit, setPersonalDetailsEdit] = useState(false);
  const [identityEdit, setIdentityEdit] = useState(false);
  
  const [experienceParams, setExperienceParams] = useState({ editClicked: false, addClicked: false });
  const [qualificationParams, setQualificationParams] = useState({ editClicked: false, addClicked: false });
  const [projectParams, setProjectParams] = useState({ editClicked: false, addClicked: false });
  const [certificationParams, setCertificationParams] = useState({ editClicked: false, addClicked: false });
  const [achievementParams, setAchievementParams] = useState({ editClicked: false, addClicked: false });
  const [languageParams, setLanguageParams] = useState({ editClicked: false, addClicked: false });
  const [activityParams, setActivityParams] = useState({ editClicked: false, addClicked: false });
  const [publicationParams, setPublicationParams] = useState({ editClicked: false, addClicked: false });
  const [awardParams, setAwardParams] = useState({ editClicked: false, addClicked: false });
  const [hobbiesEdit, setHobbiesEdit] = useState(false);
  const [metadataEdit, setMetadataEdit] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const resumeMutationRef = useRef(false);
  const [sectionLoadErrors, setSectionLoadErrors] = useState([]);

  const hasOpenProfileDraft =
    skillsEdit || contactsEdit || socialEdit || addressEdit || personalDetailsEdit || identityEdit ||
    hobbiesEdit || metadataEdit ||
    Object.values(experienceParams).some(Boolean) ||
    Object.values(qualificationParams).some(Boolean) ||
    Object.values(projectParams).some(Boolean) ||
    Object.values(certificationParams).some(Boolean) ||
    Object.values(achievementParams).some(Boolean) ||
    Object.values(languageParams).some(Boolean) ||
    Object.values(activityParams).some(Boolean) ||
    Object.values(publicationParams).some(Boolean) ||
    Object.values(awardParams).some(Boolean);

  useEffect(() => {
    if (!hasOpenProfileDraft) return undefined;

    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard your unsaved profile changes?")) return;
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) {
        window.history.pushState(null, "", Router.asPath);
      }
      // Next has no explicit cancellation API; throwing from routeChangeStart aborts navigation.
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve unsaved profile changes.";
    };

    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [hasOpenProfileDraft]);

  // Data states
  const [experiences, setExperiences] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [extracurricular, setExtracurricular] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [publications, setPublications] = useState([]);
  const [awards, setAwards] = useState([]);
  const [social, setSocial] = useState({});
  const [address, setAddress] = useState({});
  const [personalDetails, setPersonalDetails] = useState({});
  const [identity, setIdentity] = useState({});
  const [contact, setContact] = useState({});
  const [metadata, setMetadata] = useState({});

  // Tracks whether this instance is still mounted/current userId, so async callers other than the
  // mount effect below (e.g. handleSkillsUpdate's post-mutation reload) can also guard against
  // setting state after unmount / a userId change.
  const isCancelledRef = useRef(() => false);

  // Load data on mount — stale-request guard prevents older fetches from overwriting newer ones
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const isCancelled = () => cancelled;
    isCancelledRef.current = isCancelled;
    loadAllData(isCancelled);
    return () => { cancelled = true; };
  }, [userId]);

  const loadAllData = async (isCancelled = () => false) => {
    // A rejected section is unknown profile state, not an empty section. Keep any last-known-good
    // value in place and tell the user which sections are incomplete instead of replacing them
    // with [] / {} and making a transport failure look like "you have no data here".
    const fromResult = (result, fallback) =>
      result?.status === "fulfilled" ? (result.value?.data?.data ?? fallback) : undefined;
    const applyResult = (result, fallback, setter) => {
      const value = fromResult(result, fallback);
      if (value !== undefined) setter(value);
    };
    const failures = [];
    const recordFailures = (results, labels) => {
      results.forEach((result, index) => {
        if (result?.status === "rejected") failures.push(labels[index]);
      });
    };

    if (!isCancelled()) setSectionLoadErrors([]);

    // Use allSettled so one failing endpoint does not blank out the full profile page.
    const baseLabels = [
      "Experience", "Education", "Skills", "Social profiles", "Address", "Personal details",
      "Identity documents", "Contacts", "Languages", "Certifications", "Additional information",
    ];
    const baseResults = await Promise.allSettled([
      useFacultyApis ? ProfileService.getFacultyExperiences(userId) : ProfileService.getLearnerExperiences(userId),
      useFacultyApis ? ProfileService.getFacultyEducation(userId) : ProfileService.getLearnerEducation(userId),
      useFacultyApis ? ProfileService.getFacultySkills(userId) : ProfileService.getLearnerSkills(userId),
      useFacultyApis ? ProfileService.getFacultySocial(userId) : ProfileService.getLearnerSocial(userId),
      useFacultyApis ? ProfileService.getFacultyAddress(userId) : ProfileService.getLearnerAddress(userId),
      useFacultyApis ? ProfileService.getFacultyPersonalDetails(userId) : ProfileService.getLearnerPersonalDetails(userId),
      useFacultyApis ? ProfileService.getFacultyIdentity(userId) : ProfileService.getLearnerIdentity(userId),
      useFacultyApis ? ProfileService.getFacultyContact(userId) : ProfileService.getLearnerContact(userId),
      useFacultyApis ? ProfileService.getFacultyLanguages(userId) : ProfileService.getLearnerLanguages(userId),
      useFacultyApis ? ProfileService.getFacultyCertifications(userId) : ProfileService.getLearnerCertifications(userId),
      useFacultyApis ? ProfileService.getFacultyMetadata(userId) : ProfileService.getLearnerMetadata(userId),
    ]);

    if (isCancelled()) return;
    recordFailures(baseResults, baseLabels);

    applyResult(baseResults[0], [], setExperiences);
    applyResult(baseResults[1], [], setQualifications);
    applyResult(baseResults[2], [], setSkills);
    applyResult(baseResults[3], {}, setSocial);
    applyResult(baseResults[4], {}, setAddress);
    applyResult(baseResults[5], {}, setPersonalDetails);
    applyResult(baseResults[6], {}, setIdentity);
    applyResult(baseResults[7], {}, setContact);
    applyResult(baseResults[8], [], setLanguages);
    applyResult(baseResults[9], [], setCertifications);
    applyResult(baseResults[10], {}, setMetadata);

    // Learner-only sections
    if (!useFacultyApis) {
      const learnerLabels = ["Projects", "Achievements", "Extracurricular activities", "Hobbies"];
      const learnerResults = await Promise.allSettled([
        ProfileService.getLearnerProjects(userId),
        ProfileService.getLearnerAchievements(userId),
        ProfileService.getLearnerExtracurricular(userId),
        ProfileService.getLearnerHobbies(userId),
      ]);
      if (isCancelled()) return;
      recordFailures(learnerResults, learnerLabels);
      applyResult(learnerResults[0], [], setProjects);
      applyResult(learnerResults[1], [], setAchievements);
      applyResult(learnerResults[2], [], setExtracurricular);
      applyResult(learnerResults[3], [], setHobbies);
    }

    // Faculty-only sections
    if (useFacultyApis) {
      const facultyLabels = ["Publications", "Awards"];
      const facultyResults = await Promise.allSettled([
        ProfileService.getFacultyPublications(userId),
        ProfileService.getFacultyAwards(userId),
      ]);
      if (isCancelled()) return;
      recordFailures(facultyResults, facultyLabels);
      applyResult(facultyResults[0], [], setPublications);
      applyResult(facultyResults[1], [], setAwards);
    }

    if (isCancelled()) return;
    setSectionLoadErrors(Array.from(new Set(failures)));
    if (failures.length === baseResults.length) {
      message.error("Failed to load profile data. Please refresh the page.");
    }
  };

  const showSuccess = (msg = "Updated successfully!") => {
    messageApi.open({ type: "success", content: msg, duration: 2 });
    // Dispatch event to refresh sidebar profile completeness
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  };

  const showError = (msg = "Error updating. Please try again.") => {
    messageApi.open({ type: "error", content: msg, duration: 4 });
  };

  // Helper to handle profile update errors with proper message extraction
  const handleError = (error, sectionName = "Profile") => {
    // Try to show validation error dialog for important validation messages.
    // Returning false is part of the profile-editor contract: callers keep the editor open and
    // preserve local values when a recoverable save fails.
    if (handleValidationError(error, sectionName)) {
      return false;
    }
    // Fall back to simple error toast with extracted message
    const errorMsg = extractErrorMessage(error);
    showError(errorMsg);
    return false;
  };

  // Handler functions for each section
  const handleExperienceAdd = async (data) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.addFacultyExperience(userId, data)
        : await ProfileService.addLearnerExperience(userId, data);
      setExperiences(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Experience"); }
  };

  const handleExperienceUpdate = async (index, data) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.updateFacultyExperience(userId, index, data)
        : await ProfileService.updateLearnerExperience(userId, index, data);
      setExperiences(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Experience"); }
  };

  const handleExperienceDelete = async (index) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.deleteFacultyExperience(userId, index)
        : await ProfileService.deleteLearnerExperience(userId, index);
      setExperiences(res?.data?.data || []);
      showSuccess("Deleted successfully!");
    } catch (e) { return handleError(e, "Experience"); }
  };

  const handleEducationAdd = async (data) => {
    try {
      const res = isFacultyProfileSchema
        ? await ProfileService.addFacultyEducation(userId, data)
        : await ProfileService.addLearnerEducation(userId, data);
      setQualifications(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Education"); }
  };

  const handleEducationUpdate = async (index, data) => {
    try {
      const res = isFacultyProfileSchema
        ? await ProfileService.updateFacultyEducation(userId, index, data)
        : await ProfileService.updateLearnerEducation(userId, index, data);
      setQualifications(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Education"); }
  };

  const handleEducationDelete = async (index) => {
    try {
      const res = isFacultyProfileSchema
        ? await ProfileService.deleteFacultyEducation(userId, index)
        : await ProfileService.deleteLearnerEducation(userId, index);
      setQualifications(res?.data?.data || []);
      showSuccess("Deleted successfully!");
    } catch (e) { return handleError(e, "Education"); }
  };

  const handleSkillsUpdate = async (skillsData) => {
    try {
      // Build flat SkillDTO per item: { skill: string, proficiency: string }
      const toSkillDto = (item) => {
        if (typeof item === "string") return { skill: item, proficiency: "Intermediate" };
        return { skill: item?.skill ?? "", proficiency: item?.proficiency || "Intermediate" };
      };
      const originalCount = skills.length;
      for (let i = 0; i < skillsData.length; i++) {
        const payload = toSkillDto(skillsData[i]);
        if (i < originalCount) {
          // Existing skill — update by index
          isFacultyProfileSchema
            ? await ProfileService.updateFacultySkill(userId, i, payload)
            : await ProfileService.updateLearnerSkill(userId, i, payload);
        } else {
          // New skill — add via POST
          isFacultyProfileSchema
            ? await ProfileService.addFacultySkill(userId, payload)
            : await ProfileService.addLearnerSkill(userId, payload);
        }
      }
      // Delete trailing skills that were removed in UI. Delete from the end so indexes stay stable.
      if (skillsData.length < originalCount) {
        for (let i = originalCount - 1; i >= skillsData.length; i--) {
          if (isFacultyProfileSchema) {
            await ProfileService.deleteFacultySkill(userId, i);
          } else {
            await ProfileService.deleteLearnerSkill(userId, i);
          }
        }
      }
      showSuccess();
      loadAllData(isCancelledRef.current);
      return true;
    } catch (e) {
      handleError(e, "Skills");
      // Keep the editor's local values intact after a failed multi-write. Reloading here replaced
      // the user's unsaved skills with the server snapshot even though Save failed.
      return false;
    }
  };

  const handleProjectAdd = async (data) => {
    try {
      const res = await ProfileService.addLearnerProject(userId, data);
      setProjects(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Project"); }
  };

  const handleProjectUpdate = async (index, data) => {
    try {
      const res = await ProfileService.updateLearnerProject(userId, index, data);
      setProjects(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Project"); }
  };

  const handleProjectDelete = async (index) => {
    try {
      const res = await ProfileService.deleteLearnerProject(userId, index);
      setProjects(res?.data?.data || []);
      showSuccess("Deleted successfully!");
    } catch (e) { return handleError(e, "Project"); }
  };

  const handleCertificationAdd = async (data) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.addFacultyCertification(userId, data)
        : await ProfileService.addLearnerCertification(userId, data);
      setCertifications(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Certification"); }
  };

  const handleCertificationUpdate = async (index, data) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.updateFacultyCertification(userId, index, data)
        : await ProfileService.updateLearnerCertification(userId, index, data);
      setCertifications(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Certification"); }
  };

  const handleCertificationDelete = async (index) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.deleteFacultyCertification(userId, index)
        : await ProfileService.deleteLearnerCertification(userId, index);
      setCertifications(res?.data?.data || []);
      showSuccess("Deleted successfully!");
    } catch (e) { return handleError(e, "Certification"); }
  };

  const handleAchievementAdd = async (data) => {
    try {
      const res = await ProfileService.addLearnerAchievement(userId, data);
      setAchievements(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Achievement"); }
  };

  const handleAchievementUpdate = async (index, data) => {
    try {
      const res = await ProfileService.updateLearnerAchievement(userId, index, data);
      setAchievements(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Achievement"); }
  };

  const handleAchievementDelete = async (index) => {
    try {
      const res = await ProfileService.deleteLearnerAchievement(userId, index);
      setAchievements(res?.data?.data || []);
      showSuccess("Deleted successfully!");
    } catch (e) { return handleError(e, "Achievement"); }
  };

  const handleLanguageAdd = async (data) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.addFacultyLanguage(userId, data)
        : await ProfileService.addLearnerLanguage(userId, data);
      setLanguages(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Language"); }
  };

  const handleLanguageUpdate = async (index, data) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.updateFacultyLanguage(userId, index, data)
        : await ProfileService.updateLearnerLanguage(userId, index, data);
      setLanguages(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Language"); }
  };

  const handleLanguageDelete = async (index) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.deleteFacultyLanguage(userId, index)
        : await ProfileService.deleteLearnerLanguage(userId, index);
      setLanguages(res?.data?.data || []);
      showSuccess("Deleted successfully!");
    } catch (e) { return handleError(e, "Language"); }
  };

  const handleExtracurricularAdd = async (data) => {
    try {
      const res = await ProfileService.addLearnerExtracurricular(userId, data);
      setExtracurricular(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Activity"); }
  };

  const handleExtracurricularUpdate = async (index, data) => {
    try {
      const res = await ProfileService.updateLearnerExtracurricular(userId, index, data);
      setExtracurricular(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Activity"); }
  };

  const handleExtracurricularDelete = async (index) => {
    try {
      const res = await ProfileService.deleteLearnerExtracurricular(userId, index);
      setExtracurricular(res?.data?.data || []);
      showSuccess("Deleted successfully!");
    } catch (e) { return handleError(e, "Activity"); }
  };

  const handleSocialUpdate = async (data) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.updateFacultySocial(userId, data)
        : await ProfileService.updateLearnerSocial(userId, data);
      setSocial(res?.data?.data || {});
      showSuccess();
      return true;
    } catch (e) { handleError(e, "Social Profile"); return false; }
  };

  const handleAddressUpdate = async (data) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.updateFacultyAddress(userId, data)
        : await ProfileService.updateLearnerAddress(userId, data);
      setAddress(res?.data?.data || {});
      showSuccess();
      return true;
    } catch (e) { handleError(e, "Address"); return false; }
  };

  const handlePersonalDetailsUpdate = async (data) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.updateFacultyPersonalDetails(userId, data)
        : await ProfileService.updateLearnerPersonalDetails(userId, data);
      setPersonalDetails(res?.data?.data || {});
      showSuccess();
      return true;
    } catch (e) { handleError(e, "Personal Details"); return false; }
  };

  const handleIdentityUpdate = async (data) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.updateFacultyIdentity(userId, data)
        : await ProfileService.updateLearnerIdentity(userId, data);
      setIdentity(res?.data?.data || {});
      showSuccess();
      return true;
    } catch (e) { handleError(e, "Identity"); return false; }
  };

  // Helper to extract R2 key from URL
  const extractR2KeyFromUrl = (url) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      // Remove leading slash from pathname
      return urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
    } catch {
      // If URL parsing fails, try to extract key from the URL string
      const match = url.match(/\/([^\/]+\/[^\/]+)$/);
      return match ? match[1] : null;
    }
  };

  const handleIdentityFileUpload = async (file, type) => {
    try {
      const oldFileUrl = type === "aadhaar" ? identity?.aadhaarUpload : identity?.panUpload;
      const result = await uploadFileViaPresign(file, { folder: "identity-docs", type: "generic", userId });
      const newFileUrl = result.publicUrl;
      if (newFileUrl) {
        // Step 2: Update database with new URL
        const updatedIdentity = { ...identity };
        if (type === "aadhaar") {
          updatedIdentity.aadhaarUpload = newFileUrl;
        } else if (type === "pan") {
          updatedIdentity.panUpload = newFileUrl;
        }
        
        const res = isFacultyProfileSchema 
          ? await ProfileService.updateFacultyIdentity(userId, updatedIdentity)
          : await ProfileService.updateLearnerIdentity(userId, updatedIdentity);
        setIdentity(res?.data?.data || updatedIdentity);
        showSuccess(`${type === "aadhaar" ? "Aadhaar" : "PAN"} document uploaded!`);
        
        // Step 3: Delete old file from R2 (async, non-blocking)
        if (oldFileUrl && oldFileUrl !== newFileUrl) {
          const oldFileKey = extractR2KeyFromUrl(oldFileUrl);
          if (oldFileKey) {
            import("@/api/Services/AdminService").then(({ deleteFileFromR2 }) => {
              deleteFileFromR2(oldFileKey).catch(() => {});
            });
          }
        }
      }
    } catch (error) {
      showError(extractErrorMessage(error) || "Error uploading document");
    }
  };

  const handleIdentityLinkImport = async (result, type) => {
    try {
      const oldFileUrl = type === "aadhaar" ? identity?.aadhaarUpload : identity?.panUpload;
      const newFileUrl = result?.publicUrl;
      if (!newFileUrl) throw new Error("Invalid uploaded URL returned");
      const updatedIdentity = { ...identity };
      if (type === "aadhaar") updatedIdentity.aadhaarUpload = newFileUrl;
      if (type === "pan") updatedIdentity.panUpload = newFileUrl;
      const res = isFacultyProfileSchema
        ? await ProfileService.updateFacultyIdentity(userId, updatedIdentity)
        : await ProfileService.updateLearnerIdentity(userId, updatedIdentity);
      setIdentity(res?.data?.data || updatedIdentity);
      showSuccess(`${type === "aadhaar" ? "Aadhaar" : "PAN"} document uploaded!`);
      if (oldFileUrl && oldFileUrl !== newFileUrl) {
        const oldFileKey = extractR2KeyFromUrl(oldFileUrl);
        if (oldFileKey) import("@/api/Services/AdminService").then(({ deleteFileFromR2 }) => deleteFileFromR2(oldFileKey).catch(() => {}));
      }
    } catch (error) {
      showError(extractErrorMessage(error) || "Error uploading document");
    }
  };

  const handleContactUpdate = async (data) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.updateFacultyContact(userId, data)
        : await ProfileService.updateLearnerContact(userId, data);
      setContact(res?.data?.data || {});
      showSuccess();
      return true;
    } catch (e) { handleError(e, "Contact"); return false; }
  };

  const handleMetadataUpdate = async (data) => {
    try {
      const res = isFacultyProfileSchema 
        ? await ProfileService.updateFacultyMetadata(userId, data)
        : await ProfileService.updateLearnerMetadata(userId, data);
      setMetadata(res?.data?.data || {});
      showSuccess();
      return true;
    } catch (e) { handleError(e, "Metadata"); return false; }
  };


  // Replacing/removing a resume never cleaned up the superseded R2 object, unlike the identical
  // situation for profile images and identity docs just below/above in this same file (see
  // handleImageUpload / handleIdentityFileUpload's "Step 3: Delete old file from R2" comment) —
  // every resume replace or removal permanently orphaned the previous file.
  const deleteOldResumeFile = (oldFileUrl, newFileUrl) => {
    if (!oldFileUrl || oldFileUrl === newFileUrl) return;
    const oldFileKey = extractR2KeyFromUrl(oldFileUrl);
    if (oldFileKey) {
      import("@/api/Services/AdminService").then(({ deleteFileFromR2 }) => {
        deleteFileFromR2(oldFileKey).catch(() => {});
      });
    }
  };

  const handleProfileResumeUpload = async (file) => {
    if (!userId || resumeMutationRef.current) return false;
    const fileCheck = await validateResumeFileAsync(file);
    if (!fileCheck.valid) {
      messageApi.open({ type: "warning", content: fileCheck.error || "Invalid file.", duration: 4 });
      return false;
    }
    resumeMutationRef.current = true;
    setUploadingResume(true);
    try {
      const oldFileUrl = userDetails?.resumeUrl || userDetails?.resume_url;
      // type: "generic" meant the backend's dedicated PDF/Word-only server-side allowlist for
      // resumes (FileUploadController#presign's "resume" case) was never actually reachable from
      // this UI — every real resume upload fell through to the generic branch, which only blocks
      // a narrow dangerous-type blocklist. Client-side validation (validateResumeFileAsync) was
      // the only thing actually enforcing PDF/Word, and that's trivially bypassed by calling the
      // presign endpoint directly.
      const { publicUrl } = await uploadFileViaPresign(file, {
        folder: "resumes",
        type: "resume",
        userId,
      });
      if (!publicUrl || !isValidResumeUrl(publicUrl)) {
        messageApi.open({ type: "error", content: "Invalid resume URL returned.", duration: 4 });
        return false;
      }
      await ProfileService.updateLearnerResume(userId, { resumeUrl: publicUrl });
      showSuccess("Resume updated successfully! You can view it with the link above.");
      deleteOldResumeFile(oldFileUrl, publicUrl);
      if (setRefresh) setRefresh((prev) => !prev);
    } catch (e) {
      const msg = extractErrorMessage(e) || "Failed to upload resume. Please try again.";
      messageApi.open({ type: "error", content: msg, duration: 4 });
    } finally {
      resumeMutationRef.current = false;
      setUploadingResume(false);
    }
    return false;
  };

  const handleProfileResumeLinkImport = async (result) => {
    if (!userId || resumeMutationRef.current) return;
    const publicUrl = result?.publicUrl;
    if (!publicUrl || !isValidResumeUrl(publicUrl)) {
      messageApi.open({ type: "error", content: "Invalid resume URL returned.", duration: 4 });
      return;
    }
    resumeMutationRef.current = true;
    setUploadingResume(true);
    try {
      const oldFileUrl = userDetails?.resumeUrl || userDetails?.resume_url;
      await ProfileService.updateLearnerResume(userId, { resumeUrl: publicUrl });
      showSuccess("Resume updated successfully! You can view it with the link above.");
      deleteOldResumeFile(oldFileUrl, publicUrl);
      if (setRefresh) setRefresh((prev) => !prev);
    } catch (e) {
      messageApi.open({ type: "error", content: extractErrorMessage(e) || "Failed to update resume.", duration: 4 });
    } finally {
      resumeMutationRef.current = false;
      setUploadingResume(false);
    }
  };

  const handleRemoveProfileResume = async () => {
    if (!userId || resumeMutationRef.current) return;
    resumeMutationRef.current = true;
    setUploadingResume(true);
    const oldFileUrl = userDetails?.resumeUrl || userDetails?.resume_url;
    try {
      await ProfileService.updateLearnerResume(userId, { resumeUrl: null });
      showSuccess("Resume removed.");
      deleteOldResumeFile(oldFileUrl, null);
      if (setRefresh) setRefresh((prev) => !prev);
    } catch (e) {
      messageApi.open({ type: "error", content: extractErrorMessage(e) || "Failed to remove resume.", duration: 4 });
    } finally {
      resumeMutationRef.current = false;
      setUploadingResume(false);
    }
  };

  // The resume URL is already on userDetails (getResume never nulled it out) — no separate
  // signed-URL fetch needed, just open it directly.
  const handleViewResume = () => {
    const url = userDetails?.resumeUrl || userDetails?.resume_url;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      messageApi.open({ type: "error", content: "Could not get resume link.", duration: 4 });
    }
  };

  // Publications handlers (Faculty only)
  const handlePublicationAdd = async (data) => {
    try {
      const res = await ProfileService.addFacultyPublication(userId, data);
      setPublications(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Publication"); }
  };

  const handlePublicationUpdate = async (index, data) => {
    try {
      const res = await ProfileService.updateFacultyPublication(userId, index, data);
      setPublications(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Publication"); }
  };

  const handlePublicationDelete = async (index) => {
    try {
      const res = await ProfileService.deleteFacultyPublication(userId, index);
      setPublications(res?.data?.data || []);
      showSuccess("Deleted successfully!");
    } catch (e) { return handleError(e, "Publication"); }
  };

  // Awards handlers (Faculty only)
  const handleAwardAdd = async (data) => {
    try {
      const res = await ProfileService.addFacultyAward(userId, data);
      setAwards(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Award"); }
  };

  const handleAwardUpdate = async (index, data) => {
    try {
      const res = await ProfileService.updateFacultyAward(userId, index, data);
      setAwards(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Award"); }
  };

  const handleAwardDelete = async (index) => {
    try {
      const res = await ProfileService.deleteFacultyAward(userId, index);
      setAwards(res?.data?.data || []);
      showSuccess("Deleted successfully!");
    } catch (e) { return handleError(e, "Award"); }
  };

  // Hobbies handler (Learner only)
  const handleHobbiesUpdate = async (data) => {
    try {
      const res = await ProfileService.updateLearnerHobbies(userId, data);
      setHobbies(res?.data?.data || []);
      showSuccess();
    } catch (e) { return handleError(e, "Hobbies"); }
  };

  const handleImageUpload = async (file) => {
    try {
      const oldImageUrl = userDetails?.website;
      const result = await uploadFileViaPresign(file, { folder: "profile-images", type: "image", userId });
      const newImageUrl = result.publicUrl;
      if (newImageUrl) {
        // Step 2: Save new URL to database
        isFacultyProfileSchema 
          ? await ProfileService.updateFacultyHeader(userId, { profileImage: newImageUrl })
          : await ProfileService.updateLearnerHeader(userId, { profileImage: newImageUrl });
        
        showSuccess("Profile image updated!");
        setRefresh(prev => !prev);
        
        // Step 3: Dispatch to Redux to sync profile image across all components (e.g., header dropdown)
        dispatch(appAction.setProfileImageUrl(newImageUrl));
        
        // Step 4: Delete old image from R2 (async, non-blocking)
        if (oldImageUrl && oldImageUrl !== newImageUrl && oldImageUrl !== "string" && oldImageUrl !== " ") {
          const oldFileKey = extractR2KeyFromUrl(oldImageUrl);
          if (oldFileKey) {
            import("@/api/Services/AdminService").then(({ deleteFileFromR2 }) => {
              deleteFileFromR2(oldFileKey).catch(() => {});
            });
          }
        }
      }
    } catch (error) {
      showError(extractErrorMessage(error) || "Error uploading image");
    }
  };

  const handleImageLinkImport = async (result) => {
    try {
      const oldImageUrl = userDetails?.website;
      const newImageUrl = result?.publicUrl;
      if (!newImageUrl) throw new Error("Invalid image URL returned");
      isFacultyProfileSchema
        ? await ProfileService.updateFacultyHeader(userId, { profileImage: newImageUrl })
        : await ProfileService.updateLearnerHeader(userId, { profileImage: newImageUrl });
      showSuccess("Profile image updated!");
      setRefresh(prev => !prev);
      dispatch(appAction.setProfileImageUrl(newImageUrl));
      if (oldImageUrl && oldImageUrl !== newImageUrl && oldImageUrl !== "string" && oldImageUrl !== " ") {
        const oldFileKey = extractR2KeyFromUrl(oldImageUrl);
        if (oldFileKey) import("@/api/Services/AdminService").then(({ deleteFileFromR2 }) => deleteFileFromR2(oldFileKey).catch(() => {}));
      }
    } catch (error) {
      showError(extractErrorMessage(error) || "Error uploading image");
    }
  };

  // Prepare profile data for completeness calculation
  const profileData = {
    personalDetails,
    contact,
    address,
    identity,
    qualifications,
    skills,
    experiences,
    projects,
    certifications,
    achievements,
    languages,
    extracurricular,
    hobbies,
    social,
    publications,
    awards,
  };

  return (
    <div className="pt-0 px-0">
      {contextHolder}
      {sectionLoadErrors.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Some profile sections could not be loaded"
          description={`We couldn't verify: ${sectionLoadErrors.join(", ")}. Last known data is kept where available; otherwise those sections may look empty until you retry.`}
          action={<Button size="small" onClick={() => loadAllData(isCancelledRef.current)}>Retry sections</Button>}
        />
      )}
      <Row gutter={[20, 20]} className="profile-sections">
        <Col span={24}>
          <UserInfo
            userDetails={userDetails}
            saveImage={handleImageUpload}
            saveImageFromLink={handleImageLinkImport}
            userId={userId}
            setRefresh={setRefresh}
            programName={programName}
          />
        </Col>

        {/* Profile Completeness Section */}
        {!compact && <Col span={24}>
          <ProfileCompleteness 
            profileData={profileData}
            isFaculty={isFacultyProfileSchema}
          />
        </Col>}

        <Col span={24}>
          <Row gutter={[20, 20]} className="profile-sections-row" align="top">
            {/* Personal Details Section */}
            <Col xs={24} xl={12}>
              <Card
                title={
                  <CardHeader
                    title="Personal Details"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                    rightContent={<EditButton onClick={() => setPersonalDetailsEdit(true)} disabled={personalDetailsEdit} />}
                  />
                }
              >
                <PersonalDetails
                  personalDetails={personalDetails}
                  personalDetailsEdit={personalDetailsEdit}
                  setPersonalDetailsEdit={setPersonalDetailsEdit}
                  onUpdate={handlePersonalDetailsUpdate}
                />
              </Card>
            </Col>

            {/* Experience Section */}
            {!compact && (
            <Col xs={24} xl={12}>
              <Card
                title={
                  <CardHeader
                    title="Experience"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                    rightContent={
                      <Space size={8} wrap>
                        <AddButton onClick={() => setExperienceParams({ ...experienceParams, addClicked: true })} disabled={experienceParams.addClicked} />
                        {experiences?.length > 0 && (
                          <EditButton onClick={() => setExperienceParams({ ...experienceParams, editClicked: true })} disabled={experienceParams.editClicked} />
                        )}
                      </Space>
                    }
                  />
                }
              >
                <Experiences
                  experiences={experiences}
                  experienceParams={experienceParams}
                  setExperienceParams={setExperienceParams}
                  onAdd={handleExperienceAdd}
                  onUpdate={handleExperienceUpdate}
                  onDelete={handleExperienceDelete}
                />
              </Card>
            </Col>
            )}

            {/* Education Section */}
            {!compact && (
            <Col xs={24} xl={12}>
              <Card
                title={
                  <CardHeader
                    title="Education/Qualification"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                    rightContent={
                      <Space size={8} wrap>
                        <AddButton onClick={() => setQualificationParams({ ...qualificationParams, addClicked: true })} disabled={qualificationParams.addClicked} />
                        {qualifications?.length > 0 && (
                          <EditButton onClick={() => setQualificationParams({ ...qualificationParams, editClicked: true })} disabled={qualificationParams.editClicked} />
                        )}
                      </Space>
                    }
                  />
                }
              >
                <Qualifications
                  qualifications={qualifications}
                  qualificationParams={qualificationParams}
                  setQualificationParams={setQualificationParams}
                  onAdd={handleEducationAdd}
                  onUpdate={handleEducationUpdate}
                  onDelete={handleEducationDelete}
                />
              </Card>
            </Col>
            )}

            {/* Projects Section - Learner Only */}
            {!isFacultyProfileSchema && (
              <Col xs={24} xl={12}>
                <Card
                  title={
<CardHeader
                    title="Projects"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                      rightContent={
                        <Space size={8} wrap>
                          <AddButton onClick={() => setProjectParams({ ...projectParams, addClicked: true })} disabled={projectParams.addClicked} />
                          {projects?.length > 0 && (
                            <EditButton onClick={() => setProjectParams({ ...projectParams, editClicked: true })} disabled={projectParams.editClicked} />
                          )}
                        </Space>
                      }
                    />
                  }
                >
                  <Projects
                    projects={projects}
                    projectParams={projectParams}
                    setProjectParams={setProjectParams}
                    onAdd={handleProjectAdd}
                    onUpdate={handleProjectUpdate}
                    onDelete={handleProjectDelete}
                  />
                </Card>
              </Col>
            )}

            {/* Certifications Section */}
            {!compact && (
            <Col xs={24} xl={12}>
              <Card
                title={
                  <CardHeader
                    title="Certifications"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                    rightContent={
                      <Space size={8} wrap>
                        <AddButton onClick={() => setCertificationParams({ ...certificationParams, addClicked: true })} disabled={certificationParams.addClicked} />
                        {certifications?.length > 0 && (
                          <EditButton onClick={() => setCertificationParams({ ...certificationParams, editClicked: true })} disabled={certificationParams.editClicked} />
                        )}
                      </Space>
                    }
                  />
                }
              >
                <Certifications
                  certifications={certifications}
                  certificationParams={certificationParams}
                  setCertificationParams={setCertificationParams}
                  onAdd={handleCertificationAdd}
                  onUpdate={handleCertificationUpdate}
                  onDelete={handleCertificationDelete}
                />
              </Card>
            </Col>
            )}

            {/* Academic Achievements - Learner Only */}
            {!isFacultyProfileSchema && (
              <Col xs={24} xl={12}>
                <Card
                  title={
<CardHeader
                    title="Academic Achievements"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                      rightContent={
                        <Space size={8} wrap>
                          <AddButton onClick={() => setAchievementParams({ ...achievementParams, addClicked: true })} disabled={achievementParams.addClicked} />
                          {achievements?.length > 0 && (
                            <EditButton onClick={() => setAchievementParams({ ...achievementParams, editClicked: true })} disabled={achievementParams.editClicked} />
                          )}
                        </Space>
                      }
                    />
                  }
                >
                  <Achievements
                    achievements={achievements}
                    achievementParams={achievementParams}
                    setAchievementParams={setAchievementParams}
                    onAdd={handleAchievementAdd}
                    onUpdate={handleAchievementUpdate}
                    onDelete={handleAchievementDelete}
                  />
                </Card>
              </Col>
            )}

            {/* Skills Section */}
            {!compact && (
            <Col xs={24} xl={12}>
              <Card
                title={
                  <CardHeader
                    title="Skills"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                    rightContent={<EditButton onClick={() => setSkillsEdit(true)} />}
                  />
                }
              >
                <Skills
                  skills={skills}
                  skillsEditable={skillsEdit}
                  setSkillsEdit={setSkillsEdit}
                  saveProfileDetails={(data) => handleSkillsUpdate(data.skills)}
                />
              </Card>
            </Col>
            )}

            {/* Languages Section */}
            {!compact && (
            <Col xs={24} xl={12}>
              <Card
                title={
                  <CardHeader
                    title="Languages"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                    rightContent={
                      <Space size={8} wrap>
                        <AddButton onClick={() => setLanguageParams({ ...languageParams, addClicked: true })} disabled={languageParams.addClicked} />
                        {languages?.length > 0 && (
                          <EditButton onClick={() => setLanguageParams({ ...languageParams, editClicked: true })} disabled={languageParams.editClicked} />
                        )}
                      </Space>
                    }
                  />
                }
              >
                <Languages
                  languages={languages}
                  languageParams={languageParams}
                  setLanguageParams={setLanguageParams}
                  onAdd={handleLanguageAdd}
                  onUpdate={handleLanguageUpdate}
                  onDelete={handleLanguageDelete}
                />
              </Card>
            </Col>
            )}

            {/* Extra-curricular - Learner Only */}
            {!isFacultyProfileSchema && (
              <Col xs={24} xl={12}>
                <Card
                  title={
<CardHeader
                    title="Extra-curricular Activities"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                      rightContent={
                        <Space size={8} wrap>
                          <AddButton onClick={() => setActivityParams({ ...activityParams, addClicked: true })} disabled={activityParams.addClicked} />
                          {extracurricular?.length > 0 && (
                            <EditButton onClick={() => setActivityParams({ ...activityParams, editClicked: true })} disabled={activityParams.editClicked} />
                          )}
                        </Space>
                      }
                    />
                  }
                >
                  <Extracurricular
                    activities={extracurricular}
                    activityParams={activityParams}
                    setActivityParams={setActivityParams}
                    onAdd={handleExtracurricularAdd}
                    onUpdate={handleExtracurricularUpdate}
                    onDelete={handleExtracurricularDelete}
                  />
                </Card>
              </Col>
            )}

            {/* Hobbies & Interests - Learner Only */}
            {!isFacultyProfileSchema && (
              <Col xs={24} xl={12}>
                <Card
                  title={
<CardHeader
                    title="Hobbies & Interests"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                      rightContent={<EditButton onClick={() => setHobbiesEdit(true)} disabled={hobbiesEdit} />}
                    />
                  }
                >
                  <Hobbies
                    hobbies={hobbies}
                    hobbiesEdit={hobbiesEdit}
                    setHobbiesEdit={setHobbiesEdit}
                    onUpdate={handleHobbiesUpdate}
                  />
                </Card>
              </Col>
            )}

            {/* Publications & Research - Faculty Only */}
            {isFacultyProfileSchema && !compact && (
              <Col xs={24} xl={12}>
                <Card
                  title={
<CardHeader
                    title="Publications & Research"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                      rightContent={
                        <Space size={8} wrap>
                          <AddButton onClick={() => setPublicationParams({ ...publicationParams, addClicked: true })} disabled={publicationParams.addClicked} />
                          {publications?.length > 0 && (
                            <EditButton onClick={() => setPublicationParams({ ...publicationParams, editClicked: true })} disabled={publicationParams.editClicked} />
                          )}
                        </Space>
                      }
                    />
                  }
                >
                  <Publications
                    publications={publications}
                    publicationParams={publicationParams}
                    setPublicationParams={setPublicationParams}
                    onAdd={handlePublicationAdd}
                    onUpdate={handlePublicationUpdate}
                    onDelete={handlePublicationDelete}
                  />
                </Card>
              </Col>
            )}

            {/* Awards & Recognitions - Faculty Only */}
            {isFacultyProfileSchema && !compact && (
              <Col xs={24} xl={12}>
                <Card
                  title={
<CardHeader
                    title="Awards & Recognitions"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                      rightContent={
                        <Space size={8} wrap>
                          <AddButton onClick={() => setAwardParams({ ...awardParams, addClicked: true })} disabled={awardParams.addClicked} />
                          {awards?.length > 0 && (
                            <EditButton onClick={() => setAwardParams({ ...awardParams, editClicked: true })} disabled={awardParams.editClicked} />
                          )}
                        </Space>
                      }
                    />
                  }
                >
                  <Awards
                    awards={awards}
                    awardParams={awardParams}
                    setAwardParams={setAwardParams}
                    onAdd={handleAwardAdd}
                    onUpdate={handleAwardUpdate}
                    onDelete={handleAwardDelete}
                  />
                </Card>
              </Col>
            )}

            {/* Social Profiles Section */}
            <Col xs={24} xl={12} id="profile-connect-accounts-section">
              <Card
                title={
                  <CardHeader
                    title="Social Profiles"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                    rightContent={<EditButton onClick={() => setSocialEdit(true)} disabled={socialEdit} />}
                  />
                }
              >
                <SocialProfiles
                  social={social}
                  socialEdit={socialEdit}
                  setSocialEdit={setSocialEdit}
                  onUpdate={handleSocialUpdate}
                  isTeacher={isFacultyProfileSchema}
                />
              </Card>
            </Col>

            {/* Identity Documents Section */}
            {!compact && (
            <Col xs={24} xl={12}>
              <Card
                title={
                  <CardHeader
                    title="Identity Documents"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                    rightContent={<EditButton onClick={() => setIdentityEdit(true)} disabled={identityEdit} />}
                  />
                }
              >
                <Identity
                  identity={identity}
                  identityEdit={identityEdit}
                  setIdentityEdit={setIdentityEdit}
                  onUpdate={handleIdentityUpdate}
                  onFileUpload={handleIdentityFileUpload}
                  onLinkUpload={handleIdentityLinkImport}
                  userId={userId}
                />
              </Card>
            </Col>
            )}

            {/* Address Section */}
            <Col xs={24} xl={12}>
              <Card
                title={
                  <CardHeader
                    title="Address"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                    rightContent={<EditButton onClick={() => setAddressEdit(true)} disabled={addressEdit} />}
                  />
                }
              >
                <Address
                  address={address}
                  addressEdit={addressEdit}
                  setAddressEdit={setAddressEdit}
                  onUpdate={handleAddressUpdate}
                />
              </Card>
            </Col>

            {/* Contacts Section */}
            <Col xs={24} xl={12} id="profile-contacts-section">
              <Card
                title={
                  <CardHeader
                    title="Contacts"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                    rightContent={<EditButton onClick={() => setContactsEdit(true)} />}
                  />
                }
              >
                <Contacts
                  userDetails={{ ...userDetails, ...contact }}
                  contactsEdit={contactsEdit}
                  setContactsEdit={setContactsEdit}
                  saveProfileDetails={(data) => handleContactUpdate({
                    contactMobile: data.contact_mobile,
                    contactPhone: data.contact_phone,
                    contactMail: data.contact_mail,
                  })}
                />
              </Card>
            </Col>

            {/* Additional Information Section */}
            {!compact && (
            <Col xs={24} xl={12}>
              <Card
                title={
                  <CardHeader
                    title="Additional Information"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                    rightContent={<EditButton onClick={() => setMetadataEdit(true)} disabled={metadataEdit} />}
                  />
                }
              >
                <Metadata
                  metadata={metadata}
                  metadataEdit={metadataEdit}
                  setMetadataEdit={setMetadataEdit}
                  onUpdate={handleMetadataUpdate}
                />
              </Card>
            </Col>
            )}

            {/* Profile Resume (Learner only) */}
            {!isFacultyProfileSchema && (
              <Col xs={24} xl={12}>
                <Card
                  className="ln-card"
                  title={
<CardHeader
                    title="Resume"
                    headerColor={PROFILE_CARD_ACCENT}
                    variant="profile"
                    />
                  }
                >
                  <div className="profile-resume-section">
                    {(userDetails?.resumeUrl || userDetails?.resume_url) ? (
                      <div className="profile-resume-section__current">
                        <div className="profile-resume-section__file">
                          <FilePdfOutlined className="profile-resume-section__icon" />
                          <div className="profile-resume-section__copy">
                            <div className="profile-field-value">Resume uploaded</div>
                            <Text type="secondary" className="profile-resume-section__hint">
                              Click to view your uploaded resume
                            </Text>
                          </div>
                        </div>
                        <div className="profile-resume-section__actions">
                          <Button
                            type="primary"
                            onClick={handleViewResume}
                            className="profile-resume-section__view-btn"
                          >
                            View resume
                          </Button>
                          <Popconfirm
                            title="Remove this resume?"
                            description="The resume will no longer be available as your default for job applications."
                            okText="Remove"
                            okButtonProps={{ danger: true, loading: uploadingResume }}
                            onConfirm={handleRemoveProfileResume}
                            disabled={uploadingResume}
                          >
                            <Button type="default" danger loading={uploadingResume} disabled={uploadingResume}>
                              Remove
                            </Button>
                          </Popconfirm>
                        </div>
                      </div>
                    ) : (
                      <div className="profile-empty-state profile-resume-section__empty">
                        No resume uploaded. Upload one to use as your default when applying for jobs.
                      </div>
                    )}
                    <Upload
                      accept=".pdf,.doc,.docx"
                      beforeUpload={handleProfileResumeUpload}
                      showUploadList={false}
                      disabled={uploadingResume}
                    >
                      <Button
                        type="default"
                        icon={<UploadOutlined />}
                        loading={uploadingResume}
                        disabled={uploadingResume}
                      >
                        {(userDetails?.resumeUrl || userDetails?.resume_url) ? "Replace resume" : "Upload resume"}
                      </Button>
                    </Upload>
                    <UploadFromLinkButton
                      folder="resumes"
                      type="resume"
                      userId={userId}
                      onImported={handleProfileResumeLinkImport}
                      buttonProps={{ disabled: uploadingResume }}
                    >
                      Upload resume from Drive
                    </UploadFromLinkButton>
                  </div>
                </Card>
              </Col>
            )}
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default About;
