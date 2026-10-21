package com._42students.lms.service.tpo;

import com._42students.lms.dto.tpo.DriveForm;
import com._42students.lms.dto.tpo.RoundForm;
import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.tpo.JobLifecycleStatus;
import com._42students.lms.model.tpo.JobRound;
import com._42students.lms.model.Interview;
import com._42students.lms.repository.InterviewRepository;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.service.JobApplicationStatusHistoryService;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.tpo.JobRoundRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Drive create/publish/close/cancel — the primary V1 path (TPO, no recruiter login required). See
 * TPO V1 - Locked.docx §4-5. Every action here works with recruiterId == null; the recruiter portal (later
 * slice) reuses this same service so a company logging in is a faster lane, not a separate model.
 */
@Service
@RequiredArgsConstructor
public class TpoDriveService {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private DriveChangeRequestService changeRequests;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private CompanyJoinService companyJoin;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private CollegePublicLinkService publicLinks;

    /** Optional so tests that build this service directly keep working. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.company.CompanyDirectoryService companyDirectory;


    private final JobRepository jobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final JobRoundRepository jobRoundRepository;
    private final JobLifecycleService lifecycleService;
    private final NotificationOutboxService outboxService;
    private final ObjectMapper objectMapper;
    private final TpoAuditService audit;
    private final TpoAnnouncementService announcer;
    private final TpoMailService mail;
    private final org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;
    private final TpoSeasonService seasonService;
    private final InterviewRepository interviewRepository;
    private final JobApplicationStatusHistoryService statusHistoryService;
    private final TpoRequestService requestService;
    private final TpoSettingsHubService settingsHub;
    private final JobTypeService jobTypes;
    private final LiveDriveChangeService liveDriveChange;

    @Transactional
    public Job createDraft(DriveForm form, Integer organizationId, Integer collegeId, Integer createdByFacultyId) {
        requireValidTitle(form);
        Job job = new Job();
        applyForm(job, form, collegeId);
        job.setOrganizationId(organizationId);
        job.setCollegeId(collegeId);
        job.setCreatedBy(createdByFacultyId);
        job.setOwnerFacultyId(createdByFacultyId);
        job.setPostedDate(LocalDateTime.now());
        job.setScreeningVersion("v1");
        job.setVisibilityType("INTERNAL_ONLY");
        lifecycleService.transition(job, JobLifecycleStatus.DRAFT);
        job = jobRepository.save(job);
        saveRounds(job.getId(), form.getRounds());
        return job;
    }

    @Transactional
    public void deleteDraft(Integer jobId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        if (!JobLifecycleStatus.DRAFT.equals(job.getLifecycleStatus())) {
            throw new IllegalStateException("Only a draft can be deleted. Cancel or close a published drive instead.");
        }
        Long applied = jdbc.queryForObject("SELECT COUNT(*) FROM job_application WHERE job_id = :j AND (is_deleted = 0 OR is_deleted IS NULL)",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("j", jobId), Long.class);
        if (applied != null && applied > 0) throw new IllegalStateException("Students are already on this drive: cancel it instead.");
        job.setIsDeleted(true);
        jobRepository.save(job);
    }

    @Transactional
    public Job updateDraft(Integer jobId, DriveForm form) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        if (java.util.List.of(JobLifecycleStatus.CLOSED, JobLifecycleStatus.CANCELLED, JobLifecycleStatus.REJECTED).contains(job.getLifecycleStatus())) {
            throw new IllegalStateException("This drive is " + job.getLifecycleStatus().toLowerCase(java.util.Locale.ROOT)
                    + " and can't be changed. To run it again, copy it from Create drive.");
        }
        if (fromRecruiterAfterApproval(job)) requireOnlyCollegeOwnedChanges(job, form);
        applyForm(job, form, job.getCollegeId());
        jobRepository.save(job);
        if (form.getRounds() != null) saveRounds(jobId, form.getRounds());
        if (Boolean.TRUE.equals(form.getNotifyApplicants())) liveDriveChange.tellApplicants(job, null);
        // A live drive's rules may have changed: applicants they now leave out are flagged for the placement cell (19 Oct 2026).
        liveDriveChange.recheckEligibility(job);
        return job;
    }

    /** A drive a recruiter asked for, once the TPO approved it. Before approval the TPO edits the request freely while reviewing. */
    private static boolean fromRecruiterAfterApproval(Job job) {
        return job.getRecruiterId() != null && (JobLifecycleStatus.DRAFT.equals(job.getLifecycleStatus()) || JobLifecycleStatus.PUBLISHED.equals(job.getLifecycleStatus()));
    }

    /**
     * On a drive from a recruiter the TPO may change dates, venue and deadline, tighten eligibility and add college rules. CTC, role
     * options and locations, and loosening eligibility, are the company's: the TPO asks in Messages and the recruiter resubmits
     * (TPO V1 - Locked.docx §4 "Changes after approval").
     */
    private void requireOnlyCollegeOwnedChanges(Job job, DriveForm form) {
        String company = "belongs to the company. Ask them in Messages and they can send it again.";
        if (form.getRoleOptions() != null && !jsonEquals(asRoleOptions(job.getRoleOptionsJson()), form.getRoleOptions())) {
            throw new IllegalStateException("The CTC and pay packages " + company);
        }
        if (form.getLocation() != null && job.getLocation() != null && !form.getLocation().equals(job.getLocation())) {
            throw new IllegalStateException("The location " + company);
        }
        if (form.getEligibility() != null && isLoosened(objectMapper.convertValue(job.getEligibilityJson(), com._42students.lms.model.tpo.JobEligibility.class), form.getEligibility())) {
            throw new IllegalStateException("Loosening eligibility " + company + " You can tighten it.");
        }
    }

