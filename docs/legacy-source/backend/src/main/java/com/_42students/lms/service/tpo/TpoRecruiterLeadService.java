package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.FollowUp;
import com._42students.lms.model.tpo.RecruiterLead;
import com._42students.lms.model.tpo.RecruiterLeadActivity;
import com._42students.lms.repository.tpo.FollowUpRepository;
import com._42students.lms.repository.tpo.RecruiterLeadActivityRepository;
import com._42students.lms.repository.tpo.RecruiterLeadRepository;
import com._42students.lms.repository.JobRepository;
import com._42students.lms.repository.tpo.PlacementSeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Slim RecruiterLeads V1: a table plus a read-only board. Manual stages are NEW/CONTACTED/NOT_NOW; the
 * derived stages (Invited, Joined, Drive planned, Recruited) are computed at read time from
 * facts (invite sent, a recruiter grant exists, a drive exists, an offer was accepted) so they can
 * never drift out of sync with reality. See TPO V1 - Locked.docx §3.
 */
@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class TpoRecruiterLeadService {

    private final RecruiterLeadRepository recruiterLeadRepository;
    private final org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;
    private final TpoMailService mail;
    private final org.springframework.core.env.Environment environment;
    private final RecruiterLeadActivityRepository recruiterLeadActivityRepository;
    private final FollowUpRepository followUpRepository;
    private final JobRepository jobRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Where a recruiter lead came from (recruiter_lead.source). The first seven are "where did you find them", picked by the TPO on Add recruiter lead, Edit
     * or in the import sheet; when none is picked the recruiter lead says how it got here: Added by hand, or Imported.
     */
    public static final Map<String, String> SOURCES = new java.util.LinkedHashMap<>();
    public static final String ADDED_BY_HAND = "MANUAL";
    public static final String IMPORTED = "IMPORT";
    static {
        SOURCES.put("ALUMNI", "Alumni");
        SOURCES.put("REFERRAL", "Referral");
        SOURCES.put("LINKEDIN", "LinkedIn");
        SOURCES.put("JOB_PORTAL", "Job portal");
        SOURCES.put("EVENT", "Event or job fair");
        SOURCES.put("COLD_OUTREACH", "Cold outreach");
        SOURCES.put("COMPANY_REACHED_OUT", "Company reached out");
        SOURCES.put(ADDED_BY_HAND, "Added by hand");
        SOURCES.put(IMPORTED, "Imported");
    }
    /** The ones a person picks (the last two are set by the system). */
    public static final List<String> PICKABLE_SOURCES = List.of("ALUMNI", "REFERRAL", "LINKEDIN", "JOB_PORTAL", "EVENT", "COLD_OUTREACH", "COMPANY_REACHED_OUT");

    /**
     * A source as sent by a form or typed in a sheet: its code or its label, any case ("linkedin", "Job portal"). Blank is null.
     * Anything else is refused, naming the choices.
     */
    public static String pickedSource(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String t = raw.trim();
        for (String code : PICKABLE_SOURCES) {
            if (code.equalsIgnoreCase(t.replace(' ', '_')) || SOURCES.get(code).equalsIgnoreCase(t)) return code;
        }
        throw new IllegalArgumentException("Source \"" + t + "\" is not one of: " + String.join(", ", PICKABLE_SOURCES.stream().map(SOURCES::get).toList()));
    }

    public static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    public static String normalizePhone(String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("\\D", "");
        return digits.length() > 10 ? digits.substring(digits.length() - 10) : digits;
    }

    @Transactional
    public RecruiterLead addRecruiterLead(Integer collegeId, String name, String emailOrPhone, String companyName, Integer ownerFacultyId) {
        return addRecruiterLead(collegeId, name, emailOrPhone, companyName, ownerFacultyId, null);
    }

    /** source: where the TPO found them (a picked source), else Added by hand. */
    @Transactional
    public RecruiterLead addRecruiterLead(Integer collegeId, String name, String emailOrPhone, String companyName, Integer ownerFacultyId, String source) {
        // The form's rules, checked here too: a name and one way to reach them. A blank contact crashed, an email domain
        // without a dot ("name@localhost") crashed while guessing the company, and any text was taken as an email.
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Enter the recruiter's name");
        if (emailOrPhone == null || emailOrPhone.isBlank()) throw new IllegalArgumentException("Enter an email or a phone number");
        if (emailOrPhone.contains("@") && !normalizeEmail(emailOrPhone).matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) throw new IllegalArgumentException("Enter a valid email");
        if (!emailOrPhone.contains("@") && (normalizePhone(emailOrPhone) == null || normalizePhone(emailOrPhone).length() < 8)) throw new IllegalArgumentException("Enter a valid phone number");
        // BE-0103: two people adding the same contact at once (or an add racing an import) take turns, and the second is told.
        if (contactTaken(collegeId, emailOrPhone)) {
            throw new IllegalStateException("This recruiter is already in your list. Search for them to open it.");
        }
        RecruiterLead recruiterLead = new RecruiterLead();
        String picked = pickedSource(source);
        recruiterLead.setSource(picked != null ? picked : ADDED_BY_HAND);
        recruiterLead.setCollegeId(collegeId);
        recruiterLead.setName(name.trim());
        recruiterLead.setCompanyName(companyName == null || companyName.isBlank() ? null : companyName.trim());
        recruiterLead.setOwnerFacultyId(ownerFacultyId);
        if (emailOrPhone != null && emailOrPhone.contains("@")) {
            recruiterLead.setEmailNorm(normalizeEmail(emailOrPhone));
            String domain = recruiterLead.getEmailNorm().substring(recruiterLead.getEmailNorm().indexOf('@') + 1);
            if (!isFreeMailDomain(domain) && (companyName == null || companyName.isBlank()) && domain.indexOf('.') > 0) {
                recruiterLead.setCompanyName(domain.substring(0, domain.indexOf('.')).toUpperCase(Locale.ROOT));
            }
        } else {
            recruiterLead.setPhoneNorm(normalizePhone(emailOrPhone));
        }
        recruiterLead.setManualStage("NEW");
        recruiterLead.setCreatedAt(LocalDateTime.now());
        recruiterLead.setUpdatedAt(LocalDateTime.now());
        return recruiterLeadRepository.save(recruiterLead);
    }

    /** The rest of what the Add recruiter lead form can carry: the second contact (email or phone) and the designation. Blank values change nothing. */
    @org.springframework.transaction.annotation.Transactional
    public RecruiterLead addDetails(RecruiterLead recruiterLead, String otherContact, String designation) {
        boolean changed = false;
        if (otherContact != null && !otherContact.isBlank()) {
            if (otherContact.contains("@") && recruiterLead.getEmailNorm() == null) { recruiterLead.setEmailNorm(normalizeEmail(otherContact)); changed = true; }
            else if (!otherContact.contains("@") && recruiterLead.getPhoneNorm() == null) { recruiterLead.setPhoneNorm(normalizePhone(otherContact)); changed = true; }
        }
        if (designation != null && !designation.isBlank()) { recruiterLead.setDesignation(designation.trim()); changed = true; }
        return changed ? recruiterLeadRepository.save(recruiterLead) : recruiterLead;
    }

    /**
     * Fix a recruiter lead's contact details (a mistyped phone or email had no way back). Blank email or phone clears it, but one of the two
     * must stay; neither may belong to another recruiter lead of the same college. Name and company cannot be blanked.
     */
    @Transactional
    public RecruiterLead updateDetails(Long recruiterLeadId, String name, String designation, String email, String phone, String companyName) {
        return updateDetails(recruiterLeadId, name, designation, email, phone, companyName, null, false);
    }

    /**
     * withSource: the form sent a source. A picked source replaces what is there; cleared, the recruiter lead goes back to how it got here
     * (Imported for an imported recruiter lead, else Added by hand).
     */
    @Transactional
    public RecruiterLead updateDetails(Long recruiterLeadId, String name, String designation, String email, String phone, String companyName, String source, boolean withSource) {
        RecruiterLead recruiterLead = recruiterLeadRepository.findById(recruiterLeadId).orElseThrow(() -> new IllegalArgumentException("Recruiter not found"));
        if (withSource) {
            String picked = pickedSource(source);
            recruiterLead.setSource(picked != null ? picked : IMPORTED.equals(recruiterLead.getSource()) ? IMPORTED : ADDED_BY_HAND);
        }
        String e = email == null || email.isBlank() ? null : normalizeEmail(email);
        String ph = phone == null || phone.isBlank() ? null : normalizePhone(phone);
        if (e != null && !e.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) throw new IllegalArgumentException("Enter a valid email");
        if (ph != null && ph.length() < 8) throw new IllegalArgumentException("Enter a valid phone number");
        if (e == null && ph == null) throw new IllegalArgumentException("Keep an email or a phone");
        if (e != null) recruiterLeadRepository.findFirstByCollegeIdAndEmailNorm(recruiterLead.getCollegeId(), e)
                .filter(o -> !o.getId().equals(recruiterLead.getId())).ifPresent(o -> { throw new IllegalArgumentException("Another recruiter (" + o.getName() + ") already has this email"); });
        if (ph != null) recruiterLeadRepository.findFirstByCollegeIdAndPhoneNorm(recruiterLead.getCollegeId(), ph)
                .filter(o -> !o.getId().equals(recruiterLead.getId())).ifPresent(o -> { throw new IllegalArgumentException("Another recruiter (" + o.getName() + ") already has this phone"); });
        if (name != null && !name.isBlank()) recruiterLead.setName(name.trim());
        if (companyName != null && !companyName.isBlank()) recruiterLead.setCompanyName(companyName.trim());
        recruiterLead.setDesignation(designation == null || designation.isBlank() ? null : designation.trim());
        recruiterLead.setEmailNorm(e);
        recruiterLead.setPhoneNorm(ph);
        recruiterLead.setUpdatedAt(LocalDateTime.now());
        return recruiterLeadRepository.save(recruiterLead);
    }

    private boolean isFreeMailDomain(String domain) {
        return com._42students.lms.service.company.CompanyDomainService.isPersonalOrDisposableDomain(domain);
    }

    /**
     * BE-0103: locks this college's recruiter list (its college row) and checks the contact against the latest committed
     * rows (a FOR UPDATE read, not an older snapshot). Adds of one college take turns, so a contact can't be added twice.
     */
    @Transactional
    public boolean contactTaken(Integer collegeId, String emailOrPhone) {
        jdbc.queryForList("SELECT id FROM college WHERE id = :c FOR UPDATE", new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("c", collegeId));
        if (emailOrPhone == null || emailOrPhone.isBlank()) return false;
        boolean email = emailOrPhone.contains("@");
        String norm = email ? normalizeEmail(emailOrPhone) : normalizePhone(emailOrPhone);
        if (norm == null) return false;
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM recruiter_lead WHERE college_id = :c AND " + (email ? "email_norm" : "phone_norm") + " = :v FOR UPDATE",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("c", collegeId).addValue("v", norm), Long.class);
        return n != null && n > 0;
    }

    /** Duplicate check while typing: "exists -> Open". */
    public RecruiterLead findExisting(Integer collegeId, String emailOrPhone) {
        if (emailOrPhone == null) return null;
        if (emailOrPhone.contains("@")) {
            return recruiterLeadRepository.findFirstByCollegeIdAndEmailNorm(collegeId, normalizeEmail(emailOrPhone)).orElse(null);
        }
        return recruiterLeadRepository.findFirstByCollegeIdAndPhoneNorm(collegeId, normalizePhone(emailOrPhone)).orElse(null);
    }

    @Transactional
    public RecruiterLeadActivity logActivity(Long recruiterLeadId, String type, String outcome, String note, Integer byFacultyId) {
        RecruiterLeadActivity activity = new RecruiterLeadActivity();
        activity.setRecruiterLeadId(recruiterLeadId);
        activity.setType(type);
        activity.setOutcome(outcome);
        activity.setNote(note);
        activity.setCreatedBy(byFacultyId);
        activity.setCreatedAt(LocalDateTime.now());
        recruiterLeadActivityRepository.save(activity);

        // Any logged contact moves a NEW recruiter lead to CONTACTED automatically.
        RecruiterLead recruiterLead = recruiterLeadRepository.findById(recruiterLeadId).orElse(null);
        if (recruiterLead != null && "NEW".equals(recruiterLead.getManualStage()) && !"SYSTEM".equals(type)) {
            recruiterLead.setManualStage("CONTACTED");
            recruiterLeadRepository.save(recruiterLead);
        }
        return activity;
    }

    @Transactional
    public FollowUp addFollowUp(Long recruiterLeadId, LocalDateTime dueAt, Integer ownerFacultyId, String note) {
        FollowUp fu = new FollowUp();
        fu.setRecruiterLeadId(recruiterLeadId);
        fu.setDueAt(dueAt);
        fu.setOwnerFacultyId(ownerFacultyId);
        fu.setNote(note);
        fu.setCreatedAt(LocalDateTime.now());
        return followUpRepository.save(fu);
    }

    @Transactional
    public FollowUp moveFollowUp(Long followUpId, LocalDateTime dueAt) {
        if (!lockFollowUpIsOpen(followUpId)) throw new IllegalStateException("A finished follow-up cannot be moved");
        FollowUp fu = followUpRepository.findById(followUpId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        if (fu.getDoneAt() != null) throw new IllegalStateException("A finished follow-up cannot be moved");
        fu.setDueAt(dueAt);
        return followUpRepository.save(fu);
    }

    @Transactional
    public void markFollowUpDone(Long followUpId) {
        if (!lockFollowUpIsOpen(followUpId)) return; // already done: Done again changes nothing
        FollowUp fu = followUpRepository.findById(followUpId).orElseThrow();
        fu.setDoneAt(LocalDateTime.now());
        followUpRepository.save(fu);
    }

    /**
     * BE-0051: Move and Done on one follow-up take turns on its row, and "still open" is read under that lock (not from an
     * older snapshot), so a stale Move can't save over a Done and reopen it.
     */
    private boolean lockFollowUpIsOpen(Long followUpId) {
        List<Map<String, Object>> row = jdbc.queryForList("SELECT done_at FROM follow_up WHERE id = :id FOR UPDATE",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("id", followUpId));
        if (row.isEmpty()) throw new IllegalArgumentException("Not found");
        return row.get(0).get("done_at") == null;
    }

    public List<FollowUp> dueFollowUps(LocalDateTime cutoff, Integer collegeId) {
        return followUpRepository.findDueForCollege(cutoff, collegeId);
    }

    /** Not now: reason + revisit date, moves off the active board. */
    @Transactional
    public void markNotNow(Long recruiterLeadId, String reason, LocalDate revisitDate) {
        RecruiterLead recruiterLead = recruiterLeadRepository.findById(recruiterLeadId).orElseThrow();
        recruiterLead.setManualStage("NOT_NOW");
        recruiterLead.setNotNowReason(reason);
        recruiterLead.setNotNowUntil(revisitDate);
        recruiterLeadRepository.save(recruiterLead);
    }

    /**
     * Issues an invite link for the TPO to send themselves (for example from their own email). The raw token
     * is returned once to the caller and never stored: only its SHA-256 is, so a database read cannot
     * recover a live link. Issuing again rotates the token, which kills the previous link. The
     * 7-day clock starts from inviteSentAt. Nothing is queued or logged with the token in it.
     * recruiter side: {@link RecruiterInviteService}.
     */
    /**
     * Same as {@link #invite(Long)}, and optionally emails the link to the recruiter lead's address with the TPO's note (template zepto.template.tpo.recruiter-invite).
     * {@code linkBase} is the site the TPO is using. The result says whether an email went out, so the page can say so.
     */
    @Transactional
    public Map<String, Object> invite(Long recruiterLeadId, boolean sendEmail, String note, String linkBase) {
        return invite(recruiterLeadId, sendEmail, note, linkBase, null);
    }

    /** publicLink: the college's public link, added to the email so the recruiter can pass it to colleagues (null: not added). */
    @Transactional
    public Map<String, Object> invite(Long recruiterLeadId, boolean sendEmail, String note, String linkBase, String publicLink) {
        Map<String, Object> out = invite(recruiterLeadId);
        boolean emailed = false;
        RecruiterLead recruiterLead = recruiterLeadRepository.findById(recruiterLeadId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        out.put("emailAvailable", mail.isConfigured("recruiter-invite") && recruiterLead.getEmailNorm() != null);
        if (sendEmail && linkBase != null && recruiterLead.getEmailNorm() != null) {
            Map<String, String> merge = inviteMerge(recruiterLead, linkBase + "/recruiter-invite/" + out.get("token"), note);
            merge.put("publicLink", publicLink == null ? "" : publicLink);
            merge.put("publicLinkLine", publicLink == null ? "" : "Hiring with colleagues? They can join with this link: " + publicLink);
            emailed = mail.sendAsCollege("recruiter-invite", recruiterLead.getEmailNorm(), merge, recruiterLead.getCollegeId()) == TpoMailService.Result.SENT;
            if (emailed) logActivity(recruiterLeadId, "SYSTEM", null, "Invite emailed to " + recruiterLead.getEmailNorm(), null);
        }
        out.put("emailed", emailed);
        return out;
    }

    private Map<String, String> inviteMerge(RecruiterLead recruiterLead, String link, String note) {
        List<Map<String, Object>> c = jdbc.queryForList("SELECT c.name AS college, s.email_signature AS signature FROM college c LEFT JOIN tpo_college_settings s ON s.college_id = c.id WHERE c.id = :c",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("c", recruiterLead.getCollegeId()));
        Map<String, String> m = new LinkedHashMap<>();
        m.put("name", recruiterLead.getName() == null ? "" : recruiterLead.getName());
        m.put("company", recruiterLead.getCompanyName() == null ? "" : recruiterLead.getCompanyName());
        m.put("collegeName", c.isEmpty() || c.get(0).get("college") == null ? "" : String.valueOf(c.get(0).get("college")));
        m.put("signature", c.isEmpty() || c.get(0).get("signature") == null ? "" : String.valueOf(c.get(0).get("signature")));
        m.put("link", link);
        m.put("note", note == null ? "" : note);
        m.put("expiresDays", String.valueOf(RecruiterInviteService.TTL_DAYS));
        return m;
    }

    /**
     * One reminder on day 4 (TPO V1 - Locked.docx §3): to recruiter leads with an email whose invite is still unopened, not joined, not Not now, not
     * unsubscribed. The old link cannot be recovered (only its hash is stored), so the reminder carries a fresh link and the old one stops working.
     * Stopped by a click, any logged activity, Not now or unsubscribe. Needs the reminder template; without it nothing is sent and nothing changes.
     */
    // Timed by TpoScheduledJobs (one replica only).
    @Transactional
    public void sendInviteReminders() {
        if (!mail.isConfigured("recruiter-invite-reminder")) return;
        List<RecruiterLead> due = recruiterLeadRepository.findReminderDue(LocalDateTime.now().minusDays(4), LocalDateTime.now().minusDays(RecruiterInviteService.TTL_DAYS - 1));
        for (RecruiterLead recruiterLead : due) {
            try {
                boolean activitySince = !jdbc.queryForList("SELECT 1 FROM recruiter_lead_activity WHERE recruiter_lead_id = :l AND is_system = 0 AND created_at > :t LIMIT 1",
                        new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("l", recruiterLead.getId()).addValue("t", recruiterLead.getInviteSentAt())).isEmpty();
                if (activitySince) continue;
                // The college's own address (recruiters sign in only there), else the public base URL. Without either this
                // reminder is skipped, never the whole run (it used to stop every reminder when APP_PUBLIC_BASE_URL was unset).
                String inviteBase = mail.collegeLink(recruiterLead.getCollegeId(), "/recruiter-invite/");
                if (inviteBase == null || inviteBase.isEmpty()) {
                    String base = frontendBase();
                    if (base == null) continue;
                    inviteBase = base + "/recruiter-invite/";
                }
                byte[] raw = new byte[32];
                RANDOM.nextBytes(raw);
                String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
                // BE-0104/BE-0206: rotate only if the link is still the one this run read and it is still unopened; a TPO's new
                // link or the recruiter opening it in the meantime wins, and no reminder goes out.
                if (rotateInvite(recruiterLead.getId(), recruiterLead.getInviteTokenHash(), sha256Hex(token), null, true) != 1) continue;
                Map<String, String> merge = inviteMerge(recruiterLead, inviteBase + token, null);
                long left = daysLeft(recruiterLead.getInviteSentAt()); // the invite runs from its first send
                merge.put("expiresDays", left + (left == 1 ? " day" : " days"));
                mail.sendAsCollege("recruiter-invite-reminder", recruiterLead.getEmailNorm(), merge, recruiterLead.getCollegeId());
                logActivity(recruiterLead.getId(), "SYSTEM", null, "Reminder emailed", null);
            } catch (Exception e) {
                log.warn("invite reminder failed for recruiterLead {}", recruiterLead.getId(), e);
            }
        }
    }

    private String frontendBase() {
        String v = environment.getProperty("app.public.base.url");
        return v == null || v.isBlank() ? null : v.trim().replaceAll("/+$", "");
    }

    @Transactional
    public Map<String, Object> invite(Long recruiterLeadId) {
        RecruiterLead recruiterLead = recruiterLeadRepository.findById(recruiterLeadId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        if (recruiterLead.getRecruiterId() != null) throw new IllegalStateException("This recruiter has already joined");
        if (recruiterLead.getUnsubscribedAt() != null) throw new IllegalStateException("This contact asked not to be contacted");
        byte[] raw = new byte[32];
        RANDOM.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        LocalDateTime now = LocalDateTime.now();
        // BE-0104: each new link replaces the last one, so two people making a link at once must not both be told "ready".
        // The swap only lands if the link is still the one read above; the other request is refused instead of handing out a
        // link that was already replaced.
        if (rotateInvite(recruiterLeadId, recruiterLead.getInviteTokenHash(), sha256Hex(token), now, false) != 1) {
            throw new IllegalStateException("Someone else just made a new invite link for this contact. Refresh, then copy or make a link again.");
        }
        // Keep the loaded entity in step with the row (the rest of this transaction may read it).
        recruiterLead.setInviteTokenHash(sha256Hex(token));
        recruiterLead.setInviteSentAt(now);
        recruiterLead.setInviteClickedAt(null);
        logActivity(recruiterLeadId, "SYSTEM", null, "Invite link created", null);
        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("token", token);
        out.put("expiresAt", now.plusDays(RecruiterInviteService.TTL_DAYS));
        return out;
    }

    /**
     * Swaps the invite hash only if it is still {@code oldHash} (compare-and-set). A new invite ({@code sentAt} set) also restarts
     * the clock and the opened mark; a reminder keeps them and only lands while the invite is still unopened. Returns rows changed.
     */
    /** Whole days an invite sent at {@code sentAt} has left (at least 1: the reminder only goes out while it is still open). */
    static long daysLeft(LocalDateTime sentAt) {
        if (sentAt == null) return RecruiterInviteService.TTL_DAYS;
        long used = java.time.temporal.ChronoUnit.DAYS.between(sentAt.toLocalDate(), LocalDateTime.now().toLocalDate());
        return Math.max(1, RecruiterInviteService.TTL_DAYS - used);
    }

    private int rotateInvite(Long recruiterLeadId, String oldHash, String newHash, LocalDateTime sentAt, boolean reminder) {
        var q = new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("id", recruiterLeadId)
                .addValue("old", oldHash).addValue("new", newHash).addValue("now", LocalDateTime.now()).addValue("sent", sentAt);
        String same = oldHash == null ? "invite_token_hash IS NULL" : "invite_token_hash = :old";
        return reminder
                ? jdbc.update("UPDATE recruiter_lead SET invite_token_hash = :new, invite_reminder_sent_at = :now WHERE id = :id AND " + same + " AND invite_clicked_at IS NULL", q)
                : jdbc.update("UPDATE recruiter_lead SET invite_token_hash = :new, invite_sent_at = :sent, invite_clicked_at = NULL WHERE id = :id AND " + same, q);
    }

    /** Derived stage, computed from facts — never stored. */
    public String derivedStage(RecruiterLead recruiterLead) {
        if ("NOT_NOW".equals(recruiterLead.getManualStage())) return "NOT_NOW";
        boolean hasDrive = jobRepository.findByCollegeIdAndIsDeletedFalse(recruiterLead.getCollegeId()).stream()
                .anyMatch(j -> recruiterLead.getCompanyName() != null && recruiterLead.getCompanyName().equalsIgnoreCase(j.getCompanyName()));
        if (hasDrive) return "DRIVE_PLANNED";
        if (recruiterLead.getRecruiterId() != null) return "JOINED";
        if (recruiterLead.getInviteClickedAt() != null || recruiterLead.getInviteSentAt() != null) return "INVITED";
        return recruiterLead.getManualStage();
    }

    public List<RecruiterLead> board(Integer collegeId) {
        return recruiterLeadRepository.findByCollegeIdOrderByUpdatedAtDesc(collegeId);
    }

    public static String sha256Hex(String value) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
