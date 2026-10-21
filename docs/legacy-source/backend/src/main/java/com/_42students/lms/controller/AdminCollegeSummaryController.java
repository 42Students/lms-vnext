package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * College-admin dashboard audit: the dashboard was entirely a first-run setup guide — quick-action
 * links and a numbered "do this, then this" checklist — with no live numbers anywhere on it. An
 * admin who has already finished setup and logs in six months later gets nothing answering "how
 * many students do we have" or "how many drives are open right now" without leaving the page.
 *
 * <p>Every number here is a COUNT query, never a list fetch — the same discipline the Workspaces
 * list export applied for the same reason: an unbounded fetch just to produce one number does not
 * scale once a college has thousands of rows, precisely the anti-pattern the paginated list
 * endpoints elsewhere in this codebase already exist to avoid.
 */
@RestController
@RequestMapping("/api/v1/admin/college-summary")
@Slf4j
@Api(tags = "Admin College Summary")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminCollegeSummaryController extends BaseController {

    @Autowired
    private com._42students.lms.repository.LearnerRepository learnerRepository;

    @Autowired
    private com._42students.lms.repository.FacultyRepository facultyRepository;

    @Autowired
    private com._42students.lms.repository.CourseRepository courseRepository;

    @Autowired
    private com._42students.lms.repository.JobRepository jobRepository;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @GetMapping
    @ApiOperation(value = "At-a-glance counts for the college-admin dashboard",
            notes = "Students, faculty, courses and active drives — count queries only, never a list fetch.")
    public ResponseEntity<Response<Map<String, Object>>> summary(@RequestParam Integer collegeId) {
        if (collegeId == null || collegeId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "collegeId must be a positive integer", null),
                    HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.UNAUTHORIZED.name(),
                    "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        accessControlService.requireAccessCollege(principal, collegeId);

        Map<String, Object> out = new LinkedHashMap<>();
        try {
            out.put("studentCount", learnerRepository
                    .findLearnersByCollegeIdIncludingViaClass(collegeId, PageRequest.of(0, 1))
                    .getTotalElements());
        } catch (Exception e) {
            log.warn("College summary: student count failed for college {}: {}", collegeId, e.getMessage());
            out.put("studentCount", null);
        }
        try {
            out.put("facultyCount", facultyRepository.countByCollegeId(collegeId));
        } catch (Exception e) {
            log.warn("College summary: faculty count failed for college {}: {}", collegeId, e.getMessage());
            out.put("facultyCount", null);
        }
        try {
            out.put("courseCount", courseRepository
                    .fetchByCollegeIdPaged(collegeId, PageRequest.of(0, 1))
                    .getTotalElements());
        } catch (Exception e) {
            log.warn("College summary: course count failed for college {}: {}", collegeId, e.getMessage());
            out.put("courseCount", null);
        }
        try {
            out.put("activeDriveCount", jobRepository.countActiveByCollegeId(collegeId));
        } catch (Exception e) {
            log.warn("College summary: drive count failed for college {}: {}", collegeId, e.getMessage());
            out.put("activeDriveCount", null);
        }

        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), out), HttpStatus.OK);
    }
}