    /** Stored packages read as packages (unknown keys such as the removed bond fields dropped), so a comparison sees only pay. */
    private Object asRoleOptions(Object stored) {
        if (stored == null) return null;
        try {
            Object v = stored instanceof String s ? objectMapper.readValue(s, Object.class) : stored;
            return objectMapper.convertValue(v, new com.fasterxml.jackson.core.type.TypeReference<List<com._42students.lms.model.tpo.JobRoleOption>>() {});
        } catch (Exception e) {
            return stored;
        }
    }

    private boolean jsonEquals(Object a, Object b) {
        try { return objectMapper.valueToTree(a == null ? List.of() : a).equals(objectMapper.valueToTree(b)); } catch (Exception e) { return false; }
    }

    /** True when the new rules admit someone the old rules did not. */
    static boolean isLoosened(com._42students.lms.model.tpo.JobEligibility oldE, com._42students.lms.model.tpo.JobEligibility newE) {
        if (oldE == null) return false;
        if (newE == null) newE = new com._42students.lms.model.tpo.JobEligibility();
        return lowerMin(oldE.getMinCgpa(), newE.getMinCgpa()) || lowerMin(oldE.getMinPctThroughout(), newE.getMinPctThroughout())
                || lowerMin(oldE.getTenthMinPct(), newE.getTenthMinPct()) || lowerMin(oldE.getTwelfthMinPct(), newE.getTwelfthMinPct())
                || lowerMin(oldE.getDiplomaMinPct(), newE.getDiplomaMinPct()) || lowerMin(oldE.getUgMinPct(), newE.getUgMinPct())
                || lowerMin(oldE.getPgMinPct(), newE.getPgMinPct())
                || widerList(oldE.getBranches(), newE.getBranches()) || widerList(oldE.getPassingYears(), newE.getPassingYears())
                || widerList(oldE.getBatchIds(), newE.getBatchIds())
                // A diversity drive opened up, or "verified marks only" switched off, admits people too.
                || (oldE.getGender() != null && !oldE.getGender().equalsIgnoreCase(newE.getGender() == null ? "" : newE.getGender()))
                || (Boolean.TRUE.equals(oldE.getVerifiedMarksOnly()) && !Boolean.TRUE.equals(newE.getVerifiedMarksOnly()));
    }
    private static boolean lowerMin(Double o, Double n) { return o != null && (n == null || n < o); }
    private static boolean widerList(List<?> o, List<?> n) {
        if (o == null || o.isEmpty()) return false;              // everyone was already allowed
        if (n == null || n.isEmpty()) return true;               // now everyone is
        return !o.containsAll(n);                                // a value that was not allowed before
    }

    /** The few fields the TPO compares when a request comes back. */
    private Object requestSnapshot(Job job) {
        java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("jobTitle", job.getJobTitle()); m.put("jobDescription", job.getJobDescription()); m.put("jdUrl", job.getJdUrl()); m.put("location", job.getLocation());
        m.put("roleOptions", job.getRoleOptionsJson()); m.put("eligibility", job.getEligibilityJson());
        m.put("applicationDeadline", job.getApplicationDeadline() == null ? null : job.getApplicationDeadline().toString());
        return m;
    }

    /**
     * The numbers a drive can actually have. The form checks some of them; the server checked none, so a recruiter request or
     * an edited call could save a minimum CGPA of 75 (nobody eligible), a negative CTC or a 1,000-month bond.
     */
    static void checkFormValues(DriveForm form) {
        com._42students.lms.model.tpo.JobEligibility e = form.getEligibility();
        if (e != null) {
            inRange(e.getMinCgpa(), 0, 10, "Minimum CGPA");
            for (Object[] f : new Object[][]{{e.getMinPctThroughout(), "Minimum % throughout"}, {e.getTenthMinPct(), "10th minimum"}, {e.getTwelfthMinPct(), "12th minimum"},
                    {e.getDiplomaMinPct(), "Diploma minimum"}, {e.getUgMinPct(), "UG minimum"}, {e.getPgMinPct(), "PG minimum"}}) {
                inRange((Double) f[0], 0, 100, (String) f[1]);
            }
        }
        if (form.getRoleOptions() != null) {
            for (com._42students.lms.model.tpo.JobRoleOption o : form.getRoleOptions()) {
                for (Object[] f : new Object[][]{{o.getCtcLpa(), "CTC"}, {o.getFixedLpa(), "Fixed pay"}, {o.getVariableLpa(), "Variable pay"}, {o.getJoiningBonusLpa(), "Joining bonus"}}) {
                    if (f[0] != null) inRange(((BigDecimal) f[0]).doubleValue(), 0, 1000, f[1] + " (LPA)");
                }
                if (o.getStipendPerMonth() != null && o.getStipendPerMonth().signum() < 0) throw new IllegalArgumentException("The stipend can't be negative");
                if (o.getStipendMonths() != null) inRange(o.getStipendMonths().doubleValue(), 0, 36, "Stipend months");
            }
        }
    }

    private static void inRange(Double v, double lo, double hi, String what) {
        if (v != null && (v < lo || v > hi)) throw new IllegalArgumentException(what + " must be between " + (lo == (long) lo ? String.valueOf((long) lo) : String.valueOf(lo)) + " and " + (hi == (long) hi ? String.valueOf((long) hi) : String.valueOf(hi)));
    }

