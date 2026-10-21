package com._42students.lms.service.impl;

import com._42students.lms.dto.profile.*;
import com._42students.lms.model.Faculty;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.service.FacultyProfileService;
import com._42students.lms.utils.ContentUrlValidator;
import com._42students.lms.utils.R2StorageUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class FacultyProfileServiceImpl implements FacultyProfileService {

    private static final Logger log = LoggerFactory.getLogger(FacultyProfileServiceImpl.class);

    private static final String INDEX_OUT_OF_BOUNDS_MSG = "Index out of bounds. Please refresh and try again.";
    private static final int IDENTITY_MAX_JSON_SIZE_DEFAULT = 10_000;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    // Was hardcoded here AND in LearnerProfileServiceImpl; both now read the same GLOBAL setting.
    private int identityMaxJsonSize() {
        return appSettingsService != null ? appSettingsService.getIdentityMaxJsonSize() : IDENTITY_MAX_JSON_SIZE_DEFAULT;
    }

    private static void checkIndex(int index, int size) {
        if (index < 0 || index >= size) {
            throw new RuntimeException(INDEX_OUT_OF_BOUNDS_MSG);
        }
    }

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired(required = false)
    private ContentUrlValidator contentUrlValidator;

    @Autowired(required = false)
    private R2StorageUtils r2StorageUtils;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.utils.PrivateDocStorage privateDocs;

    // Best-effort delete of a previously-stored, self-owned R2 object (profile image, identity
    // doc) that a profile update just replaced or cleared. Without this, every re-upload
    // (e.g. re-submitting Aadhaar/PAN after a rejection) orphans the old object in R2 forever —
    // and since these are personal documents, the stale copy stays reachable by anyone holding
    // its key/URL even after the user believes they've replaced it. Mirrors
    // LearnerProfileServiceImpl's identical helper.
    private void deleteReplacedOwnedR2FileBestEffort(String previousStorageValue, String newStorageValue) {
        if (previousStorageValue == null || previousStorageValue.trim().isEmpty()) return;
        // A replaced private document (private-doc:<key>) is removed from the private bucket, not the public one.
        if (com._42students.lms.utils.PrivateDocStorage.isRef(previousStorageValue)) {
            if (previousStorageValue.equals(newStorageValue) || privateDocs == null || !privateDocs.isConfigured()) return;
            try {
                privateDocs.delete(com._42students.lms.utils.PrivateDocStorage.keyOf(previousStorageValue));
            } catch (Exception e) {
                log.warn("Failed to delete replaced private document: {}", e.getMessage());
            }
            return;
        }
        if (contentUrlValidator == null || r2StorageUtils == null) return;
        if (previousStorageValue.equals(newStorageValue)) return;

        String prevKey = contentUrlValidator.resolveStorageKeyFromValue(previousStorageValue);
        if (prevKey == null || prevKey.isEmpty()) return;
        if (newStorageValue != null) {
            String nextKey = contentUrlValidator.resolveStorageKeyFromValue(newStorageValue);
            if (prevKey.equals(nextKey)) return;
        }
        try {
            r2StorageUtils.deleteFile(prevKey);
        } catch (Exception e) {
            log.warn("Failed to delete replaced R2 file {}: {}", prevKey, e.getMessage());
        }
    }

    private Faculty getFaculty(Integer facultyId) {
        return facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found with id: " + facultyId));
    }

    // ==================== Profile Header ====================
    @Override
    public ProfileHeaderDTO getHeader(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        ProfileHeaderDTO dto = new ProfileHeaderDTO();
        dto.setFirstName(faculty.getFirstName());
        dto.setLastName(faculty.getLastName());
        dto.setUniqueId(faculty.getUniqueId());
        dto.setDepartment(faculty.getDepartment());
        dto.setDeptId(faculty.getDeptId());
        dto.setCollegeId(faculty.getCollegeId());
        dto.setFacultyType(faculty.getFacultyType() != null ? faculty.getFacultyType().name() : null);
        dto.setProfileImage(faculty.getWebsite());
        return dto;
    }

    @Override
    public ProfileHeaderDTO updateHeader(Integer facultyId, ProfileHeaderDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        String previousProfileImage = faculty.getWebsite();
        String url = dto != null ? dto.getProfileImage() : null;
        if (url != null && !url.trim().isEmpty()) {
            String u = url.trim();
            if (!u.startsWith("https://")) {
                throw new RuntimeException("Profile image URL must use HTTPS.");
            }
            if (contentUrlValidator != null
                    && !contentUrlValidator.isAllowedContentUrl(u)
                    && !contentUrlValidator.isAllowedStorageKey(u)) {
                throw new RuntimeException("Profile image URL or storage key is not allowed.");
            }
            faculty.setWebsite(u);
            facultyRepository.save(faculty);
            deleteReplacedOwnedR2FileBestEffort(previousProfileImage, faculty.getWebsite());
        }
        return getHeader(facultyId);
    }

    // ==================== About Me ====================
    @Override
    public AboutDTO getAbout(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        AboutDTO dto = new AboutDTO();
        dto.setDescription(faculty.getDescription());
        return dto;
    }

    @Override
    public AboutDTO updateAbout(Integer facultyId, AboutDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        if (dto.getDescription() != null) faculty.setDescription(Jsoup.clean(dto.getDescription(), Safelist.none()));
        facultyRepository.save(faculty);
        return getAbout(facultyId);
    }

    // ==================== Personal Details ====================
    @Override
    public PersonalDetailsDTO getPersonalDetails(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        PersonalDetailsDTO dto = new PersonalDetailsDTO();
        dto.setGender(faculty.getGender());
        dto.setDob(faculty.getDob());
        dto.setBloodGroup(faculty.getBloodGroup());
        return dto;
    }

    @Override
    public PersonalDetailsDTO updatePersonalDetails(Integer facultyId, PersonalDetailsDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        if (dto.getGender() != null) faculty.setGender(dto.getGender());
        if (dto.getDob() != null) faculty.setDob(dto.getDob());
        if (dto.getBloodGroup() != null) faculty.setBloodGroup(dto.getBloodGroup());
        facultyRepository.save(faculty);
        return getPersonalDetails(facultyId);
    }

    // ==================== Identity Documents ====================
    @Override
    public IdentityDTO getIdentity(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        return faculty.getIdentity() != null ? faculty.getIdentity() : new IdentityDTO();
    }

    @Override
    public IdentityDTO updateIdentity(Integer facultyId, IdentityDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        IdentityDTO previous = faculty.getIdentity();
        if (dto != null) {
            try {
                String json = new ObjectMapper().writeValueAsString(dto);
                if (json.length() > identityMaxJsonSize()) {
                    throw new RuntimeException("Identity data exceeds maximum size. Please reduce content.");
                }
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Invalid identity data.");
            }
        }
        faculty.setIdentity(dto);
        facultyRepository.save(faculty);
        // Aadhaar/PAN uploads are highly sensitive personal documents — replacing or clearing them
        // must not leave the previous R2 object reachable/orphaned forever.
        deleteReplacedOwnedR2FileBestEffort(
                previous != null ? previous.getAadhaarUpload() : null,
                dto != null ? dto.getAadhaarUpload() : null);
        deleteReplacedOwnedR2FileBestEffort(
                previous != null ? previous.getPanUpload() : null,
                dto != null ? dto.getPanUpload() : null);
        return getIdentity(facultyId);
    }

    // ==================== Languages ====================
    @Override
    public List<LanguageDTO> getLanguages(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        return faculty.getLanguages() != null ? faculty.getLanguages() : new ArrayList<>();
    }

    @Override
    public List<LanguageDTO> addLanguage(Integer facultyId, LanguageDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<LanguageDTO> languages = faculty.getLanguages() != null ? new ArrayList<>(faculty.getLanguages()) : new ArrayList<>();
        languages.add(dto);
        faculty.setLanguages(languages);
        facultyRepository.save(faculty);
        return getLanguages(facultyId);
    }

    @Override
    public List<LanguageDTO> updateLanguage(Integer facultyId, int index, LanguageDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<LanguageDTO> languages = faculty.getLanguages() != null ? new ArrayList<>(faculty.getLanguages()) : new ArrayList<>();
        checkIndex(index, languages.size());
        languages.set(index, dto);
        faculty.setLanguages(languages);
        facultyRepository.save(faculty);
        return getLanguages(facultyId);
    }

    @Override
    public List<LanguageDTO> deleteLanguage(Integer facultyId, int index) {
        Faculty faculty = getFaculty(facultyId);
        List<LanguageDTO> languages = faculty.getLanguages() != null ? new ArrayList<>(faculty.getLanguages()) : new ArrayList<>();
        checkIndex(index, languages.size());
        languages.remove(index);
        faculty.setLanguages(languages);
        facultyRepository.save(faculty);
        return getLanguages(facultyId);
    }

    // ==================== Contact Information ====================
    @Override
    public ContactDTO getContact(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        ContactDTO dto = new ContactDTO();
        dto.setContactMobile(faculty.getContactMobile());
        dto.setContactPhone(faculty.getContactPhone());
        dto.setContactMail(faculty.getContactMail());
        return dto;
    }

    @Override
    public ContactDTO updateContact(Integer facultyId, ContactDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        
        // Validate and update contactMobile (Primary - Required)
        if (dto.getContactMobile() != null && !dto.getContactMobile().trim().isEmpty()) {
            String mobile = dto.getContactMobile().trim();
            // Validate mobile format: 10 digits
            if (!mobile.matches("^[0-9]{10}$")) {
                throw new RuntimeException("Primary mobile number must be exactly 10 digits");
            }
            faculty.setContactMobile(mobile);
        }
        
        // Validate and update contactPhone (Alternate - Optional)
        if (dto.getContactPhone() != null && !dto.getContactPhone().trim().isEmpty()) {
            String phone = dto.getContactPhone().trim();
            // Validate phone format: 10-15 digits (allows landline with area code)
            if (!phone.matches("^[0-9]{10,15}$")) {
                throw new RuntimeException("Alternate phone number must be 10-15 digits");
            }
            // Business rule: contactPhone cannot equal contactMobile
            String currentMobile = dto.getContactMobile() != null ? dto.getContactMobile().trim() : faculty.getContactMobile();
            if (phone.equals(currentMobile)) {
                throw new RuntimeException("Alternate phone number cannot be the same as primary mobile number");
            }
            faculty.setContactPhone(phone);
        } else {
            // Allow clearing alternate phone
            faculty.setContactPhone(null);
        }
        
        // Business rule: If contactPhone exists, contactMobile must exist
        if (faculty.getContactPhone() != null && (faculty.getContactMobile() == null || faculty.getContactMobile().trim().isEmpty())) {
            throw new RuntimeException("Primary mobile number is required when alternate phone is provided");
        }
        
        if (dto.getContactMail() != null && !dto.getContactMail().trim().isEmpty()) {
            String email = dto.getContactMail().trim();
            if (!email.matches("^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$")) {
                throw new RuntimeException("Contact email must be a valid email address");
            }
            faculty.setContactMail(email);
        }
        facultyRepository.save(faculty);
        return getContact(facultyId);
    }

    // ==================== Address ====================
    @Override
    public AddressDTO getAddress(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        AddressDTO dto = new AddressDTO();
        dto.setCurrentAddress(faculty.getCurrentAddress());
        dto.setPermanentAddress(faculty.getPermanentAddress());
        dto.setCity(faculty.getCity());
        dto.setState(faculty.getState());
        dto.setPincode(faculty.getPincode());
        dto.setCurrentCity(faculty.getCurrentCity());
        dto.setCurrentState(faculty.getCurrentState());
        dto.setCurrentPincode(faculty.getCurrentPincode());
        dto.setPermanentCity(faculty.getPermanentCity());
        dto.setPermanentState(faculty.getPermanentState());
        dto.setPermanentPincode(faculty.getPermanentPincode());
        return dto;
    }

    @Override
    public AddressDTO updateAddress(Integer facultyId, AddressDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        if (dto.getCurrentAddress() != null) faculty.setCurrentAddress(dto.getCurrentAddress());
        if (dto.getPermanentAddress() != null) faculty.setPermanentAddress(dto.getPermanentAddress());
        if (dto.getCity() != null) faculty.setCity(dto.getCity());
        if (dto.getState() != null) faculty.setState(dto.getState());
        if (dto.getPincode() != null) faculty.setPincode(dto.getPincode());
        if (dto.getCurrentCity() != null) faculty.setCurrentCity(dto.getCurrentCity());
        if (dto.getCurrentState() != null) faculty.setCurrentState(dto.getCurrentState());
        if (dto.getCurrentPincode() != null) faculty.setCurrentPincode(dto.getCurrentPincode());
        if (dto.getPermanentCity() != null) faculty.setPermanentCity(dto.getPermanentCity());
        if (dto.getPermanentState() != null) faculty.setPermanentState(dto.getPermanentState());
        if (dto.getPermanentPincode() != null) faculty.setPermanentPincode(dto.getPermanentPincode());
        facultyRepository.save(faculty);
        return getAddress(facultyId);
    }

    // ==================== Social Profiles ====================
    @Override
    public SocialProfileDTO getSocialProfiles(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        SocialProfileDTO dto = new SocialProfileDTO();
        dto.setLinkedIn(faculty.getLinkedin());
        dto.setGoogleScholar(faculty.getGoogleScholar());
        dto.setResearchGate(faculty.getResearchGate());
        return dto;
    }

    @Override
    public SocialProfileDTO updateSocialProfiles(Integer facultyId, SocialProfileDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        if (dto.getLinkedIn() != null) faculty.setLinkedin(dto.getLinkedIn());
        if (dto.getGoogleScholar() != null) faculty.setGoogleScholar(dto.getGoogleScholar());
        if (dto.getResearchGate() != null) faculty.setResearchGate(dto.getResearchGate());
        facultyRepository.save(faculty);
        return getSocialProfiles(facultyId);
    }

    // ==================== Education ====================
    @Override
    public List<EducationDTO> getEducation(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        return faculty.getQualifications() != null ? faculty.getQualifications() : new ArrayList<>();
    }

    @Override
    public List<EducationDTO> addEducation(Integer facultyId, EducationDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<EducationDTO> education = faculty.getQualifications() != null ? new ArrayList<>(faculty.getQualifications()) : new ArrayList<>();
        education.add(dto);
        faculty.setQualifications(education);
        facultyRepository.save(faculty);
        return getEducation(facultyId);
    }

    @Override
    public List<EducationDTO> updateEducation(Integer facultyId, int index, EducationDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<EducationDTO> education = faculty.getQualifications() != null ? new ArrayList<>(faculty.getQualifications()) : new ArrayList<>();
        checkIndex(index, education.size());
        education.set(index, dto);
        faculty.setQualifications(education);
        facultyRepository.save(faculty);
        return getEducation(facultyId);
    }

    @Override
    public List<EducationDTO> deleteEducation(Integer facultyId, int index) {
        Faculty faculty = getFaculty(facultyId);
        List<EducationDTO> education = faculty.getQualifications() != null ? new ArrayList<>(faculty.getQualifications()) : new ArrayList<>();
        checkIndex(index, education.size());
        education.remove(index);
        faculty.setQualifications(education);
        facultyRepository.save(faculty);
        return getEducation(facultyId);
    }

    // ==================== Certifications ====================
    @Override
    public List<CertificationDTO> getCertifications(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        return faculty.getCertifications() != null ? faculty.getCertifications() : new ArrayList<>();
    }

    @Override
    public List<CertificationDTO> addCertification(Integer facultyId, CertificationDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<CertificationDTO> certifications = faculty.getCertifications() != null ? new ArrayList<>(faculty.getCertifications()) : new ArrayList<>();
        certifications.add(dto);
        faculty.setCertifications(certifications);
        facultyRepository.save(faculty);
        return getCertifications(facultyId);
    }

    @Override
    public List<CertificationDTO> updateCertification(Integer facultyId, int index, CertificationDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<CertificationDTO> certifications = faculty.getCertifications() != null ? new ArrayList<>(faculty.getCertifications()) : new ArrayList<>();
        checkIndex(index, certifications.size());
        certifications.set(index, dto);
        faculty.setCertifications(certifications);
        facultyRepository.save(faculty);
        return getCertifications(facultyId);
    }

    @Override
    public List<CertificationDTO> deleteCertification(Integer facultyId, int index) {
        Faculty faculty = getFaculty(facultyId);
        List<CertificationDTO> certifications = faculty.getCertifications() != null ? new ArrayList<>(faculty.getCertifications()) : new ArrayList<>();
        checkIndex(index, certifications.size());
        certifications.remove(index);
        faculty.setCertifications(certifications);
        facultyRepository.save(faculty);
        return getCertifications(facultyId);
    }

    // ==================== Work Experience ====================
    @Override
    public List<ExperienceDTO> getExperiences(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        return faculty.getExperiences() != null ? faculty.getExperiences() : new ArrayList<>();
    }

    @Override
    public List<ExperienceDTO> addExperience(Integer facultyId, ExperienceDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<ExperienceDTO> experiences = faculty.getExperiences() != null ? new ArrayList<>(faculty.getExperiences()) : new ArrayList<>();
        experiences.add(dto);
        faculty.setExperiences(experiences);
        facultyRepository.save(faculty);
        return getExperiences(facultyId);
    }

    @Override
    public List<ExperienceDTO> updateExperience(Integer facultyId, int index, ExperienceDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<ExperienceDTO> experiences = faculty.getExperiences() != null ? new ArrayList<>(faculty.getExperiences()) : new ArrayList<>();
        checkIndex(index, experiences.size());
        experiences.set(index, dto);
        faculty.setExperiences(experiences);
        facultyRepository.save(faculty);
        return getExperiences(facultyId);
    }

    @Override
    public List<ExperienceDTO> deleteExperience(Integer facultyId, int index) {
        Faculty faculty = getFaculty(facultyId);
        List<ExperienceDTO> experiences = faculty.getExperiences() != null ? new ArrayList<>(faculty.getExperiences()) : new ArrayList<>();
        checkIndex(index, experiences.size());
        experiences.remove(index);
        faculty.setExperiences(experiences);
        facultyRepository.save(faculty);
        return getExperiences(facultyId);
    }

    // ==================== Skills ====================
    @Override
    public List<SkillDTO> getSkills(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        return faculty.getSkills() != null ? faculty.getSkills() : new ArrayList<>();
    }

    @Override
    public List<SkillDTO> addSkill(Integer facultyId, SkillDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<SkillDTO> skills = faculty.getSkills() != null ? new ArrayList<>(faculty.getSkills()) : new ArrayList<>();
        skills.add(dto);
        faculty.setSkills(skills);
        facultyRepository.save(faculty);
        return getSkills(facultyId);
    }

    @Override
    public List<SkillDTO> updateSkill(Integer facultyId, int index, SkillDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<SkillDTO> skills = faculty.getSkills() != null ? new ArrayList<>(faculty.getSkills()) : new ArrayList<>();
        checkIndex(index, skills.size());
        skills.set(index, dto);
        faculty.setSkills(skills);
        facultyRepository.save(faculty);
        return getSkills(facultyId);
    }

    @Override
    public List<SkillDTO> deleteSkill(Integer facultyId, int index) {
        Faculty faculty = getFaculty(facultyId);
        List<SkillDTO> skills = faculty.getSkills() != null ? new ArrayList<>(faculty.getSkills()) : new ArrayList<>();
        checkIndex(index, skills.size());
        skills.remove(index);
        faculty.setSkills(skills);
        facultyRepository.save(faculty);
        return getSkills(facultyId);
    }

    // ==================== Publications & Research ====================
    @Override
    public List<PublicationDTO> getPublications(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        return faculty.getPublications() != null ? faculty.getPublications() : new ArrayList<>();
    }

    @Override
    public List<PublicationDTO> addPublication(Integer facultyId, PublicationDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<PublicationDTO> publications = faculty.getPublications() != null ? new ArrayList<>(faculty.getPublications()) : new ArrayList<>();
        publications.add(dto);
        faculty.setPublications(publications);
        facultyRepository.save(faculty);
        return getPublications(facultyId);
    }

    @Override
    public List<PublicationDTO> updatePublication(Integer facultyId, int index, PublicationDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<PublicationDTO> publications = faculty.getPublications() != null ? new ArrayList<>(faculty.getPublications()) : new ArrayList<>();
        checkIndex(index, publications.size());
        publications.set(index, dto);
        faculty.setPublications(publications);
        facultyRepository.save(faculty);
        return getPublications(facultyId);
    }

    @Override
    public List<PublicationDTO> deletePublication(Integer facultyId, int index) {
        Faculty faculty = getFaculty(facultyId);
        List<PublicationDTO> publications = faculty.getPublications() != null ? new ArrayList<>(faculty.getPublications()) : new ArrayList<>();
        checkIndex(index, publications.size());
        publications.remove(index);
        faculty.setPublications(publications);
        facultyRepository.save(faculty);
        return getPublications(facultyId);
    }

    // ==================== Awards & Recognitions ====================
    @Override
    public List<AwardDTO> getAwards(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        return faculty.getAwards() != null ? faculty.getAwards() : new ArrayList<>();
    }

    @Override
    public List<AwardDTO> addAward(Integer facultyId, AwardDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<AwardDTO> awards = faculty.getAwards() != null ? new ArrayList<>(faculty.getAwards()) : new ArrayList<>();
        awards.add(dto);
        faculty.setAwards(awards);
        facultyRepository.save(faculty);
        return getAwards(facultyId);
    }

    @Override
    public List<AwardDTO> updateAward(Integer facultyId, int index, AwardDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        List<AwardDTO> awards = faculty.getAwards() != null ? new ArrayList<>(faculty.getAwards()) : new ArrayList<>();
        checkIndex(index, awards.size());
        awards.set(index, dto);
        faculty.setAwards(awards);
        facultyRepository.save(faculty);
        return getAwards(facultyId);
    }

    @Override
    public List<AwardDTO> deleteAward(Integer facultyId, int index) {
        Faculty faculty = getFaculty(facultyId);
        List<AwardDTO> awards = faculty.getAwards() != null ? new ArrayList<>(faculty.getAwards()) : new ArrayList<>();
        checkIndex(index, awards.size());
        awards.remove(index);
        faculty.setAwards(awards);
        facultyRepository.save(faculty);
        return getAwards(facultyId);
    }

    // ==================== Profile Metadata ====================
    @Override
    public MetadataDTO getMetadata(Integer facultyId) {
        Faculty faculty = getFaculty(facultyId);
        MetadataDTO dto = new MetadataDTO();
        dto.setMetadata(faculty.getMetadata());
        return dto;
    }

    @Override
    public MetadataDTO updateMetadata(Integer facultyId, MetadataDTO dto) {
        Faculty faculty = getFaculty(facultyId);
        if (dto.getMetadata() != null) {
            faculty.setMetadata(dto.getMetadata());
        }
        facultyRepository.save(faculty);
        return getMetadata(facultyId);
    }
}

