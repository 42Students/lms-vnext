package com._42students.lms.service.recruiter;

import com._42students.lms.dto.tpo.DriveForm;
import com._42students.lms.model.Recruiter;
import com._42students.lms.model.Job;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoDriveService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * recruiter V1 §5, §10: "Plan a drive" across several colleges in one action. The schema for this
 * (drive_group, job.drive_group_id) already existed from the original TPO V1 build (V161) but was
 * never wired to a service — this is that wiring. One drive_group row, one Job per chosen college
 * (each still its own request that college's placement cell approves independently, exactly as the
 * single-college path already worked), tied together so recruiter's own screens can show and total them as
 * one drive.
 */
@Service
@RequiredArgsConstructor
public class RecruiterPlanDriveService {

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoDriveService driveService;
    private final RecruiterAccessService accessService;
    private final CompanyDirectoryService companyRepository;
    private final JobRepository jobRepository;
    private final ObjectMapper objectMapper;

    private String companyNameOf(Recruiter recruiter) {
        if (recruiter.getCompanyId() == null) {
            throw new IllegalArgumentException("Your account has no company yet. Please contact the placement cell");
        }
        return java.util.Optional.ofNullable(companyRepository.nameOf(recruiter.getCompanyId()))
                .orElseThrow(() -> new IllegalArgumentException("Your account has no company yet. Please contact the placement cell"));
    }