    private void applyForm(Job job, DriveForm form, Integer collegeId) {
        checkFormValues(form);
        if (form.getJobTitle() != null) job.setJobTitle(form.getJobTitle());
        if (form.getCompanyName() != null) job.setCompanyName(form.getCompanyName());
        if (form.getCompanyLogo() != null) job.setCompanyLogo(form.getCompanyLogo());
        if (form.getCompanyId() != null) {
            // The TPO picked a company (N3): it joins this college's list, and a company on 42's verified list keeps 42's name.
            com._42students.lms.model.Company company = companyDirectory == null ? null : companyDirectory.live(form.getCompanyId())
                    .orElseThrow(() -> new IllegalArgumentException("That company no longer exists. Pick it again."));
            job.setCompanyId(form.getCompanyId());
            if (company != null) {
                companyDirectory.ensureListed(collegeId, company.getId());
                if (Boolean.TRUE.equals(company.getVerifiedBy42()) || job.getCompanyName() == null || job.getCompanyName().isBlank()) job.setCompanyName(company.getName());
                if ((job.getCompanyLogo() == null || job.getCompanyLogo().isBlank()) && company.getLogoUrl() != null) job.setCompanyLogo(company.getLogoUrl());
            }
        }
        if (form.getJobDescription() != null) job.setJobDescription(com._42students.lms.util.TextSanitizer.sanitizeRichTextAndTruncate(form.getJobDescription(), 15000));
        if (form.getJdUrl() != null) {
            String jd = form.getJdUrl().trim();
            if (jd.length() > 500 || (!jd.isEmpty() && !(jd.startsWith("https://") || jd.startsWith("http://")))) throw new IllegalArgumentException("The job description link is not valid");
            job.setJdUrl(jd.isEmpty() ? null : jd);
        }
        if (form.getLocation() != null) job.setLocation(form.getLocation());
        if (form.getDriveMode() != null) {
            if (!java.util.List.of("ON_CAMPUS", "POOL", "OFF_CAMPUS").contains(form.getDriveMode())) {
                throw new IllegalArgumentException("Mode must be on campus, pool or off campus");
            }
            job.setDriveMode(form.getDriveMode());
        }
        if (form.getJobType() != null) {
            // The college's own list (Settings > Job types); the drive carries whether its offers count as placed.
            String type = jobTypes.normalize(collegeId, form.getJobType(), job.getJobType());
            job.setJobType(type);
            job.setCountsAsPlaced(jobTypes.countsAsPlaced(collegeId, type));
        }
        if (form.getRecordedOutside() != null) job.setRecordedOutside(form.getRecordedOutside());
        job.setHostCollegeName(form.getHostCollegeName());
        job.setReportingAt(form.getReportingAt());
        job.setTravelNote(form.getTravelNote());
        job.setExternalApplyUrl(form.getExternalApplyUrl());
        job.setRequiresExternalRegistration(Boolean.TRUE.equals(form.getRequiresExternalRegistration()));
        job.setExternalPortalName(form.getExternalPortalName());
        job.setExternalPortalUrl(form.getExternalPortalUrl());
        // TPO-created drives never sent a seasonId, so they floated with seasonId == null - which
        // a season filter elsewhere treats as "belongs to every season" (d.seasonId == null is
        // included under any selected season) and which never qualifies as a past-season drive
        // for read-only enforcement. Default a brand-new drive (job.getId() == 0, i.e. before the
        // initial save - Job's id is a primitive int) to the college's current season when the
        // form doesn't specify one; never overwrite an existing drive's season on update just
        // because the form omitted it.
        if (form.getSeasonId() != null) {
            job.setSeasonId(form.getSeasonId());
        } else if (job.getId() == 0) {
            var current = seasonService.current(collegeId);
            if (current != null) job.setSeasonId(current.getId());
        }
        job.setApplicationDeadline(form.getApplicationDeadline());

        if (form.getRoleOptions() != null) {
            job.setRoleOptionsJson(objectMapper.convertValue(form.getRoleOptions(), Object.class));
            job.setCtcRange(deriveCtcRange(form));
        }
        if (form.getEligibility() != null) {
            job.setEligibilityJson(objectMapper.convertValue(form.getEligibility(), Object.class));
        }
        if (form.getWantedSkills() != null) job.setCandidatePreferences(withWantedSkills(job.getCandidatePreferences(), form.getWantedSkills()));
        if (form.getCategory() != null) {
            job.setCategory(form.getCategory());
            job.setCategoryOverrideReason(form.getCategoryOverrideReason());
        } else if (job.getCategory() == null) {
            job.setCategory(deriveCategory(form));
        }
    }

