package com._42students.lms.service.impl;

import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.common.EducationConfig;
import com._42students.lms.dto.profile.*;
import com._42students.lms.model.JobPreferences;
import com._42students.lms.model.Learner;
import com._42students.lms.model.Qualification;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.JobPreferencesRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.QualificationRepository;
import com._42students.lms.service.LearnerProfileService;
import com._42students.lms.util.InputSanitizer;
import com._42students.lms.utils.ContentUrlValidator;
import com._42students.lms.utils.R2StorageUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class LearnerProfileServiceImpl implements LearnerProfileService {

    private static final Logger log = LoggerFactory.getLogger(LearnerProfileServiceImpl.class);

    private static final String INDEX_OUT_OF_BOUNDS_MSG = "Index out of bounds. Please refresh and try again.";
    private static final int IDENTITY_MAX_JSON_SIZE_DEFAULT = 10_000;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    // Same GLOBAL setting FacultyProfileServiceImpl reads -- see its comment.
    private int identityMaxJsonSize() {
        return appSettingsService != null ? appSettingsService.getIdentityMaxJsonSize() : IDENTITY_MAX_JSON_SIZE_DEFAULT;
    }

    private static void checkIndex(int index, int size) {
        if (index < 0 || index >= size) {
            throw new RuntimeException(INDEX_OUT_OF_BOUNDS_MSG);
        }
    }

    @Autowired
    private LearnerRepository learnerRepository;
    
    @Autowired
    private QualificationRepository qualificationRepository;
    
    @Autowired
    private JobPreferencesRepository jobPreferencesRepository;
    
    @Autowired
    private CollegeRepository collegeRepository;

    @Autowired(required = false)
    private ContentUrlValidator contentUrlValidator;

    @Autowired(required = false)
    private R2StorageUtils r2StorageUtils;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.utils.PrivateDocStorage privateDocs;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    private Learner getLearner(Integer learnerId) {
        return learnerRepository.findById(learnerId)
                .orElseThrow(() -> new RuntimeException("Learner not found with id: " + learnerId));
    }
    
    // Helper method to convert Qualification entity to EducationDTO
    private EducationDTO qualificationToDTO(Qualification qualification) {
        EducationDTO dto = new EducationDTO();
        // New structured fields
        dto.setEducationType(qualification.getEducationType());
        dto.setProgram(qualification.getProgram());
        dto.setSpecialization(qualification.getSpecialization());
        dto.setInstitutionName(qualification.getInstitutionName());
        dto.setStartYear(qualification.getStartYear());
        dto.setEndYear(qualification.getEndYear());
        dto.setIsCurrentlyPursuing(qualification.getIsCurrentlyPursuing() != null ? qualification.getIsCurrentlyPursuing() : false);
        dto.setGradingType(qualification.getGradingType());
        dto.setGrade(qualification.getGrade());
        dto.setMaxGrade(qualification.getMaxGrade());
        dto.setIsRecentEducation(qualification.getIsRecentEducation() != null ? qualification.getIsRecentEducation() : false);
        dto.setQualifyingExam(qualification.getQualifyingExam());
        dto.setExamRank(qualification.getExamRank());
        dto.setExamDetails(qualification.getExamDetails()); // Map examDetails JSON
        // Legacy fields (for backward compatibility)
        dto.setDegree(qualification.getDegree());
        dto.setField(qualification.getField());
        dto.setScore(qualification.getScore());
        dto.setDescription(qualification.getDescription());
        dto.setCertificateUpload(qualification.getCertificateUpload());
        return dto;
    }
    
    // Helper method to convert EducationDTO to Qualification entity
    private static String cleanPlain(String value) {
        return value == null ? null : Jsoup.clean(value.trim(), Safelist.none());
    }

    private static String cleanRich(String value) {
        return value == null ? null : Jsoup.clean(value, Safelist.relaxed());
    }

    private Qualification dtoToQualification(EducationDTO dto, Learner learner) {
        Qualification qualification = new Qualification();
        qualification.setLearner(learner);
        // New structured fields — strip all HTML tags from plain-text inputs before persisting
        qualification.setEducationType(cleanPlain(dto.getEducationType()));
        qualification.setProgram(cleanPlain(dto.getProgram()));
        qualification.setSpecialization(cleanPlain(dto.getSpecialization()));
        qualification.setInstitutionName(cleanPlain(dto.getInstitutionName()));
        qualification.setStartYear(dto.getStartYear());
        qualification.setEndYear(dto.getEndYear());
        qualification.setIsCurrentlyPursuing(dto.getIsCurrentlyPursuing() != null ? dto.getIsCurrentlyPursuing() : false);
        qualification.setGradingType(cleanPlain(dto.getGradingType()));
        qualification.setGrade(cleanPlain(dto.getGrade()));
        qualification.setMaxGrade(cleanPlain(dto.getMaxGrade()));
        qualification.setIsRecentEducation(dto.getIsRecentEducation() != null ? dto.getIsRecentEducation() : false);
        qualification.setQualifyingExam(cleanPlain(dto.getQualifyingExam()));
        qualification.setExamRank(cleanPlain(dto.getExamRank()));
        qualification.setExamDetails(dto.getExamDetails()); // Set examDetails JSON
        // Legacy fields (for backward compatibility)
        qualification.setDegree(cleanPlain(dto.getDegree()));
        qualification.setField(cleanPlain(dto.getField()));
        qualification.setScore(cleanPlain(dto.getScore()));
        qualification.setDescription(cleanRich(dto.getDescription()));
        requireOwnMarksheetRef(learner != null ? learner.getId() : null, dto.getCertificateUpload());
        qualification.setCertificateUpload(dto.getCertificateUpload());
        return qualification;
    }
    
    // Helper method to sort qualifications: recent first, then by start year descending
    private List<EducationDTO> sortQualifications(List<EducationDTO> qualifications) {
        return qualifications.stream()
                .sorted(Comparator
                        .comparing((EducationDTO e) -> e.getIsRecentEducation() != null && e.getIsRecentEducation() ? 0 : 1) // Recent first
                        .thenComparing((EducationDTO e) -> {
                            // Sort by start year descending, then end year descending
                            String startYear = e.getStartYear() != null ? e.getStartYear() : "0";
                            String endYear = e.getEndYear() != null ? e.getEndYear() : "0";
                            try {
                                int start = Integer.parseInt(startYear);
                                int end = Integer.parseInt(endYear);
                                return -(start * 10000 + end); // Negative for descending
                            } catch (NumberFormatException ex) {
                                return 0;
                            }
                        }))
                .collect(Collectors.toList());
    }

    // ==================== Profile Header ====================
    @Override
    public ProfileHeaderDTO getHeader(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        ProfileHeaderDTO dto = new ProfileHeaderDTO();
        dto.setFirstName(learner.getFirstName());
        dto.setLastName(learner.getLastName());
        dto.setRollNumber(learner.getRollNumber());
        dto.setDepartment(learner.getDepartment());

        Integer programId = learner.getProgramId();
        Integer collegeId = learner.getCollegeId();
        if ((programId == null || collegeId == null) && scopeResolutionService != null) {
            ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learner);
            if (programId == null) programId = scope.getProgramId();
            if (collegeId == null) collegeId = scope.getCollegeId();
        }
        dto.setProgramId(programId);
        dto.setCollegeId(collegeId);
        dto.setProfileImage(learner.getWebsite());
        return dto;
    }

    @Override
    public ProfileHeaderDTO updateHeader(Integer learnerId, ProfileHeaderDTO dto) {
        Learner learner = getLearner(learnerId);
        String previousProfileImage = learner.getWebsite();
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
            learner.setWebsite(u);
            learnerRepository.save(learner);
            deleteReplacedOwnedR2FileBestEffort(previousProfileImage, learner.getWebsite());
        } else {
            learnerRepository.save(learner);
        }
        return getHeader(learnerId);
    }

    // ==================== About Me ====================
    @Override
    public AboutDTO getAbout(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        AboutDTO dto = new AboutDTO();
        dto.setDescription(learner.getDescription());
        return dto;
    }

    @Override
    public AboutDTO updateAbout(Integer learnerId, AboutDTO dto) {
        Learner learner = getLearner(learnerId);
        if (dto.getDescription() != null) learner.setDescription(InputSanitizer.sanitizePreserveNewlines(dto.getDescription()));
        learnerRepository.save(learner);
        return getAbout(learnerId);
    }

    // ==================== Personal Details ====================
    @Override
    public PersonalDetailsDTO getPersonalDetails(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        PersonalDetailsDTO dto = new PersonalDetailsDTO();
        dto.setGender(learner.getGender());
        dto.setDob(learner.getDob());
        dto.setBloodGroup(learner.getBloodGroup());
        return dto;
    }

    @Override
    public PersonalDetailsDTO updatePersonalDetails(Integer learnerId, PersonalDetailsDTO dto) {
        Learner learner = getLearner(learnerId);
        if (dto.getGender() != null) learner.setGender(dto.getGender());
        if (dto.getDob() != null) learner.setDob(dto.getDob());
        if (dto.getBloodGroup() != null) learner.setBloodGroup(dto.getBloodGroup());
        learnerRepository.save(learner);
        return getPersonalDetails(learnerId);
    }

    // ==================== Identity Documents ====================
    @Override
    public IdentityDTO getIdentity(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        return learner.getIdentity() != null ? learner.getIdentity() : new IdentityDTO();
    }

    @Override
    public IdentityDTO updateIdentity(Integer learnerId, IdentityDTO dto) {
        Learner learner = getLearner(learnerId);
        IdentityDTO previous = learner.getIdentity();
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
        learner.setIdentity(dto);
        learnerRepository.save(learner);
        // Aadhaar/PAN uploads are highly sensitive personal documents (unlike lesson videos/course
        // images) — replacing or clearing them must not leave the previous R2 object reachable/
        // orphaned forever. Mirrors deleteReplacedOwnedR2FileBestEffort above.
        deleteReplacedOwnedR2FileBestEffort(
                previous != null ? previous.getAadhaarUpload() : null,
                dto != null ? dto.getAadhaarUpload() : null);
        deleteReplacedOwnedR2FileBestEffort(
                previous != null ? previous.getPanUpload() : null,
                dto != null ? dto.getPanUpload() : null);
        return getIdentity(learnerId);
    }

    // ==================== Languages ====================
    @Override
    public List<LanguageDTO> getLanguages(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        return learner.getLanguages() != null ? learner.getLanguages() : new ArrayList<>();
    }

    @Override
    public List<LanguageDTO> addLanguage(Integer learnerId, LanguageDTO dto) {
        Learner learner = getLearner(learnerId);
        List<LanguageDTO> languages = learner.getLanguages() != null ? new ArrayList<>(learner.getLanguages()) : new ArrayList<>();
        languages.add(dto);
        learner.setLanguages(languages);
        learnerRepository.save(learner);
        return getLanguages(learnerId);
    }

    @Override
    public List<LanguageDTO> updateLanguage(Integer learnerId, int index, LanguageDTO dto) {
        Learner learner = getLearner(learnerId);
        List<LanguageDTO> languages = learner.getLanguages() != null ? new ArrayList<>(learner.getLanguages()) : new ArrayList<>();
        checkIndex(index, languages.size());
        languages.set(index, dto);
        learner.setLanguages(languages);
        learnerRepository.save(learner);
        return getLanguages(learnerId);
    }

    @Override
    public List<LanguageDTO> deleteLanguage(Integer learnerId, int index) {
        Learner learner = getLearner(learnerId);
        List<LanguageDTO> languages = learner.getLanguages() != null ? new ArrayList<>(learner.getLanguages()) : new ArrayList<>();
        checkIndex(index, languages.size());
        languages.remove(index);
        learner.setLanguages(languages);
        learnerRepository.save(learner);
        return getLanguages(learnerId);
    }

    // ==================== Contact Information ====================
    @Override
    public ContactDTO getContact(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        ContactDTO dto = new ContactDTO();
        dto.setContactMobile(learner.getContactMobile());
        dto.setContactPhone(learner.getContactPhone());
        dto.setContactMail(learner.getContactMail());
        return dto;
    }

    @Override
    public ContactDTO updateContact(Integer learnerId, ContactDTO dto) {
        Learner learner = getLearner(learnerId);
        
        // Validate and update contactMobile (Primary - Required)
        if (dto.getContactMobile() != null && !dto.getContactMobile().trim().isEmpty()) {
            String mobile = dto.getContactMobile().trim();
            // Validate mobile format: 10 digits
            if (!mobile.matches("^[0-9]{10}$")) {
                throw new RuntimeException("Primary mobile number must be exactly 10 digits");
            }
            learner.setContactMobile(mobile);
        }
        
        // Validate and update contactPhone (Alternate - Optional)
        if (dto.getContactPhone() != null && !dto.getContactPhone().trim().isEmpty()) {
            String phone = dto.getContactPhone().trim();
            // Validate phone format: 10-15 digits (allows landline with area code)
            if (!phone.matches("^[0-9]{10,15}$")) {
                throw new RuntimeException("Alternate phone number must be 10-15 digits");
            }
            // Business rule: contactPhone cannot equal contactMobile
            String currentMobile = dto.getContactMobile() != null ? dto.getContactMobile().trim() : learner.getContactMobile();
            if (phone.equals(currentMobile)) {
                throw new RuntimeException("Alternate phone number cannot be the same as primary mobile number");
            }
            learner.setContactPhone(phone);
        } else {
            // Allow clearing alternate phone
            learner.setContactPhone(null);
        }
        
        // Business rule: If contactPhone exists, contactMobile must exist
        if (learner.getContactPhone() != null && (learner.getContactMobile() == null || learner.getContactMobile().trim().isEmpty())) {
            throw new RuntimeException("Primary mobile number is required when alternate phone is provided");
        }
        
        if (dto.getContactMail() != null && !dto.getContactMail().trim().isEmpty()) {
            String email = dto.getContactMail().trim();
            if (!email.matches("^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$")) {
                throw new RuntimeException("Contact email must be a valid email address");
            }
            learner.setContactMail(email);
        }
        learnerRepository.save(learner);
        return getContact(learnerId);
    }

    // ==================== Address ====================
    @Override
    public AddressDTO getAddress(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        AddressDTO dto = new AddressDTO();
        dto.setCurrentAddress(learner.getCurrentAddress());
        dto.setPermanentAddress(learner.getPermanentAddress());
        dto.setCity(learner.getCity());
        dto.setState(learner.getState());
        dto.setPincode(learner.getPincode());
        dto.setCurrentCity(learner.getCurrentCity());
        dto.setCurrentState(learner.getCurrentState());
        dto.setCurrentPincode(learner.getCurrentPincode());
        dto.setPermanentCity(learner.getPermanentCity());
        dto.setPermanentState(learner.getPermanentState());
        dto.setPermanentPincode(learner.getPermanentPincode());
        return dto;
    }

    @Override
    public AddressDTO updateAddress(Integer learnerId, AddressDTO dto) {
        Learner learner = getLearner(learnerId);
        if (dto.getCurrentAddress() != null) learner.setCurrentAddress(dto.getCurrentAddress());
        if (dto.getPermanentAddress() != null) learner.setPermanentAddress(dto.getPermanentAddress());
        if (dto.getCity() != null) learner.setCity(dto.getCity());
        if (dto.getState() != null) learner.setState(dto.getState());
        if (dto.getPincode() != null) learner.setPincode(dto.getPincode());
        if (dto.getCurrentCity() != null) learner.setCurrentCity(dto.getCurrentCity());
        if (dto.getCurrentState() != null) learner.setCurrentState(dto.getCurrentState());
        if (dto.getCurrentPincode() != null) learner.setCurrentPincode(dto.getCurrentPincode());
        if (dto.getPermanentCity() != null) learner.setPermanentCity(dto.getPermanentCity());
        if (dto.getPermanentState() != null) learner.setPermanentState(dto.getPermanentState());
        if (dto.getPermanentPincode() != null) learner.setPermanentPincode(dto.getPermanentPincode());
        learnerRepository.save(learner);
        return getAddress(learnerId);
    }

    // ==================== Social Profiles ====================
    @Override
    public SocialProfileDTO getSocialProfiles(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        SocialProfileDTO dto = new SocialProfileDTO();
        dto.setLinkedIn(learner.getLinkedin());
        dto.setGithub(learner.getGithub());
        dto.setPortfolio(learner.getPortfolio());
        dto.setTwitter(learner.getTwitter());
        Map<String, String> coding = learner.getCodingProfiles() == null ? new java.util.LinkedHashMap<>() : learner.getCodingProfiles();
        dto.setCodingProfiles(coding);
        dto.setCodingProfileLinks(com._42students.lms.common.CodingPlatforms.describe(coding));
        return dto;
    }

    @Override
    public SocialProfileDTO updateSocialProfiles(Integer learnerId, SocialProfileDTO dto) {
        Learner learner = getLearner(learnerId);
        if (dto.getLinkedIn() != null) learner.setLinkedin(dto.getLinkedIn());
        if (dto.getGithub() != null) learner.setGithub(dto.getGithub());
        if (dto.getPortfolio() != null) learner.setPortfolio(dto.getPortfolio());
        if (dto.getTwitter() != null) learner.setTwitter(dto.getTwitter());
        if (dto.getCodingProfiles() != null) learner.setCodingProfiles(com._42students.lms.common.CodingPlatforms.normalize(dto.getCodingProfiles()));
        learnerRepository.save(learner);
        return getSocialProfiles(learnerId);
    }

    // ==================== Education ====================
    @Override
    public List<EducationDTO> getEducation(Integer learnerId) {
        // Get qualifications from the new table
        List<Qualification> qualifications = qualificationRepository.findByLearnerIdAndIsDeletedFalse(learnerId);
        
        // Convert to DTOs
        List<EducationDTO> educationDTOs = qualifications.stream()
                .map(this::qualificationToDTO)
                .collect(Collectors.toList());
        
        // Sort: recent education first, then by start year descending
        return sortQualifications(educationDTOs);
    }
    
    public EducationConfigDTO getEducationConfig() {
        return EducationConfig.getEducationConfig();
    }
    
    /**
     * Every education must have grading type, grade obtained, and max grade (required for job screening).
     */
    private void validateGradeAndMaxGrade(EducationDTO dto) {
        boolean hasGradingType = dto.getGradingType() != null && !dto.getGradingType().trim().isEmpty();
        boolean hasGrade = dto.getGrade() != null && !dto.getGrade().trim().isEmpty();
        boolean hasMaxGrade = dto.getMaxGrade() != null && !dto.getMaxGrade().trim().isEmpty();
        if (!hasGradingType) {
            throw new IllegalArgumentException("Grading type is required for every education entry.");
        }
        if (!hasGrade) {
            throw new IllegalArgumentException("Grade obtained is required.");
        }
        if (!hasMaxGrade) {
            throw new IllegalArgumentException("Max grade is required for job screening. Please enter the maximum scale (e.g. 10 for CGPA, 100 for Percentage).");
        }
    }

    // Get grading types (kept as static config for now)
    private static final String[] GRADING_TYPES = {"CGPA", "Percentage", "Grade", "GPA"};
    
    public String[] getGradingTypes() {
        return GRADING_TYPES;
    }
    
    // Get colleges for institution name autocomplete (from LMS colleges table)
    public List<String> getColleges(String searchQuery) {
        if (collegeRepository == null) return java.util.Collections.emptyList();
        String q = (searchQuery != null && !searchQuery.trim().isEmpty()) ? searchQuery.trim() : null;
        return collegeRepository.searchCollegeNames(q);
    }

    @Override
    public List<EducationDTO> addEducation(Integer learnerId, EducationDTO dto) {
        validateGradeAndMaxGrade(dto);
        Learner learner = getLearner(learnerId);
        Qualification qualification = dtoToQualification(dto, learner);
        qualificationRepository.save(qualification);
        return getEducation(learnerId);
    }

    @Override
    public List<EducationDTO> updateEducation(Integer learnerId, int index, EducationDTO dto) {
        validateGradeAndMaxGrade(dto);
        List<Qualification> qualifications = qualificationRepository.findByLearnerIdAndIsDeletedFalse(learnerId);
        checkIndex(index, qualifications.size());
        {
            Qualification qualification = qualifications.get(index);
            // Update new structured fields — strip all HTML tags from plain-text inputs before persisting
            if (dto.getEducationType() != null) qualification.setEducationType(cleanPlain(dto.getEducationType()));
            if (dto.getProgram() != null) qualification.setProgram(cleanPlain(dto.getProgram()));
            if (dto.getSpecialization() != null) qualification.setSpecialization(cleanPlain(dto.getSpecialization()));
            if (dto.getInstitutionName() != null) qualification.setInstitutionName(cleanPlain(dto.getInstitutionName()));
            if (dto.getStartYear() != null) qualification.setStartYear(dto.getStartYear());
            if (dto.getEndYear() != null) qualification.setEndYear(dto.getEndYear());
            qualification.setIsCurrentlyPursuing(dto.getIsCurrentlyPursuing() != null ? dto.getIsCurrentlyPursuing() : false);
            if (dto.getGradingType() != null) qualification.setGradingType(cleanPlain(dto.getGradingType()));
            if (dto.getGrade() != null) qualification.setGrade(cleanPlain(dto.getGrade()));
            // Allow clearing maxGrade when client sends null
            qualification.setMaxGrade(cleanPlain(dto.getMaxGrade()));
            qualification.setIsRecentEducation(dto.getIsRecentEducation() != null ? dto.getIsRecentEducation() : false);
            if (dto.getQualifyingExam() != null) qualification.setQualifyingExam(cleanPlain(dto.getQualifyingExam()));
            if (dto.getExamRank() != null) qualification.setExamRank(cleanPlain(dto.getExamRank()));
            if (dto.getExamDetails() != null) qualification.setExamDetails(dto.getExamDetails()); // Update examDetails
            // Update legacy fields
            if (dto.getDegree() != null) qualification.setDegree(cleanPlain(dto.getDegree()));
            if (dto.getField() != null) qualification.setField(cleanPlain(dto.getField()));
            if (dto.getScore() != null) qualification.setScore(cleanPlain(dto.getScore()));
            if (dto.getDescription() != null) qualification.setDescription(cleanRich(dto.getDescription()));
            if (dto.getCertificateUpload() != null) {
                requireOwnMarksheetRef(learnerId, dto.getCertificateUpload());
                qualification.setCertificateUpload(dto.getCertificateUpload());
            }
            qualificationRepository.save(qualification);
        }
        return getEducation(learnerId);
    }

    @Override
    public List<EducationDTO> deleteEducation(Integer learnerId, int index) {
        List<Qualification> qualifications = qualificationRepository.findByLearnerIdAndIsDeletedFalse(learnerId);
        checkIndex(index, qualifications.size());
        Qualification qualification = qualifications.get(index);
        qualification.setIsDeleted(true);
        qualificationRepository.save(qualification);
        return getEducation(learnerId);
    }

    // ==================== Certifications ====================
    @Override
    public List<CertificationDTO> getCertifications(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        return learner.getCertifications() != null ? learner.getCertifications() : new ArrayList<>();
    }

    @Override
    public List<CertificationDTO> addCertification(Integer learnerId, CertificationDTO dto) {
        Learner learner = getLearner(learnerId);
        List<CertificationDTO> certifications = learner.getCertifications() != null ? new ArrayList<>(learner.getCertifications()) : new ArrayList<>();
        dto.setName(InputSanitizer.sanitize(dto.getName()));
        dto.setAuthority(InputSanitizer.sanitize(dto.getAuthority()));
        dto.setCertificateLink(InputSanitizer.sanitizeUrl(dto.getCertificateLink()));
        certifications.add(dto);
        learner.setCertifications(certifications);
        learnerRepository.save(learner);
        return getCertifications(learnerId);
    }

    @Override
    public List<CertificationDTO> updateCertification(Integer learnerId, int index, CertificationDTO dto) {
        Learner learner = getLearner(learnerId);
        List<CertificationDTO> certifications = learner.getCertifications() != null ? new ArrayList<>(learner.getCertifications()) : new ArrayList<>();
        checkIndex(index, certifications.size());
        dto.setName(InputSanitizer.sanitize(dto.getName()));
        dto.setAuthority(InputSanitizer.sanitize(dto.getAuthority()));
        dto.setCertificateLink(InputSanitizer.sanitizeUrl(dto.getCertificateLink()));
        certifications.set(index, dto);
        learner.setCertifications(certifications);
        learnerRepository.save(learner);
        return getCertifications(learnerId);
    }

    @Override
    public List<CertificationDTO> deleteCertification(Integer learnerId, int index) {
        Learner learner = getLearner(learnerId);
        List<CertificationDTO> certifications = learner.getCertifications() != null ? new ArrayList<>(learner.getCertifications()) : new ArrayList<>();
        checkIndex(index, certifications.size());
        certifications.remove(index);
        learner.setCertifications(certifications);
        learnerRepository.save(learner);
        return getCertifications(learnerId);
    }

    // ==================== Academic Achievements ====================
    @Override
    public List<AchievementDTO> getAchievements(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        return learner.getAchievements() != null ? learner.getAchievements() : new ArrayList<>();
    }

    private AchievementDTO sanitizeAchievement(AchievementDTO dto) {
        if (dto.getTitle() != null) dto.setTitle(InputSanitizer.sanitize(dto.getTitle()));
        if (dto.getYear() != null) dto.setYear(InputSanitizer.sanitize(dto.getYear()));
        if (dto.getDescription() != null) dto.setDescription(InputSanitizer.sanitizePreserveNewlines(dto.getDescription()));
        return dto;
    }

    @Override
    public List<AchievementDTO> addAchievement(Integer learnerId, AchievementDTO dto) {
        Learner learner = getLearner(learnerId);
        List<AchievementDTO> achievements = learner.getAchievements() != null ? new ArrayList<>(learner.getAchievements()) : new ArrayList<>();
        achievements.add(sanitizeAchievement(dto));
        learner.setAchievements(achievements);
        learnerRepository.save(learner);
        return getAchievements(learnerId);
    }

    @Override
    public List<AchievementDTO> updateAchievement(Integer learnerId, int index, AchievementDTO dto) {
        Learner learner = getLearner(learnerId);
        List<AchievementDTO> achievements = learner.getAchievements() != null ? new ArrayList<>(learner.getAchievements()) : new ArrayList<>();
        checkIndex(index, achievements.size());
        achievements.set(index, sanitizeAchievement(dto));
        learner.setAchievements(achievements);
        learnerRepository.save(learner);
        return getAchievements(learnerId);
    }

    @Override
    public List<AchievementDTO> deleteAchievement(Integer learnerId, int index) {
        Learner learner = getLearner(learnerId);
        List<AchievementDTO> achievements = learner.getAchievements() != null ? new ArrayList<>(learner.getAchievements()) : new ArrayList<>();
        checkIndex(index, achievements.size());
        achievements.remove(index);
        learner.setAchievements(achievements);
        learnerRepository.save(learner);
        return getAchievements(learnerId);
    }

    // ==================== Skills ====================
    @Override
    public List<SkillDTO> getSkills(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        return learner.getSkills() != null ? learner.getSkills() : new ArrayList<>();
    }

    // Skill (skill name/proficiency) is free text entered by the learner and read back by
    // admin/faculty viewing this profile (requireAccessLearner allows self_or_scope access, not
    // just the owning learner) and by placements filtering/screening — the same learner-facing
    // free-text pattern already sanitized for achievements/certifications/projects above. This
    // was previously stored raw, unlike its siblings, leaving a stored-XSS gap where a malicious
    // skill name would round-trip unescaped to any admin/faculty viewer of the learner's profile.
    private SkillDTO sanitizeSkill(SkillDTO dto) {
        if (dto.getSkill() != null) dto.setSkill(InputSanitizer.sanitize(dto.getSkill()));
        if (dto.getProficiency() != null) dto.setProficiency(InputSanitizer.sanitize(dto.getProficiency()));
        return dto;
    }

    @Override
    public List<SkillDTO> addSkill(Integer learnerId, SkillDTO dto) {
        Learner learner = getLearner(learnerId);
        List<SkillDTO> skills = learner.getSkills() != null ? new ArrayList<>(learner.getSkills()) : new ArrayList<>();
        skills.add(sanitizeSkill(dto));
        learner.setSkills(skills);
        learnerRepository.save(learner);
        return getSkills(learnerId);
    }

    @Override
    public List<SkillDTO> updateSkill(Integer learnerId, int index, SkillDTO dto) {
        Learner learner = getLearner(learnerId);
        List<SkillDTO> skills = learner.getSkills() != null ? new ArrayList<>(learner.getSkills()) : new ArrayList<>();
        checkIndex(index, skills.size());
        skills.set(index, sanitizeSkill(dto));
        learner.setSkills(skills);
        learnerRepository.save(learner);
        return getSkills(learnerId);
    }

    @Override
    public List<SkillDTO> deleteSkill(Integer learnerId, int index) {
        Learner learner = getLearner(learnerId);
        List<SkillDTO> skills = learner.getSkills() != null ? new ArrayList<>(learner.getSkills()) : new ArrayList<>();
        checkIndex(index, skills.size());
        skills.remove(index);
        learner.setSkills(skills);
        learnerRepository.save(learner);
        return getSkills(learnerId);
    }

    // ==================== Projects ====================
    @Override
    public List<ProjectDTO> getProjects(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        return learner.getProjects() != null ? learner.getProjects() : new ArrayList<>();
    }

    private ProjectDTO sanitizeProject(ProjectDTO dto) {
        if (dto.getName() != null) dto.setName(InputSanitizer.sanitize(dto.getName()));
        if (dto.getDescription() != null) dto.setDescription(InputSanitizer.sanitizePreserveNewlines(dto.getDescription()));
        if (dto.getGithubUrl() != null) dto.setGithubUrl(InputSanitizer.sanitizeUrl(dto.getGithubUrl()));
        if (dto.getLiveUrl() != null) dto.setLiveUrl(InputSanitizer.sanitizeUrl(dto.getLiveUrl()));
        if (dto.getSkillsUsed() != null) {
            dto.setSkillsUsed(dto.getSkillsUsed().stream()
                .map(InputSanitizer::sanitize)
                .collect(java.util.stream.Collectors.toList()));
        }
        return dto;
    }

    @Override
    public List<ProjectDTO> addProject(Integer learnerId, ProjectDTO dto) {
        Learner learner = getLearner(learnerId);
        List<ProjectDTO> projects = learner.getProjects() != null ? new ArrayList<>(learner.getProjects()) : new ArrayList<>();
        projects.add(sanitizeProject(dto));
        learner.setProjects(projects);
        learnerRepository.save(learner);
        return getProjects(learnerId);
    }

    @Override
    public List<ProjectDTO> updateProject(Integer learnerId, int index, ProjectDTO dto) {
        Learner learner = getLearner(learnerId);
        List<ProjectDTO> projects = learner.getProjects() != null ? new ArrayList<>(learner.getProjects()) : new ArrayList<>();
        checkIndex(index, projects.size());
        projects.set(index, sanitizeProject(dto));
        learner.setProjects(projects);
        learnerRepository.save(learner);
        return getProjects(learnerId);
    }

    @Override
    public List<ProjectDTO> deleteProject(Integer learnerId, int index) {
        Learner learner = getLearner(learnerId);
        List<ProjectDTO> projects = learner.getProjects() != null ? new ArrayList<>(learner.getProjects()) : new ArrayList<>();
        checkIndex(index, projects.size());
        projects.remove(index);
        learner.setProjects(projects);
        learnerRepository.save(learner);
        return getProjects(learnerId);
    }

    // ==================== Experiences/Internships ====================
    @Override
    public List<ExperienceDTO> getExperiences(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        return learner.getExperiences() != null ? learner.getExperiences() : new ArrayList<>();
    }

    @Override
    public List<ExperienceDTO> addExperience(Integer learnerId, ExperienceDTO dto) {
        Learner learner = getLearner(learnerId);
        List<ExperienceDTO> experiences = learner.getExperiences() != null ? new ArrayList<>(learner.getExperiences()) : new ArrayList<>();
        experiences.add(dto);
        learner.setExperiences(experiences);
        learnerRepository.save(learner);
        return getExperiences(learnerId);
    }

    @Override
    public List<ExperienceDTO> updateExperience(Integer learnerId, int index, ExperienceDTO dto) {
        Learner learner = getLearner(learnerId);
        List<ExperienceDTO> experiences = learner.getExperiences() != null ? new ArrayList<>(learner.getExperiences()) : new ArrayList<>();
        checkIndex(index, experiences.size());
        experiences.set(index, dto);
        learner.setExperiences(experiences);
        learnerRepository.save(learner);
        return getExperiences(learnerId);
    }

    @Override
    public List<ExperienceDTO> deleteExperience(Integer learnerId, int index) {
        Learner learner = getLearner(learnerId);
        List<ExperienceDTO> experiences = learner.getExperiences() != null ? new ArrayList<>(learner.getExperiences()) : new ArrayList<>();
        checkIndex(index, experiences.size());
        experiences.remove(index);
        learner.setExperiences(experiences);
        learnerRepository.save(learner);
        return getExperiences(learnerId);
    }

    // ==================== Extra-curricular ====================
    @Override
    public List<ExtracurricularDTO> getExtracurricular(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        return learner.getExtracurricular() != null ? learner.getExtracurricular() : new ArrayList<>();
    }

    @Override
    public List<ExtracurricularDTO> addExtracurricular(Integer learnerId, ExtracurricularDTO dto) {
        Learner learner = getLearner(learnerId);
        List<ExtracurricularDTO> activities = learner.getExtracurricular() != null ? new ArrayList<>(learner.getExtracurricular()) : new ArrayList<>();
        activities.add(dto);
        learner.setExtracurricular(activities);
        learnerRepository.save(learner);
        return getExtracurricular(learnerId);
    }

    @Override
    public List<ExtracurricularDTO> updateExtracurricular(Integer learnerId, int index, ExtracurricularDTO dto) {
        Learner learner = getLearner(learnerId);
        List<ExtracurricularDTO> activities = learner.getExtracurricular() != null ? new ArrayList<>(learner.getExtracurricular()) : new ArrayList<>();
        checkIndex(index, activities.size());
        activities.set(index, dto);
        learner.setExtracurricular(activities);
        learnerRepository.save(learner);
        return getExtracurricular(learnerId);
    }

    @Override
    public List<ExtracurricularDTO> deleteExtracurricular(Integer learnerId, int index) {
        Learner learner = getLearner(learnerId);
        List<ExtracurricularDTO> activities = learner.getExtracurricular() != null ? new ArrayList<>(learner.getExtracurricular()) : new ArrayList<>();
        checkIndex(index, activities.size());
        activities.remove(index);
        learner.setExtracurricular(activities);
        learnerRepository.save(learner);
        return getExtracurricular(learnerId);
    }

    // ==================== Hobbies & Interests ====================
    @Override
    public List<HobbyDTO> getHobbies(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        return learner.getHobbies() != null ? learner.getHobbies() : new ArrayList<>();
    }

    @Override
    public List<HobbyDTO> updateHobbies(Integer learnerId, List<HobbyDTO> hobbies) {
        Learner learner = getLearner(learnerId);
        learner.setHobbies(hobbies);
        learnerRepository.save(learner);
        return getHobbies(learnerId);
    }

    // ==================== Video Intro ====================
    @Override
    public VideoIntroDTO getVideoIntro(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        VideoIntroDTO dto = new VideoIntroDTO();
        // Video intro now stores a plain public R2 URL at upload time (same as lesson video,
        // course images, and everything else in this app except video-intro/resume used to) —
        // no signing step exists anymore, so there's nothing left for a separate playback-url
        // endpoint to protect. Access is gated once, here, by requireAccessLearner in the
        // controller (self, or faculty/admin) — the same gate the deleted playback-url endpoint
        // used to apply per-request.
        dto.setVideoIntroUrl(playableVideoIntroUrl(learner.getVideoIntroUrl()));
        dto.setHasVideoIntro(learner.getVideoIntroUrl() != null && !learner.getVideoIntroUrl().isEmpty());
        if (learner.getVideoIntroUploadedAt() != null) {
            dto.setUploadedAt(learner.getVideoIntroUploadedAt().toString());
        }
        return dto;
    }

    // Intros uploaded before the switch to public URLs were saved as a bare storage key
    // ("org-6/college-6/video-intros/user-164/....webm"). The profile now plays the value as-is, so a
    // key became a relative link to the site itself and the video never loaded. Turn a key into its
    // public URL on the way out; the stored value is left untouched.
    String playableVideoIntroUrl(String stored) {
        if (stored == null) return null;
        String v = stored.trim();
        if (v.isEmpty() || v.startsWith("https://") || v.startsWith("http://") || r2StorageUtils == null) return stored;
        String base = r2StorageUtils.getPublicUrlBase();
        return base != null ? base + (v.startsWith("/") ? v.substring(1) : v) : stored;
    }

    @Override
    public VideoIntroDTO updateVideoIntro(Integer learnerId, VideoIntroDTO dto) {
        Learner learner = getLearner(learnerId);
        
        // Check if video intro already exists (one-time only restriction)
        if (learner.getVideoIntroUploadedAt() != null && dto.getVideoIntroUrl() != null) {
            throw new RuntimeException("Video intro can only be uploaded once. It has already been uploaded.");
        }
        
        String videoUrl = dto != null ? dto.getVideoIntroUrl() : null;
        if (videoUrl != null && !videoUrl.trim().isEmpty()) {
            String u = videoUrl.trim();
            if (contentUrlValidator != null
                    && !contentUrlValidator.isAllowedContentUrl(u)
                    && !contentUrlValidator.isAllowedStorageKey(u)) {
                throw new RuntimeException("Video intro URL or storage key is not allowed.");
            }
            learner.setVideoIntroUrl(u);
            learner.setVideoIntroUploadedAt(new java.sql.Timestamp(System.currentTimeMillis()));
        }
        learnerRepository.save(learner);
        return getVideoIntro(learnerId);
    }

    // ==================== Profile Metadata ====================
    @Override
    public MetadataDTO getMetadata(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        MetadataDTO dto = new MetadataDTO();
        dto.setMetadata(learner.getMetadata());
        return dto;
    }

    @Override
    public MetadataDTO updateMetadata(Integer learnerId, MetadataDTO dto) {
        Learner learner = getLearner(learnerId);
        if (dto.getMetadata() != null) {
            learner.setMetadata(dto.getMetadata());
        }
        learnerRepository.save(learner);
        return getMetadata(learnerId);
    }

    // ==================== Job Preferences ====================
    @Override
    public JobPreferencesDTO getJobPreferences(Integer learnerId) {
        getLearner(learnerId); // Validate learner exists
        JobPreferences jobPreferences = jobPreferencesRepository.findByLearnerIdAndIsDeletedFalse(learnerId)
                .orElse(null);
        
        JobPreferencesDTO dto = new JobPreferencesDTO();
        if (jobPreferences != null) {
            dto.setRolePreference(jobPreferences.getRolePreference());
            dto.setSpecificRolePreference(jobPreferences.getSpecificRolePreference());
            dto.setWorkShiftPreference(jobPreferences.getWorkShiftPreference());
            dto.setPreferredEmploymentCity(jobPreferences.getPreferredEmploymentCity());
            dto.setExamSlotPreference(jobPreferences.getExamSlotPreference());
            dto.setJobNotificationsEnabled(jobPreferences.getJobNotificationsEnabled());
        } else {
            dto.setJobNotificationsEnabled(true);
        }
        return dto;
    }

    @Override
    public JobPreferencesDTO updateJobPreferences(Integer learnerId, JobPreferencesDTO dto) {
        Learner learner = getLearner(learnerId);
        JobPreferences jobPreferences = jobPreferencesRepository.findByLearnerIdAndIsDeletedFalse(learnerId)
                .orElse(new JobPreferences());
        
        // Set learner if it's a new record
        if (jobPreferences.getId() == 0) {
            jobPreferences.setLearner(learner);
        }
        
        // Update fields
        if (dto.getRolePreference() != null) {
            jobPreferences.setRolePreference(dto.getRolePreference().trim());
        }
        if (dto.getSpecificRolePreference() != null) {
            jobPreferences.setSpecificRolePreference(dto.getSpecificRolePreference().trim());
        }
        if (dto.getWorkShiftPreference() != null) {
            jobPreferences.setWorkShiftPreference(dto.getWorkShiftPreference().trim());
        }
        if (dto.getPreferredEmploymentCity() != null) {
            jobPreferences.setPreferredEmploymentCity(dto.getPreferredEmploymentCity().trim());
        }
        if (dto.getExamSlotPreference() != null) {
            jobPreferences.setExamSlotPreference(dto.getExamSlotPreference().trim());
        }
        if (dto.getJobNotificationsEnabled() != null) {
            jobPreferences.setJobNotificationsEnabled(dto.getJobNotificationsEnabled());
        }

        jobPreferencesRepository.save(jobPreferences);
        return getJobPreferences(learnerId);
    }

    @Override
    public ResumeUrlDTO getResume(Integer learnerId) {
        Learner learner = getLearner(learnerId);
        ResumeUrlDTO dto = new ResumeUrlDTO();
        dto.setResumeUrl(learner.getResumeUrl());
        return dto;
    }

    @Override
    public ResumeUrlDTO updateResume(Integer learnerId, String resumeUrl) {
        Learner learner = getLearner(learnerId);
        String previousResumeUrl = learner.getResumeUrl();
        if (resumeUrl != null && !resumeUrl.trim().isEmpty()) {
            String sanitized = InputSanitizer.sanitizeUrl(resumeUrl.trim());
            if (sanitized == null || !sanitized.startsWith("https://")) {
                throw new RuntimeException("Resume URL must be a valid https URL");
            }
            if (contentUrlValidator == null) {
                throw new RuntimeException("Storage URL validation is not configured");
            }
            if (!contentUrlValidator.isAllowedContentUrl(sanitized) && !contentUrlValidator.isAllowedStorageKey(sanitized)) {
                throw new RuntimeException("Resume URL or storage key is not allowed.");
            }
            learner.setResumeUrl(sanitized);
        } else {
            learner.setResumeUrl(null);
        }
        learnerRepository.save(learner);
        // A resume is a private document (unlike lesson videos/course images) — replacing or
        // clearing it must not leave the previous R2 object reachable/orphaned forever. Mirrors
        // LessonContentsServiceImpl's deleteReplacedR2FileBestEffort for the same reason.
        deleteReplacedOwnedR2FileBestEffort(previousResumeUrl, learner.getResumeUrl());
        return getResume(learnerId);
    }

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

    // getResumePlaybackUrl removed: getResume() above already returned the raw stored URL
    // unnulled (unlike video-intro, this one was never actually hiding anything), so this
    // presigned-URL endpoint was pure redundant overhead — every caller already had a usable URL
    // from getResume() before ever calling this. Deleted rather than converted, since there was
    // nothing left for it to protect that getResume() doesn't already expose.

    /** A marksheet in the private bucket must be this learner's own (opening it re-checks the owner as well). */
    private static void requireOwnMarksheetRef(Integer learnerId, String ref) {
        if (com._42students.lms.utils.PrivateDocStorage.isRef(ref)
                && !com._42students.lms.utils.PrivateDocStorage.keyOf(ref).contains("/marksheets/user-" + learnerId + "/")) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "The marksheet must be your own upload");
        }
    }
}