    /**
     * One request per chosen college, sent in one action, each with the same job/pay/eligibility/rounds. A
     * college whose grant does not (yet) have DRIVE_REQUEST is skipped, not failed outright, so the rest of
     * the group still goes out — recruiter sees which colleges were skipped and why in the response.
     */
    @Transactional
    public Map<String, Object> planDrive(UserPrincipal p, DriveForm form, List<Integer> collegeIds) {
        if (collegeIds == null || collegeIds.isEmpty()) throw new IllegalArgumentException("Choose at least one college");
        Recruiter recruiter = accessService.findUsableRecruiter(p.getId()).orElseThrow(() -> new IllegalArgumentException("Not found"));
        String companyName = companyNameOf(recruiter);
        String formJson;
        try {
            formJson = objectMapper.writeValueAsString(form);
        } catch (Exception e) {
            formJson = null; // the group row is a convenience snapshot, never load-bearing; a bad payload still creates real per-college requests
        }

        jdbc.update("INSERT INTO drive_group (recruiter_id, industry_company_id, shared_form_json, created_at) VALUES (:h, :c, :j, NOW())",
                new MapSqlParameterSource("h", recruiter.getId()).addValue("c", recruiter.getCompanyId()).addValue("j", formJson));
        Long groupId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", new MapSqlParameterSource(), Long.class);

        List<Map<String, Object>> results = new ArrayList<>();
        for (Integer collegeId : new java.util.LinkedHashSet<>(collegeIds)) {
            try {
                var grant = accessService.requireCollege(p, collegeId, RecruiterCapability.DRIVE_REQUEST);
                Job job = driveService.createRequest(form, grant.getOrganizationId(), collegeId, p.getId().longValue(), companyName);
                job.setDriveGroupId(groupId);
                jobRepository.save(job);
                results.add(row(collegeId, job.getId(), job.getLifecycleStatus(), null));
            } catch (Exception e) {
                results.add(row(collegeId, null, null, e.getMessage()));
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("driveGroupId", groupId);
        out.put("colleges", results);
        return out;
    }

    private static Map<String, Object> row(Integer collegeId, Integer jobId, String status, String skippedReason) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("collegeId", collegeId);
        m.put("jobId", jobId);
        m.put("status", status);
        m.put("skippedReason", skippedReason);
        return m;
    }

    /** Add one more college to a drive that is already live under this group (recruiter V1 §5 "Add colleges to a live drive later"). */
    @Transactional
    public Map<String, Object> addCollege(UserPrincipal p, Long groupId, Integer collegeId) {
        Recruiter recruiter = accessService.findUsableRecruiter(p.getId()).orElseThrow(() -> new IllegalArgumentException("Not found"));
        Map<String, Object> group = requireOwnGroup(recruiter.getId(), groupId);
        DriveForm form = shareFormOf(group);
        var grant = accessService.requireCollege(p, collegeId, RecruiterCapability.DRIVE_REQUEST);
        Job job = driveService.createRequest(form, grant.getOrganizationId(), collegeId, p.getId().longValue(), companyNameOf(recruiter));
        job.setDriveGroupId(groupId);
        jobRepository.save(job);
        return row(collegeId, job.getId(), job.getLifecycleStatus(), null);
    }

    /** Every drive group this recruiter has ever planned, most recent first, each with a status chip per college. */
    public List<Map<String, Object>> myDriveGroups(long recruiterId) {
        List<Map<String, Object>> groups = jdbc.queryForList(
                "SELECT dg.id AS groupId, dg.created_at AS createdAt, " +
                "  (SELECT j.job_title FROM job j WHERE j.drive_group_id = dg.id ORDER BY j.id LIMIT 1) AS roleTitle " +
                "FROM drive_group dg WHERE dg.recruiter_id = :h ORDER BY dg.id DESC",
                new MapSqlParameterSource("h", recruiterId));
        for (Map<String, Object> g : groups) {
            g.put("colleges", jdbc.queryForList(
                    "SELECT j.id AS jobId, j.college_id AS collegeId, c.name AS collegeName, j.lifecycle_status AS lifecycleStatus, " +
                    "  (SELECT COUNT(*) FROM job_application a WHERE a.job_id = j.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL)) AS applicants " +
                    "FROM job j LEFT JOIN college c ON c.id = j.college_id WHERE j.drive_group_id = :g ORDER BY c.name",
                    new MapSqlParameterSource("g", g.get("groupId"))));
        }
        return groups;
    }

    /**
     * The drive groups this recruiter has that reach {@code collegeId}, each showing only that college's copy.
     * A college session never learns that the drive also went to other colleges.
     */
    public List<Map<String, Object>> myDriveGroupsIn(long recruiterId, Integer collegeId) {
        List<Map<String, Object>> groups = jdbc.queryForList(
                "SELECT dg.id AS groupId, dg.created_at AS createdAt, " +
                "  (SELECT j.job_title FROM job j WHERE j.drive_group_id = dg.id AND j.college_id = :college ORDER BY j.id LIMIT 1) AS roleTitle " +
                "FROM drive_group dg WHERE dg.recruiter_id = :h " +
                "AND EXISTS (SELECT 1 FROM job j WHERE j.drive_group_id = dg.id AND j.college_id = :college) ORDER BY dg.id DESC",
                new MapSqlParameterSource("h", recruiterId).addValue("college", collegeId));
        for (Map<String, Object> g : groups) {
            g.put("colleges", jdbc.queryForList(
                    "SELECT j.id AS jobId, j.college_id AS collegeId, c.name AS collegeName, j.lifecycle_status AS lifecycleStatus, " +
                    "  (SELECT COUNT(*) FROM job_application a WHERE a.job_id = j.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL)) AS applicants " +
                    "FROM job j LEFT JOIN college c ON c.id = j.college_id WHERE j.drive_group_id = :g AND j.college_id = :college ORDER BY j.id",
                    new MapSqlParameterSource("g", g.get("groupId")).addValue("college", collegeId)));
        }
        return groups;
    }

    /** One drive group as seen from one college: 404 when this recruiter has no copy of it there. */
    public Map<String, Object> driveGroupDetailIn(long recruiterId, Long groupId, Integer collegeId) {
        Map<String, Object> group = requireOwnGroup(recruiterId, groupId);
        group.remove("sharedFormJson");
        List<Map<String, Object>> inCollege = jdbc.queryForList(
                "SELECT j.id AS jobId, j.college_id AS collegeId, c.name AS collegeName, j.lifecycle_status AS lifecycleStatus, j.ctc_range AS ctc, " +
                "  j.application_deadline AS applicationDeadline, j.sent_back_note AS sentBackNote, " +
                "  (SELECT COUNT(*) FROM job_application a WHERE a.job_id = j.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL)) AS applicants " +
                "FROM job j LEFT JOIN college c ON c.id = j.college_id WHERE j.drive_group_id = :g AND j.college_id = :college ORDER BY j.id",
                new MapSqlParameterSource("g", groupId).addValue("college", collegeId));
        if (inCollege.isEmpty()) throw new IllegalArgumentException("Not found");
        group.put("colleges", inCollege);
        return group;
    }

    /** One drive group in full: every college's copy, for the cross-college Drive page. */
    public Map<String, Object> driveGroupDetail(long recruiterId, Long groupId) {
        Map<String, Object> group = requireOwnGroup(recruiterId, groupId);
        group.remove("sharedFormJson"); // internal detail — reused by addCollege(), never shown as-is
        group.put("colleges", jdbc.queryForList(
                "SELECT j.id AS jobId, j.college_id AS collegeId, c.name AS collegeName, j.lifecycle_status AS lifecycleStatus, j.ctc_range AS ctc, " +
                "  j.application_deadline AS applicationDeadline, j.sent_back_note AS sentBackNote, " +
                "  (SELECT COUNT(*) FROM job_application a WHERE a.job_id = j.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL)) AS applicants " +
                "FROM job j LEFT JOIN college c ON c.id = j.college_id WHERE j.drive_group_id = :g ORDER BY c.name",
                new MapSqlParameterSource("g", groupId)));
        return group;
    }

    private Map<String, Object> requireOwnGroup(long recruiterId, Long groupId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id AS groupId, created_at AS createdAt, recruiter_id AS recruiterId, shared_form_json AS sharedFormJson FROM drive_group WHERE id = :g",
                new MapSqlParameterSource("g", groupId));
        if (rows.isEmpty() || !Long.valueOf(recruiterId).equals(((Number) rows.get(0).get("recruiterId")).longValue())) {
            throw new IllegalArgumentException("Not found");
        }
        return rows.get(0);
    }

    private DriveForm shareFormOf(Map<String, Object> group) {
        Object json = group.get("sharedFormJson");
        if (json == null) throw new IllegalStateException("This drive has no saved form to reuse; plan a new one for this college");
        try {
            return objectMapper.readValue(String.valueOf(json), DriveForm.class);
        } catch (Exception e) {
            throw new IllegalStateException("This drive's saved form could not be read; plan a new one for this college");
        }
    }
}