    /**
     * The drive's candidate preferences with preferredSkills replaced (other keys kept): trimmed, de-duplicated ignoring case,
     * at most 30 of up to 50 characters each, which is what the candidate-preferences validator accepts.
     */
    @SuppressWarnings("unchecked")
    private java.util.Map<String, Object> withWantedSkills(Object current, List<String> skills) {
        java.util.Map<String, Object> prefs = new java.util.LinkedHashMap<>();
        if (current != null) {
            Object m = current instanceof String str && !str.isBlank() ? readJson(str) : objectMapper.convertValue(current, Object.class);
            if (m instanceof java.util.Map<?, ?> map) prefs.putAll((java.util.Map<String, Object>) map);
        }
        java.util.LinkedHashMap<String, String> clean = new java.util.LinkedHashMap<>();
        for (String raw : skills) {
            String v = raw == null ? "" : raw.trim().replaceAll("\\s+", " ");
            if (v.isEmpty()) continue;
            if (v.length() > 50) throw new IllegalArgumentException("A skill can be at most 50 characters");
            clean.putIfAbsent(v.toLowerCase(java.util.Locale.ROOT), v);
        }
        if (clean.size() > 30) throw new IllegalArgumentException("A drive can list at most 30 skills");
        if (clean.isEmpty()) prefs.remove("preferredSkills");
        else prefs.put("preferredSkills", new java.util.ArrayList<>(clean.values()));
        return prefs.isEmpty() ? null : prefs;
    }

    private Object readJson(String s) {
        try { return objectMapper.readValue(s, Object.class); } catch (Exception e) { return null; }
    }

    /** Category defaults from CTC unless the TPO overrides it with a reason (TPO-8). */
    private String deriveCategory(DriveForm form) {
        if (form.getRoleOptions() == null || form.getRoleOptions().isEmpty()) return "REGULAR";
        BigDecimal max = form.getRoleOptions().stream()
                .map(r -> r.getCtcLpa() == null ? BigDecimal.ZERO : r.getCtcLpa())
                .max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        if (max.compareTo(BigDecimal.valueOf(20)) >= 0) return "SUPER_DREAM";
        if (max.compareTo(BigDecimal.valueOf(10)) >= 0) return "DREAM";
        return "REGULAR";
    }

    private String deriveCtcRange(DriveForm form) {
        return ctcRangeOf(form.getRoleOptions());
    }

    /**
     * The drive's pay as one line ("4.5-6 LPA", or "₹25,000 a month" for a stipend-only internship), from the options that have it.
     * A missing CTC used to count as zero, so a drive whose pay wasn't set yet, or an internship with only a stipend, read "0 LPA"
     * to students and recruiters (night audit 13 Oct 2026). Nothing set: null.
     */
    static String ctcRangeOf(List<com._42students.lms.model.tpo.JobRoleOption> options) {
        if (options == null) return null;
        List<BigDecimal> ctcs = options.stream().filter(java.util.Objects::nonNull).map(com._42students.lms.model.tpo.JobRoleOption::getCtcLpa)
                .filter(c -> c != null && c.signum() > 0).toList();
        if (!ctcs.isEmpty()) {
            BigDecimal min = ctcs.stream().min(BigDecimal::compareTo).orElseThrow().stripTrailingZeros();
            BigDecimal max = ctcs.stream().max(BigDecimal::compareTo).orElseThrow().stripTrailingZeros();
            return min.compareTo(max) == 0 ? (min.toPlainString() + " LPA") : (min.toPlainString() + "-" + max.toPlainString() + " LPA");
        }
        return options.stream().filter(java.util.Objects::nonNull).map(com._42students.lms.model.tpo.JobRoleOption::getStipendPerMonth)
                .filter(v -> v != null && v.signum() > 0).max(BigDecimal::compareTo)
                .map(v -> "₹" + indianGrouping(v.setScale(0, java.math.RoundingMode.HALF_UP).toPlainString()) + " a month").orElse(null);
    }

    /** "120000" as "1,20,000", the way the screens write rupees (the JDK's en_IN format groups in threes). */
    static String indianGrouping(String digits) {
        if (digits.length() <= 3) return digits;
        String head = digits.substring(0, digits.length() - 3), tail = digits.substring(digits.length() - 3);
        return head.replaceAll("\\B(?=(\\d{2})+$)", ",") + "," + tail;
    }

    /**
     * The round a drive save may write (BE-0054, S0): a new one, or one that already belongs to this drive. A round id sent in
     * the body used to be looked up anywhere and moved onto this drive, so any caller could take another college's round.
     * An id that is unknown or belongs to another drive is refused, the same way for both, so ids can't be probed.
     */
    static JobRound roundForSave(java.util.Optional<JobRound> found, Long roundId, Integer jobId) {
        if (roundId == null) return new JobRound();
        JobRound round = found == null ? null : found.orElse(null);
        if (round == null || jobId == null || !jobId.equals(round.getJobId())) {
            throw new IllegalArgumentException("Round not found on this drive");
        }
        return round;
    }

    private void saveRounds(Integer jobId, List<RoundForm> rounds) {
        if (rounds == null) return;
        // Full replace-by-seq for V1 simplicity: existing rows for this job are updated by id
        // where given, new ones inserted, and any not present are left as-is (never silently
        // deleted, since round_result rows may already reference them).
        int seq = 1;
        for (RoundForm rf : rounds) {
            // A round with no type used to reach the database and come back as a 500 (recruiter UX audit, 19 Oct 2026).
            if (rf.getKind() == null || rf.getKind().isBlank()) throw new IllegalArgumentException("Choose a type for round " + seq);
            JobRound round = roundForSave(rf.getId() == null ? null : jobRoundRepository.findById(rf.getId()), rf.getId(), jobId);
            round.setJobId(jobId);
            round.setSeq(seq++);
            round.setKind(rf.getKind());
            round.setName(rf.getName());
            round.setMode(rf.getMode());
            round.setScheduledDate(rf.getScheduledDate());
            round.setVenue(rf.getVenue());
            round.setMeetingUrl(rf.getMeetingUrl());
            round.setWhatToBring(rf.getWhatToBring());
            round.setPlatform(rf.getPlatform());
            round.setTestLink(rf.getTestLink());
            round.setDurationMinutes(rf.getDurationMinutes());
            round.setResultsDue(rf.getResultsDue());
            if (round.getStatus() == null) round.setStatus("PENDING");
            if (round.getCreatedAt() == null) round.setCreatedAt(LocalDateTime.now());
            round.setUpdatedAt(LocalDateTime.now());
            jobRoundRepository.save(round);
        }
    }

