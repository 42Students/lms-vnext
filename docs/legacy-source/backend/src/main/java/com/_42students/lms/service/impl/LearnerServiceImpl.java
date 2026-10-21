package com._42students.lms.service.impl;

import com._42students.lms.dto.profile.ExperienceDTO;
import com._42students.lms.dto.profile.SkillDTO;
import com._42students.lms.dto.request.AttendanceDTO;
import com._42students.lms.dto.request.BulkLearnerItem;
import com._42students.lms.dto.request.BulkRegisterRequest;
import com._42students.lms.dto.request.BulkValidateRequest;
import com._42students.lms.dto.request.LearnerDTO;
import com._42students.lms.dto.request.NotificationRecipientDTO;
import com._42students.lms.dto.request.ProgramDTO;
import com._42students.lms.dto.response.BulkRegisterFailedItem;
import com._42students.lms.dto.response.BulkRegisterResponse;
import com._42students.lms.dto.response.BulkValidateResponse;
import com._42students.lms.enums.NotificationEvent;
import com._42students.lms.dto.response.LearnerResponseDTO;
import com._42students.lms.model.Attend;
import com._42students.lms.model.ClassSchedule;
import com._42students.lms.model.Course;
import com._42students.lms.model.Learner;
import com._42students.lms.model._Class;
import com._42students.lms.model.Department;
import com._42students.lms.model.NewProgram;
import com._42students.lms.repository.AttendanceRepository;
import com._42students.lms.repository.ClassScheduleRepository;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.dto.response.NewProgramResponseDTO;
import com._42students.lms.service.LearnerService;
import com._42students.lms.service.NewProgramService;
import com._42students.lms.service.NotificationDispatcherService;
import com._42students.lms.service.NotificationService;
import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.service.NotificationTemplateContextResolver;
import com._42students.lms.service.ClassService;
import com._42students.lms.service.SmsService;
import com._42students.lms.service.ZeptoMailService;
import com._42students.lms.util.InputSanitizer;
import com._42students.lms.util.OnboardingMobileNumber;
import com._42students.lms.util.JobVisibilityCache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class LearnerServiceImpl implements LearnerService {

    Logger logger = LoggerFactory.getLogger(LearnerServiceImpl.class);

    // Self-injected proxy, used only so bulkRegister's per-row call to saveBulkLearnerRow goes
    // through Spring's transactional proxy (and therefore actually gets its own REQUIRES_NEW
    // transaction) instead of a bare self-invocation, which bypasses AOP entirely and would
    // silently run every row in the caller's transaction. @Lazy avoids an eager
    // circular-construction issue on startup.
    @Autowired
    @org.springframework.context.annotation.Lazy
    private LearnerService self;

    @Autowired
    CourseRepository studentCourseRepository;

    @Autowired
    ClassScheduleRepository classScheduleRepository;

    @Autowired
    LearnerRepository learnerRepository;

    @Autowired
    AttendanceRepository attendanceRepository;
    
    @Autowired
    NewProgramService newProgramService;
    
    @Autowired(required = false)
    private ClassService classService;

    @Autowired
    private _ClassRepository classRepository;

    @Autowired
    private NewProgramRepository newProgramRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired(required = false)
    private com._42students.lms.repository.JobApplicationRepository jobApplicationRepository;

    @Autowired
    private JobVisibilityCache jobVisibilityCache;

    @Autowired
    RestTemplate restTemplate;
    
    @Autowired(required = false)
    private ZeptoMailService zeptoMailService;
    
    @Autowired(required = false)
    private SmsService smsService;
    
    @Autowired(required = false)
    private NotificationService notificationService;

    @Autowired(required = false)
    private NotificationDispatcherService notificationDispatcherService;
    
    @Autowired
    private NotificationTemplateContextResolver contextResolver;

    @Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    @Autowired
    private com._42students.lms.access.ScopeResolutionService scopeResolutionService;


    @Override
    @Transactional(rollbackFor = Exception.class)
    public Learner register(LearnerDTO learnerDTO) {
        if (learnerDTO == null) {
            throw new RuntimeException("Learner details are required.");
        }

        // SECURITY: /register is for creating NEW learners only. It must never be usable
        // to update an existing learner's record (e.g. contactMobile, which is the OTP-login
        // identifier) since this endpoint performs no ownership/college-access check, unlike
        // the properly-guarded PUT /api/v1/learner/update/{id} endpoint.
        if (learnerDTO.getLearnerId() != null && learnerDTO.getLearnerId() != 0) {
            Learner existingLearner = getLearnerDetails(String.valueOf(learnerDTO.getLearnerId()));
            if (existingLearner != null) {
                throw new RuntimeException("A learner with this learnerId already exists. Use PUT /api/v1/learner/update/" + existingLearner.getId() + " to update an existing learner.");
            }
        }

        // Check for duplicate email
        if (learnerDTO.getContactMail() != null && !learnerDTO.getContactMail().trim().isEmpty()) {
            learnerRepository.findByContactMailIgnoreCase(learnerDTO.getContactMail().trim())
                    .ifPresent(existingLearner -> {
                        throw new RuntimeException("Email already exists. A learner account with this email address already exists.");
                    });
        }

        // Use the same canonical identifier as mobile-auth and bulk import.
        String normalizedMobile = normalizeMobile(learnerDTO.getContactMobile());
        if (normalizedMobile == null) throw new IllegalArgumentException("A valid 10-digit Indian mobile number is required.");
        learnerRepository.findByContactMobile(normalizedMobile)
                .ifPresent(existingLearner -> {
                    throw new RuntimeException("Mobile number already exists. A learner account with this mobile number already exists.");
                });
        learnerDTO.setContactMobile(normalizedMobile);

        // Check for duplicate phone number (if different from mobile)
        if (learnerDTO.getContactPhone() != null && !learnerDTO.getContactPhone().trim().isEmpty()
                && !learnerDTO.getContactPhone().trim().equals(learnerDTO.getContactMobile())) {
            learnerRepository.findByContactPhone(learnerDTO.getContactPhone().trim())
                    .ifPresent(existingLearner -> {
                        throw new RuntimeException("Phone number already exists. A learner account with this phone number already exists.");
                    });
        }

        // Create new learner
        Learner learner = new Learner();
        setLearnerdetails(learnerDTO, learner);
        return learnerRepository.save(learner);
    }

    @Override
    public BulkValidateResponse bulkValidate(BulkValidateRequest request) {
        BulkValidateResponse response = new BulkValidateResponse();
        if (request == null) {
            return response;
        }
        if (request.getMobiles() != null && !request.getMobiles().isEmpty()) {
            List<String> mobiles = request.getMobiles().stream()
                    .map(OnboardingMobileNumber::normalize)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            if (!mobiles.isEmpty()) {
                List<Learner> byMobile = learnerRepository.findByContactMobileInAndNotDeleted(mobiles);
                response.setExistingMobiles(byMobile.stream()
                        .map(Learner::getContactMobile)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList()));
            }
        }
        if (request.getEmails() != null && !request.getEmails().isEmpty()) {
            List<String> emailsLower = request.getEmails().stream()
                    .map(s -> s == null ? "" : s.trim().toLowerCase())
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .collect(Collectors.toList());
            if (!emailsLower.isEmpty()) {
                List<Learner> byEmail = learnerRepository.findByContactMailLowerInAndNotDeleted(emailsLower);
                response.setExistingEmails(byEmail.stream()
                        .map(Learner::getContactMail)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList()));
            }
        }
        if (request.getCollegeId() != null && request.getRollNumbers() != null) {
            List<String> normalizedRolls = request.getRollNumbers().stream()
                    .filter(Objects::nonNull)
                    .map(r -> r.trim().toLowerCase(java.util.Locale.ROOT))
                    .filter(r -> !r.isEmpty())
                    .distinct()
                    .collect(Collectors.toList());
            if (!normalizedRolls.isEmpty()) {
                List<String> existing = learnerRepository.findExistingRollNumbersForCollege(
                        request.getCollegeId(), normalizedRolls);
                if (existing != null) response.setExistingRollNumbers(existing.stream()
                        .filter(Objects::nonNull).distinct().collect(Collectors.toList()));
            }
        }
        return response;
    }

    @Override
    // No @Transactional here on purpose. This method reports per-row success/failure
    // ("Created 197; failed 3"), which is only truthful if each row commits independently.
    // Under a single shared transaction, a DataIntegrityViolationException on one row — an
    // unchecked constraint, or a race with a concurrent import — marks the whole transaction
    // rollback-only. The per-row catch below swallows it, the loop keeps going, the admin is
    // shown "197 created", and then the commit discards all 197. Each row now goes through
    // `self` so it gets its own REQUIRES_NEW transaction, matching the pattern already used by
    // AdminJobServiceImpl.bulkUpdateJobStatus and PlacementJobServiceImpl.
    public BulkRegisterResponse bulkRegister(BulkRegisterRequest request) {
        Integer collegeId = request.getCollegeId();
        Integer programId = request.getProgramId();
        Integer classId = request.getClassId();
        List<BulkLearnerItem> learners = request.getLearners();

        // Validate class belongs to program and college (non-deleted class only)
        Optional<_Class> classOpt = classRepository.findByIdAndNotDeleted(classId);
        if (!classOpt.isPresent() || classOpt.get().getProgramId() != programId) {
            throw new RuntimeException("Class not found or does not belong to the given program.");
        }
        Optional<NewProgram> programOpt = newProgramRepository.findByIdAndNotDeleted(programId);
        if (!programOpt.isPresent()) {
            throw new RuntimeException("Program not found.");
        }
        Optional<Department> deptOpt = departmentRepository.findByIdAndNotDeleted(programOpt.get().getDeptId());
        if (!deptOpt.isPresent() || collegeId == null || deptOpt.get().getCollegeId() != collegeId) {
            throw new RuntimeException("Program does not belong to the given college.");
        }

        // Normalize and collect all mobiles/emails for batch lookup
        List<String> allMobiles = learners.stream()
                .map(item -> normalizeMobile(item.getContactMobile()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        List<String> allEmailsLower = learners.stream()
                .map(item -> item.getContactMail() == null || item.getContactMail().trim().isEmpty() ? null : item.getContactMail().trim().toLowerCase())
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        Set<String> existingMobiles = new HashSet<>();
        Set<String> existingEmailsLower = new HashSet<>();
        if (!allMobiles.isEmpty()) {
            learnerRepository.findByContactMobileInAndNotDeleted(allMobiles).stream()
                    .map(Learner::getContactMobile)
                    .filter(Objects::nonNull)
                    .forEach(m -> existingMobiles.add(normalizeMobile(m)));
        }
        if (!allEmailsLower.isEmpty()) {
            learnerRepository.findByContactMailLowerInAndNotDeleted(allEmailsLower).stream()
                    .map(Learner::getContactMail)
                    .filter(Objects::nonNull)
                    .forEach(m -> existingEmailsLower.add(m.toLowerCase()));
        }

        // In-CSV duplicates: mobiles and emails that appear more than once
        Map<String, Long> mobileCounts = allMobiles.stream().collect(Collectors.groupingBy(m -> m, Collectors.counting()));
        Set<String> duplicateMobilesInCsv = mobileCounts.entrySet().stream().filter(e -> e.getValue() > 1).map(Map.Entry::getKey).collect(Collectors.toSet());
        Map<String, Long> emailCounts = allEmailsLower.stream().collect(Collectors.groupingBy(e -> e, Collectors.counting()));
        Set<String> duplicateEmailsInCsv = emailCounts.entrySet().stream().filter(e -> e.getValue() > 1).map(Map.Entry::getKey).collect(Collectors.toSet());

        BulkRegisterResponse response = new BulkRegisterResponse();
        List<Integer> createdIds = new ArrayList<>();
        List<BulkRegisterFailedItem> failed = new ArrayList<>();
        // B3: one id shared by every row this call creates, so the whole import can be found and
        // undone as a unit later (see undoBulkImport).
        String batchId = java.util.UUID.randomUUID().toString();

        for (int i = 0; i < learners.size(); i++) {
            int row = i + 1;
            BulkLearnerItem item = learners.get(i);
            String mobile = normalizeMobile(item.getContactMobile());
            String email = item.getContactMail() != null && !item.getContactMail().trim().isEmpty() ? item.getContactMail().trim().toLowerCase() : null;

            if (mobile == null || mobile.isEmpty()) {
                failed.add(new BulkRegisterFailedItem(row, "Mobile number is required and must be valid.", item.getContactMobile(), item.getRollNumber()));
                continue;
            }
            // Email is OPTIONAL for bulk learner import, and deliberately so:
            // BulkLearnerItem marks firstName, lastName, rollNumber and contactMobile @NotBlank but
            // pointedly does NOT mark contactMail, the single-learner creation path never required
            // it, and every email check below is already guarded with "email != null &&".
            //
            // This method nonetheless rejected any row without one. The contradiction shipped in
            // the same commit as LearnerBulkServiceTest, whose validRowWithNullEmail_creates has
            // therefore never passed — invisible because pom.xml sets <skipTests>true</skipTests>
            // by default and the prod pipeline runs no tests at all. Removing the check restores
            // the documented contract: a learner can be imported with a mobile number alone.
            if (duplicateMobilesInCsv.contains(mobile)) {
                failed.add(new BulkRegisterFailedItem(row, "Duplicate mobile in file.", item.getContactMobile(), item.getRollNumber()));
                continue;
            }
            if (existingMobiles.contains(mobile)) {
                failed.add(new BulkRegisterFailedItem(row, "Mobile number already exists.", item.getContactMobile(), item.getRollNumber()));
                continue;
            }
            if (email != null && duplicateEmailsInCsv.contains(email)) {
                failed.add(new BulkRegisterFailedItem(row, "Duplicate email in file.", item.getContactMobile(), item.getRollNumber()));
                continue;
            }
            if (email != null && existingEmailsLower.contains(email)) {
                failed.add(new BulkRegisterFailedItem(row, "Email already exists.", item.getContactMobile(), item.getRollNumber()));
                continue;
            }
            Learner existingByRoll = learnerRepository.getLearnerByCollegeAndRoll(collegeId, item.getRollNumber().trim());
            if (existingByRoll != null) {
                failed.add(new BulkRegisterFailedItem(row, "Roll number already exists in this college.", item.getContactMobile(), item.getRollNumber()));
                continue;
            }

            try {
                Learner saved = self.saveBulkLearnerRow(item, collegeId, programId, classId, mobile, email, batchId);
                createdIds.add(saved.getId());
                existingMobiles.add(mobile);
                if (email != null) existingEmailsLower.add(email);
            } catch (Exception e) {
                logger.warn("Bulk register row {} failed: {}", row, e.getMessage());
                failed.add(new BulkRegisterFailedItem(row, e.getMessage(), item.getContactMobile(), item.getRollNumber()));
            }
        }

        response.setCreated(createdIds.size());
        response.setCreatedIds(createdIds);
        response.setFailed(failed);
        if (!createdIds.isEmpty()) response.setBulkImportBatchId(batchId);
        return response;
    }

    @Override
    // REQUIRES_NEW (not the default REQUIRED): bulkRegister calls this once per row through
    // `self` specifically so each learner commits — or fails — on its own. See the comment on
    // bulkRegister for why sharing one transaction makes its per-row report untrue.
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public Learner saveBulkLearnerRow(BulkLearnerItem item,
                                      Integer collegeId,
                                      Integer programId,
                                      Integer classId,
                                      String normalizedMobile,
                                      String normalizedEmailLower) {
        return saveBulkLearnerRow(item, collegeId, programId, classId, normalizedMobile, normalizedEmailLower, null);
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public Learner saveBulkLearnerRow(BulkLearnerItem item,
                                      Integer collegeId,
                                      Integer programId,
                                      Integer classId,
                                      String normalizedMobile,
                                      String normalizedEmailLower,
                                      String bulkImportBatchId) {
        Learner learner = new Learner();
        learner.setFirstName(InputSanitizer.sanitize(item.getFirstName()));
        learner.setLastName(InputSanitizer.sanitize(item.getLastName()));
        learner.setRollNumber(item.getRollNumber().trim());
        learner.setContactMobile(normalizedMobile);
        learner.setContactMail(normalizedEmailLower != null ? item.getContactMail().trim() : null);
        learner.setCollegeId(collegeId);
        learner.setProgramId(programId);
        learner.setClassId(classId);
        learner.setUserType("LEARNER");
        learner.setBulkImportBatchId(bulkImportBatchId);
        scopeResolutionService.enrichLearnerHierarchy(learner);
        return learnerRepository.save(learner);
    }

    private static String normalizeMobile(String raw) {
        return OnboardingMobileNumber.normalize(raw);
    }

    private void setLearnerdetails(LearnerDTO learnerDTO, Learner learner) {
        learner.setFirstName(InputSanitizer.sanitize(learnerDTO.getFirstName()));
        learner.setUniqueId(learnerDTO.getUniqueId());
        learner.setRollNumber(learnerDTO.getRollNumber());
        learner.setProgramId(learnerDTO.getProgramId());
        learner.setLastName(InputSanitizer.sanitize(learnerDTO.getLastName()));
        if (learnerDTO.getCollegeId() != null) {
            learner.setCollegeId(learnerDTO.getCollegeId());
        }
        learner.setClassId(learnerDTO.getClassId());
        if (learnerDTO.getDob() != null) {
            learner.setDob(learnerDTO.getDob());
        }
        learner.setContactPhone(learnerDTO.getContactPhone());
        learner.setContactMail(learnerDTO.getContactMail());
        if (learnerDTO.getContactMobile() != null) {
            // Guard against silently nulling out the login mobile number when it is
            // omitted from the request payload.
            String canonical = normalizeMobile(learnerDTO.getContactMobile());
            if (canonical == null) throw new IllegalArgumentException("A valid 10-digit Indian mobile number is required.");
            learner.setContactMobile(canonical);
        }
        learner.setUserType("LEARNER");
        learner.setAddress(InputSanitizer.sanitizePreserveNewlines(learnerDTO.getAddress()));
        learner.setDepartment(InputSanitizer.sanitize(learnerDTO.getDepartment()));
        learner.setDescription(InputSanitizer.sanitizePreserveNewlines(learnerDTO.getDescription()));
        
        if (learnerDTO.getOrganizationId() != null) {
            learner.setOrganizationId(learnerDTO.getOrganizationId());
        }
        
        // Convert List<Experience> to List<ExperienceDTO>
        if (learnerDTO.getExperiences() != null) {
            List<ExperienceDTO> experienceDTOs = learnerDTO.getExperiences().stream()
                .map(exp -> {
                    ExperienceDTO dto = new ExperienceDTO();
                    dto.setOrganization(exp.getOrganization());
                    dto.setDesignation(exp.getDesignation());
                    dto.setDescription(exp.getDescription());
                    dto.setFrom(exp.getFrom());
                    dto.setTo(exp.getTo());
                    return dto;
                }).collect(Collectors.toList());
            learner.setExperiences(experienceDTOs);
        }
        
        // Convert List<String> to List<SkillDTO>. This is the same underlying Learner.skills
        // column that LearnerProfileServiceImpl.addSkill/updateSkill write to (and sanitize) —
        // this /learner/update/{id} endpoint permits self-access, so a learner updating their
        // own record through here must not be able to bypass that sanitization and land a raw,
        // unescaped skill name that later renders for admin/faculty viewing the profile.
        if (learnerDTO.getSkills() != null) {
            List<SkillDTO> skillDTOs = learnerDTO.getSkills().stream()
                .map(skill -> {
                    SkillDTO dto = new SkillDTO();
                    dto.setSkill(InputSanitizer.sanitize(skill));
                    dto.setProficiency("Intermediate");
                    return dto;
                }).collect(Collectors.toList());
            learner.setSkills(skillDTOs);
        }
        
        learner.setOrganizations(learnerDTO.getOrganizations());
        
        learner.setGender(learnerDTO.getGender());
        learner.setWebsite(learnerDTO.getWebsite());

        // Enforce hierarchy: resolve missing org/college/program from class chain
        scopeResolutionService.enrichLearnerHierarchy(learner);
    }
 
    @Override
    public Learner getLearnerDetails(String learnerId) {
        return learnerRepository.getStudentDetails(learnerId);
    }

    @Override
    public List<com._42students.lms.dto.response.BulkImportBatchDTO> listBulkImportBatches(Integer collegeId) {
        List<Object[]> rows = learnerRepository.findBulkImportBatchesByCollegeId(collegeId);
        List<com._42students.lms.dto.response.BulkImportBatchDTO> out = new ArrayList<>();
        for (Object[] r : rows) {
            out.add(new com._42students.lms.dto.response.BulkImportBatchDTO(
                    (String) r[0], (Long) r[1], (java.time.LocalDateTime) r[2]));
        }
        return out;
    }

    @Override
    @Transactional
    public int undoBulkImport(String bulkImportBatchId, Integer collegeId) {
        // No generic batch delete is safe once account sessions and module records can exist.
        // The previous implementation blindly soft-deleted every learner in the batch, leaving
        // assignments, attendance and projects orphaned. Preserve accounts for audited, individual
        // suspension/correction instead. Do not rely on a time-only window: a learner may sign
        // in immediately after being imported.
        throw new IllegalStateException("Bulk import undo is disabled to protect learner work. Correct or suspend affected accounts individually.");
    }

    @Override
    @Transactional
    public Attend attend(AttendanceDTO attendanceDTO) {
        return attend(attendanceDTO, false);
    }

    @Override
    @Transactional
    public Attend attend(AttendanceDTO attendanceDTO, boolean bypassCorrectionWindow) {
        ClassSchedule classScheduleDetails = classScheduleRepository.getClassScheduleDetail(attendanceDTO.getClassScheduleId());
        if (classScheduleDetails == null) {
            throw new IllegalArgumentException("Class schedule not found");
        }
        Learner studentDetails = getLearnerDetails(attendanceDTO.getStudentId());
        if (studentDetails == null) {
            throw new IllegalArgumentException("Student not found");
        }
        if (studentDetails.getClassId() == null || !studentDetails.getClassId().equals(classScheduleDetails.getClassId())) {
            throw new IllegalArgumentException("Student does not belong to this class schedule's class");
        }
        String startTimeStr = classScheduleDetails.getStartTime();
        String scheduleEndTimeStr = classScheduleDetails.getEndTime();
        if (startTimeStr != null) {
            try {
                DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                LocalDateTime scheduleStart = LocalDateTime.parse(startTimeStr, fmt);
                LocalDateTime now = LocalDateTime.now();
                if (now.isBefore(scheduleStart)) {
                    throw new IllegalArgumentException("Cannot mark attendance for a class that has not started yet");
                }
                // AT-03/AT-04: block retroactive marking more than N hours after class end.
                // Was a bare .plusHours(24) — now a per-college policy (superadmin > Academic
                // Setup > Attendance), defaulting to 24h when no COLLEGE override is set.
                if (scheduleEndTimeStr != null) {
                    try {
                        LocalDateTime scheduleEnd = LocalDateTime.parse(scheduleEndTimeStr, fmt);
                        int correctionWindowHours = appSettingsService != null
                                ? appSettingsService.getInt("COLLEGE", studentDetails.getCollegeId(), "attendance.correctionWindowHours", 24)
                                : 24;
                        // Admin corrections (AdminAttendanceController) deliberately bypass this --
                        // the whole point of an admin-facing correction tool is fixing attendance
                        // after the normal window has closed. Faculty's own marking path (the plain
                        // attend(dto) overload above) still enforces it.
                        if (!bypassCorrectionWindow && now.isAfter(scheduleEnd.plusHours(correctionWindowHours))) {
                            throw new IllegalArgumentException("Attendance window has closed. Attendance can only be marked within " + correctionWindowHours + " hours after the class ends.");
                        }
                    } catch (IllegalArgumentException e2) {
                        throw e2;
                    } catch (Exception ignored) {
                        // end time format issue — don't block on end-time parse failure
                    }
                }
            } catch (Exception e) {
                if (e instanceof IllegalArgumentException) throw (IllegalArgumentException) e;
                // AT-18: malformed start-time must block attendance, not silently allow it
                throw new IllegalArgumentException("Class schedule has an invalid start time format. Contact an administrator.");
            }
        }
        // Look up INCLUDING soft-deleted rows. Absence removal is a soft delete, but the unique key
        // uk_attend_student_schedule (student_id, class_schedule_id) added in V29 ignores
        // is_deleted — so a student who was marked absent, then corrected to present, still has a
        // row here. Querying with the is_deleted filter (as this did) found nothing, inserted a
        // second row, hit the unique key, and then re-queried with the same filter in the catch
        // block — finding nothing again and rethrowing. Net effect: once a student was corrected
        // to present, faculty could never mark them absent again for that session; it failed with
        // a data-integrity error every time. Reviving the existing row is the correct operation.
        Attend attend = attendanceRepository.getAttendanceIncludingDeleted(
                String.valueOf(attendanceDTO.getClassScheduleId()), attendanceDTO.getStudentId());
        if (attend != null) {
            if (!Boolean.TRUE.equals(attend.getIsDeleted())) {
                // Already marked absent and not corrected — idempotent, nothing to do.
                return attend;
            }
            attend.setIsDeleted(false);
            attend.setDropClassReason(attendanceDTO.getDropClassReason());
        } else {
            attend = new Attend();
            attend.setStudentId(attendanceDTO.getStudentId());
            attend.setDropClassReason(attendanceDTO.getDropClassReason());
            attend.setClassScheduleId(attendanceDTO.getClassScheduleId());
        }
        try {
            attendanceRepository.save(attend);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Race: another request inserted the same pair concurrently. Re-read including
            // soft-deleted rows for the same reason as above.
            Attend existing = attendanceRepository.getAttendanceIncludingDeleted(
                    String.valueOf(attendanceDTO.getClassScheduleId()), attendanceDTO.getStudentId());
            if (existing != null) return existing;
            throw e;
        }
        Course courseDetails = studentCourseRepository.fetchCourse(classScheduleDetails.getCourseId());
        String endTimeStr = classScheduleDetails.getEndTime();
        if (studentDetails.getContactMobile() != null && courseDetails != null && startTimeStr != null && endTimeStr != null && smsService != null) {
            final String mobile = studentDetails.getContactMobile();
            final String courseName = courseDetails.getCourseName();
            CompletableFuture.runAsync(() -> {
                try {
                    DateTimeFormatter fromFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                    DateTimeFormatter toFormat = DateTimeFormatter.ofPattern("h:mm a");
                    LocalDateTime startTime = LocalDateTime.parse(startTimeStr, fromFormat);
                    LocalDateTime endTime = LocalDateTime.parse(endTimeStr, fromFormat);
                    // GLOBAL, editable (superadmin > Notification Templates > SMS) -- was a
                    // hardcoded literal. Must stay word-for-word identical to the tenant's actual
                    // DLT registration or BulkSMSApps will silently reject/mismatch the send (see
                    // BulkSmsAppsServiceImpl's own DLT-matching warning) -- an admin changing this
                    // needs their own registration to match, not just good intentions.
                    String template = appSettingsService != null
                            ? appSettingsService.getString("GLOBAL", null, "sms.attendanceAbsenceTemplate")
                                    .orElse("Dear Parent,\r\nYour ward is absent for today's %s class at %s-%s.\r\n- 42 Learn.")
                            : "Dear Parent,\r\nYour ward is absent for today's %s class at %s-%s.\r\n- 42 Learn.";
                    String msg = template.formatted(courseName, startTime.format(toFormat), endTime.format(toFormat));
                    smsService.sendNotification(mobile, msg);
                } catch (Exception e) {
                    logger.error("Failed to send absence SMS: studentId={}, error={}", attendanceDTO.getStudentId(), e.getMessage(), e);
                }
            });
        }
        return attend;
    }

    @Override
    @Transactional
    public void removeAbsence(String studentId, int classScheduleId) {
        Attend attend = attendanceRepository.getAttendance(String.valueOf(classScheduleId), studentId);
        if (attend != null && !Boolean.TRUE.equals(attend.getIsDeleted())) {
            attend.setIsDeleted(true);
            attendanceRepository.save(attend);
            // 4.5: a parent who was told "your ward is absent" (attend(), above) previously got no
            // follow-up if that mark was then corrected -- their last known state stayed wrong,
            // permanently, for every correction. Same fire-and-forget pattern as the original
            // absence SMS, so this doesn't change the delivery-tracking gap documented in 4.4,
            // just closes the specific "parent never told about their own correction" gap.
            sendAbsenceCorrectionSms(studentId, classScheduleId);
        }
    }

    private void sendAbsenceCorrectionSms(String studentId, int classScheduleId) {
        if (smsService == null) return;
        ClassSchedule schedule = classScheduleRepository.getClassScheduleDetail(classScheduleId);
        if (schedule == null) return;
        Learner studentDetails = getLearnerDetails(studentId);
        if (studentDetails == null || studentDetails.getContactMobile() == null) return;
        Course courseDetails = studentCourseRepository.fetchCourse(schedule.getCourseId());
        String startTimeStr = schedule.getStartTime();
        String endTimeStr = schedule.getEndTime();
        if (courseDetails == null || startTimeStr == null || endTimeStr == null) return;
        final String mobile = studentDetails.getContactMobile();
        final String courseName = courseDetails.getCourseName();
        CompletableFuture.runAsync(() -> {
            try {
                DateTimeFormatter fromFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                DateTimeFormatter toFormat = DateTimeFormatter.ofPattern("h:mm a");
                LocalDateTime startTime = LocalDateTime.parse(startTimeStr, fromFormat);
                LocalDateTime endTime = LocalDateTime.parse(endTimeStr, fromFormat);
                String correctionTemplate = appSettingsService != null
                        ? appSettingsService.getString("GLOBAL", null, "sms.attendanceCorrectionTemplate")
                                .orElse("Dear Parent,\r\nCorrection: your ward's absence for %s class at %s-%s has been reviewed and marked present.\r\n- 42 Learn.")
                        : "Dear Parent,\r\nCorrection: your ward's absence for %s class at %s-%s has been reviewed and marked present.\r\n- 42 Learn.";
                String msg = correctionTemplate.formatted(courseName, startTime.format(toFormat), endTime.format(toFormat));
                smsService.sendNotification(mobile, msg);
            } catch (Exception e) {
                logger.error("Failed to send absence-correction SMS: studentId={}, error={}", studentId, e.getMessage(), e);
            }
        });
    }


    @Override
    public List<LearnerResponseDTO> getStudentDetailsByClassId(int classId) {
        // Excludes soft-deleted learners. Previously this used the unfiltered query, so withdrawn
        // and transferred students appeared in the faculty roster (inflating the headline headcount
        // that is presented as a truth claim), in attendance grids, in grading rosters and in
        // notification recipient lists. A soft-deleted learner should not surface in any of those.
        List<Learner> studentList = learnerRepository.getActiveStudentDetailsByClassId(classId);
        List<LearnerResponseDTO> studentDTOList = new ArrayList<>();
        for (Learner student : studentList) {
            LearnerResponseDTO learnerResponseDTO = new LearnerResponseDTO();
            learnerResponseDTO.setFirstName(student.getFirstName());
            learnerResponseDTO.setLastName(student.getLastName());
            learnerResponseDTO.setRollNumber(student.getRollNumber());
            learnerResponseDTO.setContactMobile(student.getContactMobile());
            learnerResponseDTO.setContactMail(student.getContactMail());
            learnerResponseDTO.setWebsite(student.getWebsite());
            learnerResponseDTO.setClassId(student.getClassId());
            learnerResponseDTO.setCollegeId(student.getCollegeId());
            learnerResponseDTO.setLearnerId(student.getId());
            studentDTOList.add(learnerResponseDTO);
        }
        return studentDTOList;
    }


    @Override
    public ProgramDTO getProgramDetails(String learnerId) {
        Learner learner = learnerRepository.getStudentDetails(learnerId);
        if (learner.getProgramId() == null) return null;
        NewProgramResponseDTO np = newProgramService.findById(learner.getProgramId());
        if (np == null) return null;
        ProgramDTO programDTO = new ProgramDTO();
        programDTO.setName(np.getName());
        programDTO.setDeptId(np.getDeptId());
        programDTO.setStartYear(null);
        programDTO.setEndYear(null);
        return programDTO;
    }

    public List<Learner> findAll() {
        return learnerRepository.findAll();
    }

    /**
     * Returns all learners that belong to the given college: either learner.college_id match
     * or linked via class -> program -> department -> college. So college admin sees all
     * registered students in their college even when learner.college_id is not set.
     */
    public List<Learner> fetchContactsByCollegeId(int collegeId) {
        return learnerRepository.findLearnersByCollegeIdIncludingViaClass(collegeId);
    }

    public Page<Learner> fetchContactsByCollegeId(int collegeId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 200));
        return learnerRepository.findLearnersByCollegeIdIncludingViaClass(collegeId, pageRequest);
    }

    @Override
    public Page<Learner> fetchContactsByCollegeIdPaged(int collegeId, org.springframework.data.domain.Pageable pageable) {
        return learnerRepository.findLearnersByCollegeIdIncludingViaClass(collegeId, pageable);
    }


    @Override
    public Page<Learner> fetchAdminRosterPage(int collegeId, String search, Integer programId,
                                               Integer batchId, Integer classId, String status,
                                               org.springframework.data.domain.Pageable pageable) {
        String normalizedSearch = search == null ? "" : search.trim();
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase(java.util.Locale.ROOT);
        if (!normalizedStatus.isEmpty() && !"ACTIVE".equals(normalizedStatus) && !"SUSPENDED".equals(normalizedStatus)) {
            throw new IllegalArgumentException("status must be ACTIVE or SUSPENDED");
        }
        return learnerRepository.findAdminRosterPage(
                collegeId, normalizedSearch, programId, batchId, classId, normalizedStatus, pageable);
    }

    @Override
    public Page<Learner> fetchContactsByOrganizationIdPaged(int orgId, org.springframework.data.domain.Pageable pageable) {
        return learnerRepository.findLearnersByOrganizationIdIncludingViaClass(orgId, pageable);
    }

    @Override
    public List<Learner> fetchContactsByOrganizationId(int orgId) {
        return learnerRepository.findLearnersByOrganizationIdIncludingViaClass(orgId);
    }

    public Learner getLearnerDetailsForAlternateLogin(String rollNumber, String collegeId) {
        return learnerRepository.getStudentDetailsForAlternateLogin(rollNumber, collegeId);
    }

   

   

    
    @Override
    public List<LearnerResponseDTO> getLearnersByProgram(int programId) {
        List<Learner> learners = learnerRepository.getLearnersByProgramId(programId);
        List<LearnerResponseDTO> learnerResponseDTOList = new ArrayList<>();
        for (Learner learner : learners) {
            LearnerResponseDTO learnerResponseDTO = new LearnerResponseDTO();
            learnerResponseDTO.setLearnerId(learner.getId());
            learnerResponseDTO.setFirstName(learner.getFirstName());
            learnerResponseDTO.setLastName(learner.getLastName());
            learnerResponseDTO.setRollNumber(learner.getRollNumber());
            learnerResponseDTO.setContactMobile(learner.getContactMobile());
            learnerResponseDTO.setContactMail(learner.getContactMail());
            learnerResponseDTO.setClassId(learner.getClassId());
            if (learner.getCollegeId() != null) {
                learnerResponseDTO.setCollegeId(learner.getCollegeId());
            }
            learnerResponseDTO.setProgramId(learner.getProgramId());

            // Add other properties if needed...

            learnerResponseDTOList.add(learnerResponseDTO);
        }
        return learnerResponseDTOList;
    }
    

    @Override
    public Learner getLearnerByCollegeAndRoll(Integer collegeId, String rollNumber) {
        return learnerRepository.findByCollegeIdAndRollNumber(collegeId, rollNumber);
    }

    @Override
    public String getContactNumberByLearnerId(String learnerId) {
        Learner learner = getLearnerDetails(learnerId);
        if (learner != null) {
            return learner.getContactMobile();
        }
        return null; 
    }

   
    @Override
    public int getTotalStudentsInClass(int classId) {
        return learnerRepository.getStudentCountByClassId(classId);
    }

    
   


    // 2.7: -1 is overloaded across three different "no data" conditions (not found, no class,
    // no sessions held yet) with no way for a caller to tell them apart. Verified both live
    // callers before deciding whether to split this into a richer return type: the controller
    // endpoint (LearnerController#getAttendancePercentage) already 404s on a missing learner
    // before ever calling this, so that branch is unreachable from there; and the other caller
    // (LearnerCourseHomeStatsServiceImpl) only ever checks `>= 0`, treating all three the same
    // way on purpose. No live consumer needs the distinction today, so this stays a documented
    // sentinel rather than a breaking API/DTO change for the one caller that would use it.
    private static final double ATTENDANCE_NOT_AVAILABLE = -1;

    public double getAttendancePercentage(String studentId) {
        Learner learner = learnerRepository.getStudentDetails(studentId);
        if (learner == null) {
            return ATTENDANCE_NOT_AVAILABLE;
        }
        Integer classId = learner.getClassId();
        if (classId == null) {
            // AT-12: learner not yet assigned to a class — no data available, not 100%
            return ATTENDANCE_NOT_AVAILABLE;
        }
        // Only sessions that have actually started can count toward a percentage. This used
        // getClassScheduleCountByClassId, which includes FUTURE sessions — and since a learner
        // cannot be absent from a class that hasn't happened, that inflated everyone's attendance
        // toward 100% early in a term. It also disagreed with the frontend, which already
        // filters to held sessions, so the same learner saw different figures depending on the
        // screen. Both sides now count held sessions only.
        int heldClasses = classScheduleRepository.getHeldClassScheduleCountByClassId(classId);
        if (heldClasses == 0) {
            // AT-12: no sessions have been held yet — attendance not available, not 100%
            return ATTENDANCE_NOT_AVAILABLE;
        }
        int absentClasses = attendanceRepository.getAbsentCountByLearnerAndClass(studentId, classId);
        int presentClasses = heldClasses - absentClasses;
        // Numerator and denominator now share identical filters (same class, not deleted, already
        // started), so this can no longer go negative; clamped purely as a defensive floor.
        if (presentClasses < 0) presentClasses = 0;
        return ((double) presentClasses / heldClasses) * 100.0;
    }

    @Override
    public double getAttendancePercentageByCourse(String studentId, int courseId) {
        Learner learner = learnerRepository.getStudentDetails(studentId);
        if (learner == null) {
            return ATTENDANCE_NOT_AVAILABLE;
        }
        Integer classId = learner.getClassId();
        if (classId == null) {
            return ATTENDANCE_NOT_AVAILABLE;
        }
        int heldClasses = classScheduleRepository.getHeldClassScheduleCountByClassIdAndCourseId(classId, courseId);
        if (heldClasses == 0) {
            return ATTENDANCE_NOT_AVAILABLE;
        }
        int absentClasses = attendanceRepository.getAbsentCountByLearnerAndClassAndCourse(studentId, classId, courseId);
        int presentClasses = heldClasses - absentClasses;
        if (presentClasses < 0) presentClasses = 0;
        return ((double) presentClasses / heldClasses) * 100.0;
    }

    @Override
    public Optional<Learner> findById(Integer id) {
        return learnerRepository.findById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Learner updateLearner(Integer id, LearnerDTO learnerDTO) {
        Learner learner = learnerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Learner not found with id: " + id));
        
        // STALE VISIBILITY FIX: Capture old hierarchy values before update
        Integer oldClassId = learner.getClassId();
        Integer oldProgramId = learner.getProgramId();
        Integer oldOrganizationId = learner.getOrganizationId();
        Integer oldCollegeId = learner.getCollegeId();

        if (learnerDTO.getCollegeId() != null && !Objects.equals(oldCollegeId, learnerDTO.getCollegeId())) {
            throw new IllegalArgumentException("Changing a learner's college is not supported by this endpoint");
        }
        if (learnerDTO.getOrganizationId() != null && oldOrganizationId != null
                && !Objects.equals(oldOrganizationId, learnerDTO.getOrganizationId())) {
            throw new IllegalArgumentException("Changing a learner's organization is not supported by this endpoint");
        }
        Integer requestedProgramId = learnerDTO.getProgramId() != null ? learnerDTO.getProgramId() : oldProgramId;
        Integer requestedClassId = learnerDTO.getClassId() != null ? learnerDTO.getClassId() : oldClassId;
        if (requestedProgramId != null) {
            Integer programCollegeId = scopeResolutionService.resolveProgramToCollegeId(requestedProgramId);
            if (programCollegeId == null || !Objects.equals(oldCollegeId, programCollegeId)) {
                throw new IllegalArgumentException("Learner program must belong to the learner's college");
            }
        }
        if (requestedClassId != null) {
            _Class requestedClass = classRepository.findByIdAndNotDeleted(requestedClassId).orElse(null);
            Integer classCollegeId = scopeResolutionService.resolveClassToCollegeId(requestedClassId);
            if (requestedClass == null || classCollegeId == null || !Objects.equals(oldCollegeId, classCollegeId)) {
                throw new IllegalArgumentException("Learner class must belong to the learner's college");
            }
            if (requestedProgramId != null && !Objects.equals(requestedProgramId, requestedClass.getProgramId())) {
                throw new IllegalArgumentException("Learner class must belong to the selected program");
            }
        }

        // Get old batchId from class if classId exists
        Integer oldBatchId = null;
        if (oldClassId != null) {
            _Class oldClass = classRepository.findById(oldClassId).orElse(null);
            if (oldClass != null) {
                oldBatchId = oldClass.getBatchId();
            }
        }
        
        setLearnerdetails(learnerDTO, learner);
        Learner updatedLearner = learnerRepository.save(learner);
        
        // STALE VISIBILITY FIX: Invalidate cache if hierarchy changed. collegeId is included —
        // matchesHierarchicalTargeting gates college-scoped jobs on it independently of
        // class/program/org, so a learner moved to a different college with class/program
        // unchanged used to go undetected here, leaving them served a stale (wrong-college)
        // visibility cache entry for up to the cache TTL.
        boolean hierarchyChanged = !Objects.equals(oldClassId, updatedLearner.getClassId()) ||
                !Objects.equals(oldProgramId, updatedLearner.getProgramId()) ||
                !Objects.equals(oldOrganizationId, updatedLearner.getOrganizationId()) ||
                !Objects.equals(oldCollegeId, updatedLearner.getCollegeId());

            if (hierarchyChanged) {
            // Invalidate cache for old hierarchy
            if (oldOrganizationId != null) {
                jobVisibilityCache.invalidateForHierarchy(oldOrganizationId, oldCollegeId, oldClassId, oldBatchId, oldProgramId);
                logger.info("STALE VISIBILITY FIX: Cache invalidated for old hierarchy (learner:{}, org:{}, college:{}, class:{}, program:{})",
                        id, oldOrganizationId, oldCollegeId, oldClassId, oldProgramId);
            }

            // Invalidate cache for new hierarchy
            Integer newBatchId = null;
            if (updatedLearner.getClassId() != null) {
                _Class newClass = classRepository.findById(updatedLearner.getClassId()).orElse(null);
                if (newClass != null) {
                    newBatchId = newClass.getBatchId();
                }
            }
            if (updatedLearner.getOrganizationId() != null) {
                jobVisibilityCache.invalidateForHierarchy(
                        updatedLearner.getOrganizationId(),
                        updatedLearner.getCollegeId(),
                        updatedLearner.getClassId(),
                        newBatchId,
                        updatedLearner.getProgramId());
                logger.info("STALE VISIBILITY FIX: Cache invalidated for new hierarchy (learner:{}, org:{}, college:{}, class:{}, program:{})",
                        id, updatedLearner.getOrganizationId(), updatedLearner.getCollegeId(), updatedLearner.getClassId(), updatedLearner.getProgramId());
            }
        }
        
        return updatedLearner;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Learner moveLearnerToClass(Integer id, Integer targetClassId) {
        if (targetClassId == null || targetClassId < 1) {
            throw new IllegalArgumentException("A valid destination class is required");
        }

        Learner learner = learnerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Learner not found with id: " + id));
        Integer oldClassId = learner.getClassId();
        if (oldClassId == null) {
            throw new IllegalArgumentException(
                    "This learner is not currently assigned to a section. Use the student onboarding/edit workflow instead.");
        }
        if (Objects.equals(oldClassId, targetClassId)) {
            return learner;
        }

        _Class oldClass = classRepository.findByIdAndNotDeleted(oldClassId)
                .orElseThrow(() -> new IllegalArgumentException("Current learner class is missing or deleted"));
        if (oldClass.isGroupBacked()) {
            throw new IllegalArgumentException(
                    "Current learner class is not a primary section. Correct the learner academic placement first.");
        }

        // Serialize moves into the same destination section so two admins cannot both pass a
        // capacity check against the same stale count.
        _Class targetClass = classRepository.findByIdForUpdate(targetClassId)
                .orElseThrow(() -> new IllegalArgumentException("Destination class was not found"));
        if (Boolean.TRUE.equals(targetClass.getIsDeleted())) {
            throw new IllegalArgumentException("Destination class is deleted");
        }
        if (targetClass.isGroupBacked()) {
            throw new IllegalArgumentException("Elective/group-backed classes cannot be used as a learner's primary section");
        }
        if (oldClass.getBatchId() == null || targetClass.getBatchId() == null
                || !Objects.equals(oldClass.getBatchId(), targetClass.getBatchId())) {
            throw new IllegalArgumentException("Students can only be moved between sections in the same batch");
        }
        if (oldClass.getProgramId() != targetClass.getProgramId()) {
            throw new IllegalArgumentException("Students can only be moved between sections in the same program");
        }

        Integer targetCollegeId = scopeResolutionService.resolveClassToCollegeId(targetClassId);
        if (targetCollegeId == null || learner.getCollegeId() == null
                || !Objects.equals(learner.getCollegeId(), targetCollegeId)) {
            throw new IllegalArgumentException("Destination class must belong to the learner's college");
        }

        int activeTargetLearners = learnerRepository.getActiveStudentDetailsByClassId(targetClassId).size();
        if (targetClass.getUpperLimit() > 0 && activeTargetLearners >= targetClass.getUpperLimit()) {
            throw new IllegalStateException(
                    "Destination class is at capacity (" + targetClass.getUpperLimit() + " students)");
        }

        Integer oldProgramId = learner.getProgramId();
        Integer organizationId = learner.getOrganizationId();
        Integer collegeId = learner.getCollegeId();
        Integer oldBatchId = oldClass.getBatchId();

        // Only placement changes here. Do NOT route this through setLearnerdetails(): the class
        // roster DTO intentionally omits most profile fields, so a full update would erase them.
        learner.setClassId(targetClassId);
        learner.setProgramId(targetClass.getProgramId());
        Learner saved = learnerRepository.save(learner);

        if (jobVisibilityCache != null && organizationId != null) {
            jobVisibilityCache.invalidateForHierarchy(
                    organizationId, collegeId, oldClassId, oldBatchId, oldProgramId);
            jobVisibilityCache.invalidateForHierarchy(
                    organizationId, collegeId, targetClassId, targetClass.getBatchId(), targetClass.getProgramId());
        }
        return saved;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteLearner(Integer id) {
        Learner learner = learnerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Learner not found with id: " + id));

        // job_application/interview both have ON DELETE CASCADE on learner_id
        // (V104__placements_cascade_on_learner_delete.sql), so a hard delete here would
        // silently and permanently destroy this learner's entire placement history — including
        // any HIRED record — with no soft-delete/recovery path, unlike every other entity in
        // the placements module. Block it rather than let that happen unnoticed.
        if (jobApplicationRepository != null && jobApplicationRepository.existsByLearnerId(id)) {
            throw new IllegalStateException(
                    "Cannot delete this learner: they have placement application/interview history. " +
                    "Deleting the account would permanently and irrecoverably destroy that history.");
        }

        learnerRepository.delete(learner);
    }
}

