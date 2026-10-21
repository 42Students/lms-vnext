package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.model.Recruiter;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.model.tpo.RecruiterLead;
import com._42students.lms.repository.CompanyDomainRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.RecruiterCollegeAccessRepository;
import com._42students.lms.repository.tpo.RecruiterLeadRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.service.company.CompanyDirectoryService;
import com._42students.lms.service.company.CompanyDomainService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The placement cell posts the drive and asks the company's recruiter to review it (recruiter phase 1, N5 c). The recruiter is
 * attached to the drive: they see it in their workspace and answer with change requests, never by editing it. Someone who already
 * works with this college is attached at once; anyone else gets the usual invitation, and the drive is attached when they join.
 *
 * The college's public link can go with it, for the recruiter to pass to colleagues. While the invitation email isn't set up (or
 * fails), the answer carries the email written out, so the placement cell sends it from its own mailbox (audit 13 Oct 2026).
 */
@Service
@RequiredArgsConstructor
public class DriveReviewInviteService {

    private final JobRepository jobRepository;
    private final RecruiterRepository recruiterRepository;
    private final RecruiterCollegeAccessRepository accessRepository;
    private final RecruiterLeadRepository recruiterLeadRepository;
    private final TpoRecruiterLeadService recruiterLeadService;
    private final CompanyDomainService domainService;
    private final CompanyDomainRepository domainRepository;
    private final CompanyDirectoryService directory;
    private final TpoAuditService audit;
    private final NamedParameterJdbcTemplate jdbc;