    /** Job.jobTitle is validated 3-100 by the entity; refuse early with a clear message instead of a 500. */
    private static void requireValidTitle(DriveForm form) {
        String t = form.getJobTitle() == null ? "" : form.getJobTitle().trim();
        if (t.length() < 3 || t.length() > 100) {
            throw new IllegalArgumentException("Role title must be between 3 and 100 characters");
        }
    }

    /**
     * A drive requested by a recruiter for one college: lands in the TPO's Requests tab, invisible to
     * students (REQUEST is draft-like). The company is the recruiter's own, passed in by the caller; whatever
     * the form says about company is discarded, so a recruiter cannot request a drive as another company.
     */
    @Transactional
    public Job createRequest(DriveForm form, Integer organizationId, Integer collegeId, Long recruiterId, String companyName) {
        requireValidTitle(form);
        form.setRecordedOutside(null); // only the placement cell records an outside drive
        form.setCompanyName(companyName);
        form.setCompanyLogo(null);
        form.setCompanyId(null);
        Job job = new Job();
        applyForm(job, form, collegeId);
        // The drive is the recruiter's company's: the shared company behind their work email (L1), on this college's list.
        List<Integer> recruiterCompany = jdbc.queryForList("SELECT company_id FROM recruiter WHERE id = :h AND company_id IS NOT NULL",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("h", recruiterId), Integer.class);
        if (!recruiterCompany.isEmpty()) {
            job.setCompanyId(recruiterCompany.get(0));
            if (companyDirectory != null) companyDirectory.ensureListed(collegeId, recruiterCompany.get(0));
        }
        job.setOrganizationId(organizationId);
        job.setCollegeId(collegeId);
        job.setRecruiterId(recruiterId);
        job.setPostedDate(LocalDateTime.now());
        job.setScreeningVersion("v1");
        job.setVisibilityType("INTERNAL_ONLY");
        lifecycleService.transition(job, JobLifecycleStatus.REQUEST);
        job = jobRepository.save(job);
        saveRounds(job.getId(), form.getRounds());
        String trust = trustReason(recruiterId, collegeId);
        boolean trusted = trust != null;
        if (trusted || (!settingsHub.recruiterDriveNeedsApproval(collegeId) && !recruiterAwaitsVerification(recruiterId, collegeId))) {
            lifecycleService.transition(job, JobLifecycleStatus.DRAFT);
            job.setSentBackNote(null);
            job = jobRepository.save(job);
            // Says which rule let it through: the bell used to say "trusted domain" for a public-link recruiter too (audit 13 Oct 2026, P2).
            String why = trusted ? trust : "approval is switched off in Settings";
            audit.log(collegeId, "SYSTEM", null, "REQUEST_AUTO_APPROVED", "DRIVE", (long) job.getId(), trusted ? trust : "Approval switched off");
            audit.bell(collegeId, "DRIVE_REQUEST", "Request from " + companyName + " approved automatically (" + why + ")", job.getJobTitle() + ": review and publish", "/tpo/drives/" + job.getId());
            tellRecruiter(job, "approved", null);
            return job;
        }
        audit.bell(collegeId, "DRIVE_REQUEST", "New drive request from " + companyName, job.getJobTitle(), "/tpo/drives/" + job.getId());
        return job;
    }

    /**
     * Settings, Trusted companies: a recruiter whose access is not waiting for verification and whose email is at a domain the college
     * trusts does not need the placement cell to approve their drive request. The TPO still reviews and publishes the draft.
     */
    private boolean recruiterAwaitsVerification(Long recruiterId, Integer collegeId) {
        if (recruiterId == null) return true;
        List<String> v = jdbc.queryForList("SELECT verification FROM recruiter_college_access WHERE recruiter_id = :h AND college_id = :c",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("h", recruiterId).addValue("c", collegeId), String.class);
        return v.isEmpty() || "PENDING".equals(v.get(0));
    }

    boolean isTrustedRecruiter(Long recruiterId, Integer collegeId) {
        return trustReason(recruiterId, collegeId) != null;
    }

