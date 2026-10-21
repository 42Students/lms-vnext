package com._42students.lms.service;

import com._42students.lms.dto.profile.*;
import java.util.List;

public interface FacultyProfileService {
    
    // Profile Header
    ProfileHeaderDTO getHeader(Integer facultyId);
    ProfileHeaderDTO updateHeader(Integer facultyId, ProfileHeaderDTO dto);
    
    // About Me
    AboutDTO getAbout(Integer facultyId);
    AboutDTO updateAbout(Integer facultyId, AboutDTO dto);
    
    // Personal Details
    PersonalDetailsDTO getPersonalDetails(Integer facultyId);
    PersonalDetailsDTO updatePersonalDetails(Integer facultyId, PersonalDetailsDTO dto);
    
    // Identity Documents
    IdentityDTO getIdentity(Integer facultyId);
    IdentityDTO updateIdentity(Integer facultyId, IdentityDTO dto);
    
    // Languages
    List<LanguageDTO> getLanguages(Integer facultyId);
    List<LanguageDTO> addLanguage(Integer facultyId, LanguageDTO dto);
    List<LanguageDTO> updateLanguage(Integer facultyId, int index, LanguageDTO dto);
    List<LanguageDTO> deleteLanguage(Integer facultyId, int index);
    
    // Contact Information
    ContactDTO getContact(Integer facultyId);
    ContactDTO updateContact(Integer facultyId, ContactDTO dto);
    
    // Address
    AddressDTO getAddress(Integer facultyId);
    AddressDTO updateAddress(Integer facultyId, AddressDTO dto);
    
    // Social Profiles
    SocialProfileDTO getSocialProfiles(Integer facultyId);
    SocialProfileDTO updateSocialProfiles(Integer facultyId, SocialProfileDTO dto);
    
    // Education
    List<EducationDTO> getEducation(Integer facultyId);
    List<EducationDTO> addEducation(Integer facultyId, EducationDTO dto);
    List<EducationDTO> updateEducation(Integer facultyId, int index, EducationDTO dto);
    List<EducationDTO> deleteEducation(Integer facultyId, int index);
    
    // Certifications
    List<CertificationDTO> getCertifications(Integer facultyId);
    List<CertificationDTO> addCertification(Integer facultyId, CertificationDTO dto);
    List<CertificationDTO> updateCertification(Integer facultyId, int index, CertificationDTO dto);
    List<CertificationDTO> deleteCertification(Integer facultyId, int index);
    
    // Work Experience
    List<ExperienceDTO> getExperiences(Integer facultyId);
    List<ExperienceDTO> addExperience(Integer facultyId, ExperienceDTO dto);
    List<ExperienceDTO> updateExperience(Integer facultyId, int index, ExperienceDTO dto);
    List<ExperienceDTO> deleteExperience(Integer facultyId, int index);
    
    // Skills
    List<SkillDTO> getSkills(Integer facultyId);
    List<SkillDTO> addSkill(Integer facultyId, SkillDTO dto);
    List<SkillDTO> updateSkill(Integer facultyId, int index, SkillDTO dto);
    List<SkillDTO> deleteSkill(Integer facultyId, int index);
    
    // Publications & Research
    List<PublicationDTO> getPublications(Integer facultyId);
    List<PublicationDTO> addPublication(Integer facultyId, PublicationDTO dto);
    List<PublicationDTO> updatePublication(Integer facultyId, int index, PublicationDTO dto);
    List<PublicationDTO> deletePublication(Integer facultyId, int index);
    
    // Awards & Recognitions
    List<AwardDTO> getAwards(Integer facultyId);
    List<AwardDTO> addAward(Integer facultyId, AwardDTO dto);
    List<AwardDTO> updateAward(Integer facultyId, int index, AwardDTO dto);
    List<AwardDTO> deleteAward(Integer facultyId, int index);
    
    // Profile Metadata
    MetadataDTO getMetadata(Integer facultyId);
    MetadataDTO updateMetadata(Integer facultyId, MetadataDTO dto);
}