    /** Optional, and lazy: the public link service sits on the join side of the graph. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private CollegePublicLinkService publicLinks;

    void setPublicLinks(CollegePublicLinkService publicLinks) {
        this.publicLinks = publicLinks;
    }

    @Transactional
    public Map<String, Object> invite(Integer collegeId, Integer jobId, String name, String email, String note, Integer facultyId, String linkBase) {
        return invite(collegeId, jobId, name, email, note, facultyId, linkBase, false);
    }

    @Transactional
    public Map<String, Object> invite(Integer collegeId, Integer jobId, String name, String email, String note, Integer facultyId, String linkBase,
                                      boolean includePublicLink) {
        Job job = jobRepository.findById(jobId).filter(j -> collegeId != null && collegeId.equals(j.getCollegeId()))
                .orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        if (List.of("CLOSED", "CANCELLED", "REJECTED").contains(job.getLifecycleStatus())) {
            throw new IllegalStateException("This drive is over. Invite a recruiter to a drive that is still open.");
        }
        if (job.getCompanyId() == null) throw new IllegalArgumentException("Pick the company on this drive first");
        if (job.getRecruiterId() != null) throw new IllegalStateException("A recruiter is already on this drive");
        if (email == null || email.isBlank()) throw new IllegalArgumentException("Enter the recruiter's work email");
        String e = email.trim().toLowerCase();
        CompanyDomainService.Check check = domainService.checkEmail(e);
        if (!check.ok()) throw new IllegalArgumentException(check.message());
        boolean ours = domainRepository.findByDomain(check.domain()).map(d -> d.getCompanyId().equals(job.getCompanyId())).orElse(false);
        // A company from before domains existed has none: the placement cell's own invite teaches it its first domain.
        if (!ours && directory.domainsOf(job.getCompanyId()).isEmpty() && domainRepository.findByDomain(check.domain()).isEmpty()) {
            directory.ensureListed(collegeId, job.getCompanyId());
            directory.addDomain(job.getCompanyId(), check.domain(), new CompanyDirectoryService.Actor("FACULTY", facultyId, collegeId));
            ours = true;
        }
        if (!ours) {
            String company = directory.nameOf(job.getCompanyId());
            throw new IllegalArgumentException("Use an email address at " + (company == null ? "the drive's company" : company) + ".");
        }

        Map<String, Object> out = new LinkedHashMap<>();
        String base = linkBase == null ? null : linkBase.replaceAll("/+$", "");
        String publicToken = includePublicLink && publicLinks != null ? publicLinks.tokenForInvites(collegeId) : null;
        String publicLink = publicToken == null || base == null ? null : base + "/college-join/" + publicToken;
        if (includePublicLink) out.put("publicLinkIncluded", publicLink != null);
        if (publicLink != null) out.put("publicLink", publicLink);
        String college = jdbc.queryForList("SELECT name FROM college WHERE id = :c", new MapSqlParameterSource("c", collegeId), String.class)
                .stream().findFirst().orElse("our college");
        String role = job.getJobTitle() == null ? "the drive" : job.getJobTitle();
        Recruiter recruiter = recruiterRepository.findByContactMail(e).filter(r -> !Boolean.TRUE.equals(r.getIsDeleted()) && r.getSuspendedAt() == null).orElse(null);
        boolean active = recruiter != null && accessRepository.findForRecruiterAndCollege(recruiter.getId(), collegeId)
                .map(g -> RecruiterCollegeAccess.STATUS_ACTIVE.equals(g.getStatus()) && !Boolean.TRUE.equals(g.getIsDeleted())).orElse(false);
        if (active) {
            job.setRecruiterId((long) recruiter.getId());
            jobRepository.save(job);
            audit.log(collegeId, "TPO", facultyId, "RECRUITER_REVIEW_INVITED", "DRIVE", (long) job.getId(), recruiter.getContactMail());
            out.put("status", "ATTACHED");
            out.put("recruiterName", recruiter.getFirstName());
            // No email goes out for someone already working with the college: the screen offers this note to send.
            out.put("email", letter(e, recruiter.getFirstName(), college, role, "It is in your 42LMS workspace now: " + (base == null ? "" : base + "/recruiter"),
                    note, publicLink));
            return out;
        }

        RecruiterLead lead = recruiterLeadService.findExisting(collegeId, e);
        if (lead == null) {
            String label = name == null || name.isBlank() ? e.substring(0, e.indexOf('@')) : name.trim();
            lead = recruiterLeadService.addRecruiterLead(collegeId, label, e, directory.nameOf(job.getCompanyId()), facultyId, null);
        }
        lead.setReviewJobId(jobId);
        recruiterLeadRepository.save(lead);
        recruiterLeadService.logActivity(lead.getId(), "SYSTEM", null, "Invited to review the drive " + (job.getJobTitle() == null ? "" : job.getJobTitle()), facultyId);
        Map<String, Object> sent = recruiterLeadService.invite(lead.getId(), true, note, base, publicLink);
        out.put("status", "INVITED");
        out.put("recruiterLeadId", lead.getId());
        out.put("emailed", sent.get("emailed"));
        out.put("token", sent.get("token"));
        if (base != null && sent.get("token") != null) {
            String inviteLink = base + "/recruiter-invite/" + sent.get("token");
            out.put("inviteLink", inviteLink);
            if (!Boolean.TRUE.equals(sent.get("emailed"))) {
                out.put("email", letter(e, lead.getName(), college, role,
                        "Open your invitation to join and review it (the link is for you, and works for " + RecruiterInviteService.TTL_DAYS + " days):\n" + inviteLink,
                        note, publicLink));
            }
        }
        return out;
    }

    /** The invitation written out, for the placement cell to send from its own mailbox. */
    static Map<String, String> letter(String to, String name, String college, String role, String how, String note, String publicLink) {
        StringBuilder b = new StringBuilder();
        b.append("Hello").append(name == null || name.isBlank() ? "" : " " + name.trim()).append(",\n\n");
        b.append("We have posted ").append(role).append(" at ").append(college).append(" and would like you to review it. ");
        b.append("You can ask for changes right on the drive.\n\n").append(how).append("\n");
        if (note != null && !note.isBlank()) b.append("\n").append(note.trim()).append("\n");
        if (publicLink != null) b.append("\nColleagues who should join too can use this link (they confirm their work email):\n").append(publicLink).append("\n");
        b.append("\nThank you,\nPlacement cell, ").append(college);
        Map<String, String> m = new LinkedHashMap<>();
        m.put("to", to);
        m.put("subject", "Please review " + role + " at " + college);
        m.put("body", b.toString());
        return m;
    }

    /** When an invited recruiter joins (or accepts), the drive they were asked to review becomes theirs. */
    public void attachReviewDrive(RecruiterLead lead, long recruiterId) {
        if (lead == null || lead.getReviewJobId() == null) return;
        int n = jdbc.update("UPDATE job SET recruiter_id = :h WHERE id = :j AND college_id = :c AND recruiter_id IS NULL",
                new MapSqlParameterSource("h", recruiterId).addValue("j", lead.getReviewJobId()).addValue("c", lead.getCollegeId()));
        if (n == 1) {
            audit.log(lead.getCollegeId(), "SYSTEM", null, "RECRUITER_REVIEW_INVITED", "DRIVE", (long) lead.getReviewJobId(), null);
            audit.bell(lead.getCollegeId(), "RECRUITER_REVIEWING", (lead.getName() == null ? "The recruiter" : lead.getName()) + " can now review your drive",
                    "They answer with change requests on the drive.", "/tpo/drives/" + lead.getReviewJobId());
        }
    }
}