    /** Why this recruiter's requests skip approval, in the bell's words; null when they don't. */
    String trustReason(Long recruiterId, Integer collegeId) {
        if (recruiterId == null) return null;
        // Joined through the college's public link, and the college lets those post directly (N6).
        if (publicLinks != null && publicLinks.postsDirect(recruiterId, collegeId)) return "joined through your public link";
        // A company the college marked trusted (recruiter phase 1, N5): its drives go live without review.
        if (companyJoin != null) {
            List<Integer> company = jdbc.queryForList("SELECT company_id FROM recruiter WHERE id = :h AND company_id IS NOT NULL",
                    new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("h", recruiterId), Integer.class);
            if (!company.isEmpty() && companyJoin.isTrusted(collegeId, company.get(0))) return "trusted company";
        }
        List<String> mail = jdbc.queryForList("SELECT contact_mail FROM recruiter WHERE id = :h", new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("h", recruiterId), String.class);
        if (mail.isEmpty() || mail.get(0) == null || !mail.get(0).contains("@")) return null;
        String domain = mail.get(0).substring(mail.get(0).lastIndexOf('@') + 1).trim().toLowerCase();
        List<String> pending = jdbc.queryForList("SELECT verification FROM recruiter_college_access WHERE recruiter_id = :h AND college_id = :c",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("h", recruiterId).addValue("c", collegeId), String.class);
        if (pending.isEmpty() || "PENDING".equals(pending.get(0))) return null;
        List<String> raw = jdbc.queryForList("SELECT trusted_domains_json FROM tpo_college_settings WHERE college_id = :c",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("c", collegeId), String.class);
        if (raw.isEmpty() || raw.get(0) == null) return null;
        try {
            List<?> domains = objectMapper.readValue(raw.get(0), List.class);
            for (Object d : domains) if (domain.equals(String.valueOf(d).trim().toLowerCase().replaceFirst("^@", ""))) return "trusted domain";
        } catch (Exception ignored) {
            // A damaged list trusts nobody.
        }
        return null;
    }

