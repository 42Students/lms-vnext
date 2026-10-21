package com._42students.lms.service;

import com._42students.lms.dto.profile.*;
import java.util.List;

public interface LearnerProfileService {
    
    // Profile Header
    ProfileHeaderDTO getHeader(Integer learnerId);
    ProfileHeaderDTO updateHeader(Integer learnerId, ProfileHeaderDTO dto);
    
    // About Me
    AboutDTO getAbout(Integer learnerId);
    AboutDTO updateAbout(Integer learnerId, AboutDTO dto);
    
    // Personal Details
    PersonalDetailsDTO getPersonalDetails(Integer learnerId);
    PersonalDetailsDTO updatePersonalDetails(Integer learnerId, PersonalDetailsDTO dto);
    
    // Identity Documents
    IdentityDTO getIdentity(Integer learnerId);
    IdentityDTO updateIdentity(Integer learnerId, IdentityDTO dto);
    
    // Languages
    List<LanguageDTO> getLanguages(Integer learnerId);
    List<LanguageDTO> addLanguage(Integer learnerId, LanguageDTO dto);
    List<LanguageDTO> updateLanguage(Integer learnerId, int index, LanguageDTO dto);
    List<LanguageDTO> deleteLanguage(Integer learnerId, int index);
    
    // Contact Information
    ContactDTO getContact(Integer learnerId);
    ContactDTO updateContact(Integer learnerId, ContactDTO dto);
    
    // Address
    AddressDTO getAddress(Integer learnerId);
    AddressDTO updateAddress(Integer learnerId, AddressDTO dto);
    
    // Social Profiles
    SocialProfileDTO getSocialProfiles(Integer learnerId);
    SocialProfileDTO updateSocialProfiles(Integer learnerId, SocialProfileDTO dto);
    
    // Education
    List<EducationDTO> getEducation(Integer learnerId);
    List<EducationDTO> addEducation(Integer learnerId, EducationDTO dto);
    List<EducationDTO> updateEducation(Integer learnerId, int index, EducationDTO dto);
    List<EducationDTO> deleteEducation(Integer learnerId, int index);
    
    // Certifications
    List<CertificationDTO> getCertifications(Integer learnerId);
    List<CertificationDTO> addCertification(Integer learnerId, CertificationDTO dto);
    List<CertificationDTO> updateCertification(Integer learnerId, int index, CertificationDTO dto);
    List<CertificationDTO> deleteCertification(Integer learnerId, int index);
    
    // Academic Achievements
    List<AchievementDTO> getAchievements(Integer learnerId);
    List<AchievementDTO> addAchievement(Integer learnerId, AchievementDTO dto);
    List<AchievementDTO> updateAchievement(Integer learnerId, int index, AchievementDTO dto);
    List<AchievementDTO> deleteAchievement(Integer learnerId, int index);
    
    // Skills
    List<SkillDTO> getSkills(Integer learnerId);
    List<SkillDTO> addSkill(Integer learnerId, SkillDTO dto);
    List<SkillDTO> updateSkill(Integer learnerId, int index, SkillDTO dto);
    List<SkillDTO> deleteSkill(Integer learnerId, int index);
    
    // Projects
    List<ProjectDTO> getProjects(Integer learnerId);
    List<ProjectDTO> addProject(Integer learnerId, ProjectDTO dto);
    List<ProjectDTO> updateProject(Integer learnerId, int index, ProjectDTO dto);
    List<ProjectDTO> deleteProject(Integer learnerId, int index);
    
    // Experiences/Internships
    List<ExperienceDTO> getExperiences(Integer learnerId);
    List<ExperienceDTO> addExperience(Integer learnerId, ExperienceDTO dto);
    List<ExperienceDTO> updateExperience(Integer learnerId, int index, ExperienceDTO dto);
    List<ExperienceDTO> deleteExperience(Integer learnerId, int index);
    
    // Extra-curricular
    List<ExtracurricularDTO> getExtracurricular(Integer learnerId);
    List<ExtracurricularDTO> addExtracurricular(Integer learnerId, ExtracurricularDTO dto);
    List<ExtracurricularDTO> updateExtracurricular(Integer learnerId, int index, ExtracurricularDTO dto);
    List<ExtracurricularDTO> deleteExtracurricular(Integer learnerId, int index);
    
    // Hobbies & Interests
    List<HobbyDTO> getHobbies(Integer learnerId);
    List<HobbyDTO> updateHobbies(Integer learnerId, List<HobbyDTO> hobbies);
    
    // Video Intro
    VideoIntroDTO getVideoIntro(Integer learnerId);
    VideoIntroDTO updateVideoIntro(Integer learnerId, VideoIntroDTO dto);

    // Profile Metadata
    MetadataDTO getMetadata(Integer learnerId);
    MetadataDTO updateMetadata(Integer learnerId, MetadataDTO dto);
    
    // Job Preferences
    JobPreferencesDTO getJobPreferences(Integer learnerId);
    JobPreferencesDTO updateJobPreferences(Integer learnerId, JobPreferencesDTO dto);

    // Profile Resume (default resume for job applications)
    ResumeUrlDTO getResume(Integer learnerId);
    ResumeUrlDTO updateResume(Integer learnerId, String resumeUrl);
}