    /** The recruiter fixes a request the TPO sent back and submits it again. Only their own, only when sent back. */
    @Transactional
    public Job resubmitRequest(Integer jobId, DriveForm form, Long recruiterId, String companyName) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        if (job.getRecruiterId() == null || !job.getRecruiterId().equals(recruiterId)) throw new IllegalArgumentException("Not found");
        if (!JobLifecycleStatus.SENT_BACK.equals(job.getLifecycleStatus()) && !JobLifecycleStatus.REQUEST.equals(job.getLifecycleStatus())) {
            throw new IllegalStateException("Only a drive in review can be edited by the company");
        }
        requireValidTitle(form);
        form.setCompanyName(companyName);
        form.setCompanyLogo(null);
        form.setCompanyId(null);
        job.setPreviousRequestJson(requestSnapshot(job));
        applyForm(job, form, job.getCollegeId());
        job.setSentBackNote(null);
        lifecycleService.transition(job, JobLifecycleStatus.REQUEST);
        jobRepository.save(job);
        if (form.getRounds() != null) saveRounds(jobId, form.getRounds());
        return job;
    }

    /** TPO accepts a recruiter's request: it becomes a draft the TPO owns, ready to publish. */
    @Transactional
    public Job approveRequest(Integer jobId, Integer actorId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        if (!JobLifecycleStatus.REQUEST.equals(job.getLifecycleStatus())) {
            throw new IllegalStateException("Only a pending request can be approved");
        }
        lifecycleService.transition(job, JobLifecycleStatus.DRAFT);
        job.setOwnerFacultyId(actorId);
        job.setSentBackNote(null);
        job.setChangesMadeAt(null);
        Job saved = jobRepository.save(job);
        tellRecruiter(saved, "approved", null);
        return saved;
    }

    @Transactional
    public Job rejectRequest(Integer jobId, String reason) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        if (!JobLifecycleStatus.REQUEST.equals(job.getLifecycleStatus())) {
            throw new IllegalStateException("Only a pending request can be rejected");
        }
        lifecycleService.transition(job, JobLifecycleStatus.REJECTED);
        job.setSentBackNote(reason);
        Job saved = jobRepository.save(job);
        tellRecruiter(saved, "not accepted", reason);
        return saved;
    }

    public List<JobRound> rounds(Integer jobId) {
        return jobRoundRepository.findByJobIdOrderBySeqAsc(jobId);
    }

    /** Publish confirms with a preview in the UI; this just flips the switch and notifies. */
    @Transactional
    public Job publish(Integer jobId, Integer actorId, boolean notifyByEmail) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        // The job type decides whether its offers count as placed: chosen, never assumed (an intern drive used to default to Full-time).
        List<String> blockers = publishBlockers(job, LocalDateTime.now(java.time.ZoneOffset.UTC));
        if (!blockers.isEmpty()) throw new IllegalStateException(blockers.get(0));
        lifecycleService.transition(job, JobLifecycleStatus.PUBLISHED);
        if (job.getPostedDate() == null) job.setPostedDate(LocalDateTime.now());
        jobRepository.save(job);
        // A drive recorded after it happened outside is not an opening: nobody is told about it.
        if (!Boolean.TRUE.equals(job.getRecordedOutside())) announcer.announcePublished(job); // every eligible student is told: App, and Email unless the college switched it off
        // "Debarred for N drives": each drive the college opens counts one against every such debarment still running, so it
        // ends after N drives (drives_counted was never moved: these debarments never ended).
        if (!Boolean.TRUE.equals(job.getRecordedOutside()) && job.getCollegeId() != null) {
            jdbc.update("UPDATE placement_debarment d JOIN learner l ON l.id = d.learner_id SET d.drives_counted = d.drives_counted + 1 " +
                    "WHERE l.college_id = :c AND d.lifted_at IS NULL AND d.until_date IS NULL AND d.until_drives IS NOT NULL AND d.drives_counted < d.until_drives",
                    new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("c", job.getCollegeId()));
        }
        return job;
    }

    @Transactional
    public Job sendBack(Integer jobId, String note) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        if (!JobLifecycleStatus.REQUEST.equals(job.getLifecycleStatus())) {
            throw new IllegalStateException("Only a drive in review can get a change request");
        }
        // Recruiter phase 1 (N14): nothing is "sent back" any more. The note becomes an institutional request the company
        // answers in place; the drive stays in review.
        if (changeRequests != null) {
            DriveChangeRequestService.NewRequest r = new DriveChangeRequestService.NewRequest();
            r.field = "OTHER";
            r.kind = "ASK";
            r.note = note;
            changeRequests.create(jobId, r, new DriveChangeRequestService.Actor("FACULTY", null, null));
        }
        Job saved = jobRepository.findById(jobId).orElse(job);
        tellRecruiter(saved, "asked for a change", note);
        return saved;
    }

    /** Application statuses that are still "in play" on a drive; ending a drive ends exactly these. */
    private static final List<String> OPEN_APPLICATION_STATUSES = List.of("APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "WAITLISTED");

    /**
     * PVN-B009 (PVN-027.01-.09): the shared cascade for a drive that ends (cancelled or closed).
     * Every open application becomes REJECTED with student-facing wording and an internal-only
     * reason, the change is written to the status history (so the student's timeline shows it),
     * and any interview still SCHEDULED/CONFIRMED/RESCHEDULE_REQUESTED for it is cancelled so it
     * stops appearing on calendars and reminders. Locking reads match the legacy admin cascade.
     *
     * @return the applications that were ended (now REJECTED; getRejectionReason() is the student wording)
     */
    private List<JobApplication> endOpenApplications(Integer jobId, java.util.function.Function<String, String> studentMessageForOldStatus,
                                                     String internalReason, Integer actorId) {
        List<JobApplication> ended = new java.util.ArrayList<>();
        for (JobApplication app : jobApplicationRepository.findByJobId(jobId)) {
            String old = String.valueOf(app.getApplicationStatus());
            if (!OPEN_APPLICATION_STATUSES.contains(old)) continue;
            String message = studentMessageForOldStatus.apply(old);
            app.setApplicationStatus("REJECTED");
            app.setRejectionReason(message);
            app.setInternalReason(internalReason);
            app.setStatusUpdatedAt(LocalDateTime.now());
            app.setStatusUpdatedBy(actorId);
            jobApplicationRepository.save(app);
            statusHistoryService.recordStatusChange(app.getId(), old, "REJECTED", actorId, message);
            for (Interview interview : interviewRepository.findNonTerminalByJobApplicationIdForUpdate(app.getId())) {
                interview.setInterviewStatus("CANCELLED");
                interviewRepository.save(interview);
            }
            ended.add(app);
        }
        return ended;
    }

    @Transactional
    public Job cancel(Integer jobId, String reason, Integer actorId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        lifecycleService.transition(job, JobLifecycleStatus.CANCELLED);
        job.setCancelledAt(LocalDateTime.now());
        job.setCancelledReason(reason);
        jobRepository.save(job);

        // A pending withdrawal on a drive that no longer exists is moot - grant it first (the
        // student is excused) so it can't dangle in the TPO queue or be rejected by the cascade.
        requestService.settleForEndedDrive(jobId, "Drive cancelled", true);

        // Selections never released were never told to anyone: they end with the drive. They used to stay "to verify" for good,
        // and could still be released on the cancelled drive.
        jdbc.update("UPDATE job_offer o JOIN job_application a ON a.id = o.application_id SET o.status = 'WITHDRAWN', o.updated_at = NOW() " +
                "WHERE a.job_id = :j AND o.status IN ('SELECTED','PENDING_VERIFICATION')", new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("j", jobId));

        // Who is told: the students whose application this ends. Offers stay as they are (the confirmation says so, and the
        // placement cell withdraws them on the Offers tab if the company pulls them), so an offered or placed student is not
        // told "drive cancelled" about an offer that still stands - they used to be.
        List<JobApplication> before = jobApplicationRepository.findByJobId(jobId);
        java.util.Set<Integer> toNotify = new java.util.HashSet<>();
        for (JobApplication app : endOpenApplications(jobId, old -> "Drive cancelled", "Drive cancelled", actorId)) {
            if (app.getLearner() != null) toNotify.add(app.getId());
        }

        for (JobApplication app : before) {
            if (!toNotify.contains(app.getId())) continue;
            outboxService.enqueue("DRIVE_CANCELLED", "LEARNER", app.getLearner().getId(), "APP",
                    Map.of("jobId", jobId, "reason", reason == null ? "" : reason, "company", String.valueOf(job.getCompanyName()), "role", String.valueOf(job.getJobTitle())), null, false);
        }
        tellRecruiter(job, "cancelled", reason); // recruiter V1 §1 email table: "Drive approved / sent back / cancelled"
        return job;
    }

    /**
     * Close drive: every open applicant becomes Not selected/Waitlist ended, told, and open
     * requests for this drive are approved (TPO V1 - Locked.docx §5). Offers are untouched here —
     * see TpoOfferService for offer-side close behaviour.
     *
     * PVN-B009: the "open requests are approved" promise (it is in the Close confirmation) was
     * never actually executed - autoApproveForClosedDrive had no caller. Requests are settled
     * BEFORE applicants are ended, because approving a withdrawal moves the application to
     * WITHDRAWN, which is only a valid move from an open status.
     */
    @Transactional
    public Job close(Integer jobId, Integer actorId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        // Closing ends every open applicant as "Not selected". A student the company selected whose offer is not released yet
        // is still at an open stage, so closing first told them "Not selected". Release or withdraw those selections first.
        Long unreleased = jdbc.queryForObject("SELECT COUNT(*) FROM job_offer o JOIN job_application a ON a.id = o.application_id " +
                "WHERE a.job_id = :j AND o.status IN ('SELECTED','PENDING_VERIFICATION')", new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("j", jobId), Long.class);
        if (unreleased != null && unreleased > 0) {
            throw new IllegalStateException(unreleased + (unreleased == 1 ? " selection is" : " selections are") + " not released yet. Release or withdraw "
                    + (unreleased == 1 ? "it" : "them") + " on the Offers tab before closing: closing would tell " + (unreleased == 1 ? "that student" : "those students") + " they were not selected.");
        }
        lifecycleService.transition(job, JobLifecycleStatus.CLOSED);
        job.setClosedAt(LocalDateTime.now());
        jobRepository.save(job);

        requestService.settleForEndedDrive(jobId, "Drive closed", false);

        for (JobApplication app : endOpenApplications(jobId, old -> "WAITLISTED".equals(old) ? "Waitlist ended" : "Not selected", "Drive closed", actorId)) {
            if (app.getLearner() != null) {
                outboxService.enqueue("DRIVE_CLOSED", "LEARNER", app.getLearner().getId(),
                        "APP", Map.of("applicationId", app.getId(), "message", app.getRejectionReason()), null, false);
            }
        }
        return job;
    }

    /** Extend the application deadline; notifies eligible students who haven't applied. */
    @Transactional
    public Job extendDeadline(Integer jobId, LocalDateTime newDeadline) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        if (!JobLifecycleStatus.PUBLISHED.equals(job.getLifecycleStatus())) {
            throw new IllegalStateException("Only a published drive can extend its application deadline");
        }
        // "Extend" only ever means later - this had no server-side check at all (the frontend's
        // own picker accepted any date too), so this call could silently shorten a deadline
        // instead, including to a moment already in the past.
        if (job.getApplicationDeadline() != null && !newDeadline.isAfter(job.getApplicationDeadline())) {
            throw new IllegalArgumentException("The new deadline must be after the current one");
        }
        job.setApplicationDeadline(newDeadline);
        return jobRepository.save(job);
    }

    /** The recruiter is emailed the decision on their request (template zepto.template.tpo.recruiter-request-decision); a missing template sends nothing. */
    private void tellRecruiter(Job job, String decision, String note) {
        if (job.getRecruiterId() == null) return;
        try {
            List<java.util.Map<String, Object>> recruiter = jdbc.queryForList("SELECT contact_mail AS email, first_name AS name FROM recruiter WHERE id = :h",
                    new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("h", job.getRecruiterId()));
            if (recruiter.isEmpty() || recruiter.get(0).get("email") == null) return;
            List<String> college = jdbc.queryForList("SELECT name FROM college WHERE id = :c", new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("c", job.getCollegeId()), String.class);
            java.util.Map<String, String> m = new java.util.LinkedHashMap<>();
            m.put("name", String.valueOf(recruiter.get(0).get("name") == null ? "" : recruiter.get(0).get("name"))); m.put("role", String.valueOf(job.getJobTitle()));
            m.put("decision", decision == null || decision.isEmpty() ? "" : Character.toUpperCase(decision.charAt(0)) + decision.substring(1)); m.put("note", note == null || note.isBlank() ? "No note added." : note); m.put("collegeName", college.isEmpty() ? "" : college.get(0));
            m.put("driveLink", mail.collegeLink(job.getCollegeId(), "/recruiter/drives/" + job.getId()));
            mail.sendAsCollege("recruiter-request-decision", String.valueOf(recruiter.get(0).get("email")), m, job.getCollegeId());
        } catch (Exception e) {
            // Telling the recruiter is a courtesy; never let it undo the decision.
        }
    }

    /**
     * What stops a drive from going live, the same list the publish window shows (publishPreflight.js). The server used to check only the
     * job type, so the window's other checks could be skipped by any other path; and the window did not show the job type at all.
     * A drive recorded after it happened outside needs no deadline. Deadlines are stored as UTC.
     */
    static List<String> publishBlockers(Job job, LocalDateTime nowUtc) {
        List<String> out = new java.util.ArrayList<>();
        if (job.getJobType() == null || job.getJobType().isBlank()) out.add("Choose the job type before publishing: it decides whether offers count as placed.");
        if (!hasPay(job.getRoleOptionsJson())) out.add("Set the pay (CTC or stipend) for at least one role before publishing.");
        boolean outside = Boolean.TRUE.equals(job.getRecordedOutside());
        if (!outside && job.getApplicationDeadline() == null) out.add("Set the application deadline before publishing.");
        if (!outside && job.getApplicationDeadline() != null && !job.getApplicationDeadline().isAfter(nowUtc)) out.add("The application deadline has passed. Move it later before publishing.");
        if (!outside && "OFF_CAMPUS".equals(job.getDriveMode()) && (job.getExternalApplyUrl() == null || job.getExternalApplyUrl().isBlank())) {
            out.add("Add the company's application link: students apply there for an off-campus drive.");
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private static boolean hasPay(Object roleOptions) {
        Object v = roleOptions;
        try {
            if (v instanceof String str) v = new com.fasterxml.jackson.databind.ObjectMapper().readValue(str, List.class);
        } catch (Exception e) { return false; }
        if (!(v instanceof List<?> list)) return false;
        for (Object o : list) {
            Map<String, Object> m = o instanceof Map ? (Map<String, Object>) o : new com.fasterxml.jackson.databind.ObjectMapper().convertValue(o, Map.class);
            if (m.get("ctcLpa") != null || m.get("stipendPerMonth") != null) return true;
        }
        return false;
    }
}
