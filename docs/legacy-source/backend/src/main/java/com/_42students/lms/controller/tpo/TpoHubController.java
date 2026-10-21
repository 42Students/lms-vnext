package com._42students.lms.controller.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.*;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * The rest of the TPO product surface (TPO V1 - Locked.docx §2-§9): Home, Calendar, Reports, RecruiterLeads table/page/companies,
 * scheduling, drive day, Messages, Share, Team and Settings. Every id from the client is resolved to the caller's
 * college first; not-found and not-yours answer the same.
 */
@RestController
@RequestMapping("/api/v1/tpo")
@RequiredArgsConstructor
public class TpoHubController {

    private final TpoInsightsService insights;
    private final TpoRecruiterLeadsHubService recruiterLeads;
    private final TpoScheduleService schedule;
    private final TpoMessagesService messages;
    private final TpoShareService share;
    private final TpoTeamService team;
    private final TpoSettingsHubService settings;
    private final TpoSeasonService seasons;
    private final TpoAuditService audit;
    private final TpoAccessGuard guard;
    private final TpoMailService mail;
    private final TpoRecruiterLeadService recruiterLeadService;
    private final SecurityContextUtil securityContextUtil;
    private final JobTypeService jobTypes;
    private final PlacementOutcomeService outcomes;
    private final AcademicMarksService academicMarks;
    private final TpoTeamThreadService teamThreads;

    private UserPrincipal p() { return securityContextUtil.getAuthenticatedUserPrincipal(); }
    private Integer college() { return p().getCollegeId(); }

    // ---------------------------------------------------------------- home / calendar / reports
    @GetMapping("/home")
    public Map<String, Object> home(@RequestParam(defaultValue = "false") boolean team, @RequestParam(required = false) Long seasonId) {
        if (seasonId != null) guard.requireSeason(p(), seasonId);
        Map<String, Object> out = new java.util.LinkedHashMap<>(insights.home(college(), p().getId(), team, seasonId));
        // Team module V1: asks on you and mentions you haven't seen are your own; an overdue ask is the most urgent thing on Home.
        Map<String, Object> mine = teamThreads.summary(college(), p().getId());
        out.put("team", mine);
        Object open = mine.get("asksOpen");
        if (open instanceof Number n && n.intValue() > 0) {
            boolean overdue = ((Number) mine.getOrDefault("asksOverdue", 0)).intValue() > 0;
            List<Map<String, Object>> cards = new java.util.ArrayList<>((List<Map<String, Object>>) out.getOrDefault("needsYou", List.of()));
            Map<String, Object> card = new java.util.LinkedHashMap<>();
            card.put("type", "TEAM_ASKS");
            card.put("title", overdue ? "An ask from your team is overdue" : (n.intValue() == 1 ? "Your team asked you something" : "Your team asked you " + n.intValue() + " things"));
            card.put("count", n.intValue());
            card.put("link", "/tpo/team?filter=me");
            card.put("priority", overdue ? 0 : 1);
            cards.add(card);
            out.put("needsYou", cards);
        }
        return out;
    }

    @GetMapping("/calendar")
    public List<Map<String, Object>> calendar(@RequestParam String from, @RequestParam String to) {
        return insights.calendar(college(), LocalDate.parse(from), LocalDate.parse(to), true);
    }

    @GetMapping("/calendar/blocked-check")
    public Map<String, Object> blockedCheck(@RequestParam String date) {
        return insights.blockedCheck(college(), LocalDate.parse(date));
    }

    @GetMapping("/reports")
    public List<String> reportList() { return TpoInsightsService.REPORTS; }

    @GetMapping("/reports/{name}")
    public Map<String, Object> report(@PathVariable String name, @RequestParam(required = false) Long seasonId, @RequestParam(required = false) String batch,
                                      @RequestParam(required = false) String branch, @RequestParam(required = false) String company,
                                      @RequestParam(required = false) String mode, @RequestParam(required = false) String category,
                                      @RequestParam(required = false) Long batchId) {
        if (seasonId != null) guard.requireSeason(p(), seasonId);
        return insights.report(college(), name, seasonId, batch, branch, company, mode, category, batchId);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats(@RequestParam(required = false) Long seasonId) {
        if (seasonId != null) guard.requireSeason(p(), seasonId);
        return insights.stats(college(), seasonId);
    }

    /** Which email templates are live, so Settings and the invite/share dialogs can say honestly what will and will not be sent. */
    public static final List<String> MAIL_TEMPLATES = List.of("share-link", "share-code", "recruiter-welcome", "recruiter-invite", "recruiter-invite-reminder", "recruiter-request-decision", "recruiter-message", "recruiter-offer-lapsed", "shortlist-due-tomorrow",
            "recruiter-campaign", "round-scheduled", "round-reminder");

    @GetMapping("/mail-status")
    public Map<String, Object> mailStatus() {
        Map<String, Boolean> m = new java.util.LinkedHashMap<>();
        for (String n : MAIL_TEMPLATES) m.put(n, mail.isConfigured(n));
        return Map.of("templates", m);
    }

    public static class BulkInvite { public List<Long> recruiterLeadIds; public String note; }

    /** Invite many recruiter leads by email in one go (the import's "invite all with an email"). Links are never returned; only counts. */
    @PostMapping("/recruiter-leads-hub/bulk/invite")
    public Map<String, Object> bulkInvite(@RequestBody BulkInvite r, javax.servlet.http.HttpServletRequest http) {
        if (r.recruiterLeadIds == null || r.recruiterLeadIds.isEmpty()) throw new IllegalArgumentException("Choose at least one recruiter");
        String origin = http.getHeader("Origin");
        int emailed = 0, skipped = 0;
        for (Long id : new java.util.LinkedHashSet<>(r.recruiterLeadIds)) {
            guard.requireRecruiterLead(p(), id);
            try {
                Map<String, Object> out = recruiterLeadService.invite(id, true, r.note, origin);
                if (Boolean.TRUE.equals(out.get("emailed"))) emailed++; else skipped++;
            } catch (IllegalStateException e) {
                skipped++; // already joined or asked not to be contacted
            }
        }
        audit.log(college(), "TPO", p().getId(), "RECRUITER_LEADS_INVITED_BY_EMAIL", "RECRUITER_LEAD", null, emailed + " emailed, " + skipped + " skipped");
        return Map.of("emailed", emailed, "skipped", skipped);
    }

    // ---------------------------------------------------------------- recruiter leads
    public static class RecruiterLeadBulk {
        public List<Long> recruiterLeadIds; public Integer ownerFacultyId; public String stage; public String reason; public LocalDate revisitDate;
        public List<Map<String, Object>> rows;
    }

    @GetMapping("/recruiter-leads-hub/table")
    public List<Map<String, Object>> recruiterLeadTable() { return recruiterLeads.table(college()); }

    @GetMapping("/recruiter-leads-hub/{recruiterLeadId}")
    public Map<String, Object> recruiterLeadPage(@PathVariable Long recruiterLeadId) {
        guard.requireRecruiterLead(p(), recruiterLeadId);
        return recruiterLeads.detail(college(), recruiterLeadId);
    }

    @PostMapping("/recruiter-leads-hub/bulk/owner")
    public Map<String, Object> recruiterLeadOwner(@RequestBody RecruiterLeadBulk r) {
        return Map.of("updated", recruiterLeads.assignOwner(college(), r.recruiterLeadIds, r.ownerFacultyId, p().getId()));
    }

    @PostMapping("/recruiter-leads-hub/bulk/stage")
    public Map<String, Object> recruiterLeadStage(@RequestBody RecruiterLeadBulk r) {
        return Map.of("updated", recruiterLeads.setStage(college(), r.recruiterLeadIds, r.stage, r.reason, r.revisitDate, p().getId()));
    }

    /** Undo of a bulk recruiter lead action: owner and hand-set stage back as they were. rows [{ id, ownerId, manualStage, notNowReason, notNowUntil }]. */
    @PostMapping("/recruiter-leads-hub/bulk/restore")
    public Map<String, Object> recruiterLeadRestore(@RequestBody RecruiterLeadBulk r) {
        return Map.of("restored", recruiterLeads.restore(college(), r.rows, p().getId()));
    }

    /**
     * The record of one bulk action run from a list (what was picked, done, skipped, failed, undone), so the audit log says what
     * happened as one line even when the action itself is many calls.
     */
    @PostMapping("/bulk-record")
    public Map<String, Object> bulkRecord(@RequestBody Map<String, Object> body) {
        String action = String.valueOf(body.getOrDefault("action", "")).replaceAll("[\r\n\t]", " ").trim();
        if (action.isEmpty()) throw new IllegalArgumentException("Say which action");
        if (action.length() > 80) action = action.substring(0, 80);
        String detail = action + ": " + count(body, "total") + " picked, " + count(body, "done") + " done, " + count(body, "skipped") + " skipped, "
                + count(body, "failed") + " failed" + (Boolean.TRUE.equals(body.get("undone")) ? ", undone" : "");
        audit.log(college(), "TPO", p().getId(), Boolean.TRUE.equals(body.get("undone")) ? "BULK_UNDONE" : "BULK_RUN", "BULK", null, detail);
        return Map.of("ok", true);
    }

    private static int count(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v instanceof Number n ? Math.max(0, Math.min(1_000_000, n.intValue())) : 0;
    }

    @PostMapping("/recruiter-leads-hub/import/preview")
    public Map<String, Object> recruiterLeadImportPreview(@RequestBody RecruiterLeadBulk r) { return recruiterLeads.importPreview(college(), r.rows == null ? List.of() : r.rows); }

    @PostMapping("/recruiter-leads-hub/import")
    public Map<String, Object> recruiterLeadImport(@RequestBody RecruiterLeadBulk r) {
        return recruiterLeads.importCommit(college(), r.rows == null ? List.of() : r.rows, r.ownerFacultyId != null ? r.ownerFacultyId : p().getId(), p().getId());
    }

    @GetMapping("/companies")
    public List<Map<String, Object>> companies() { return recruiterLeads.companies(college()); }

    public static class CommunicationBody {
        public String name;
        public String status;
    }

    /** Engage > Companies: Not contacted, Emailed, Replied, Meeting set, Not interested (recruiter phase 1, N11). */
    @PutMapping("/companies/communication")
    public Map<String, Object> setCommunication(@RequestBody CommunicationBody body) {
        return recruiterLeads.setCommunication(college(), body == null ? null : body.name, body == null ? null : body.status, p().getId());
    }

    @GetMapping("/companies/detail")
    public Map<String, Object> company(@RequestParam String name) { return recruiterLeads.companyDetail(college(), name); }

    /** "Company Memory": past roles/CTC/hires for a company, surfaced while creating a new drive for them. */
    @GetMapping("/companies/history")
    public Map<String, Object> companyHistory(@RequestParam String name) { return recruiterLeads.companyHistory(college(), name); }

    // ---------------------------------------------------------------- scheduling
    public static class SlotsRequest { public List<Map<String, Object>> slots; }
    public static class PreviewRequest { public List<Map<String, Object>> rooms; public List<Map<String, Object>> placed; public boolean notify; }
    public static class RescheduleDecision { public String decision; public Long newSlotId; public String reply; }

    @GetMapping("/rounds/{roundId}/slots")
    public List<Map<String, Object>> slots(@PathVariable Long roundId) { guard.requireRound(p(), roundId); return schedule.slots(roundId); }

    @PostMapping("/rounds/{roundId}/slots")
    public Map<String, Object> proposeSlots(@PathVariable Long roundId, @RequestBody SlotsRequest r) {
        guard.requireRoundWritable(p(), roundId);
        return Map.of("added", schedule.proposeSlots(roundId, r.slots == null ? List.of() : r.slots, "TPO"));
    }

    @DeleteMapping("/rounds/{roundId}/slots/{slotId}")
    public Map<String, Object> deleteSlot(@PathVariable Long roundId, @PathVariable Long slotId) {
        guard.requireRoundWritable(p(), roundId);
        return Map.of("removed", schedule.deleteSlot(roundId, slotId));
    }

    /** Remove every slot nobody is booked into (undo for a wrongly generated day). */
    @DeleteMapping("/rounds/{roundId}/slots")
    public Map<String, Object> deleteUnbookedSlots(@PathVariable Long roundId) {
        guard.requireRoundWritable(p(), roundId);
        int n = schedule.deleteUnbookedSlots(roundId);
        audit.log(college(), "TPO", p().getId(), "SLOTS_CLEARED", "ROUND", roundId, n + " unbooked slots removed");
        return Map.of("removed", n);
    }

    @PostMapping("/rounds/{roundId}/slots/{slotId}/confirm")
    public Map<String, Object> confirmSlot(@PathVariable Long roundId, @PathVariable Long slotId, @RequestBody(required = false) Map<String, String> body) {
        guard.requireRoundWritable(p(), roundId);
        schedule.confirmSlot(roundId, slotId, body == null ? null : body.get("room"), college(), p().getId());
        return Map.of("ok", true);
    }

    @GetMapping("/rounds/{roundId}/candidates")
    public List<Map<String, Object>> candidates(@PathVariable Long roundId) { guard.requireRound(p(), roundId); return schedule.candidates(roundId); }

    @PostMapping("/rounds/{roundId}/assignment/preview")
    public Map<String, Object> assignmentPreview(@PathVariable Long roundId, @RequestBody PreviewRequest r) {
        guard.requireRound(p(), roundId);
        return schedule.assignmentPreview(roundId, r.rooms);
    }

    @PostMapping("/rounds/{roundId}/assignment")
    public Map<String, Object> assignmentCommit(@PathVariable Long roundId, @RequestBody PreviewRequest r) {
        guard.requireRoundWritable(p(), roundId);
        return Map.of("saved", schedule.commitAssignment(roundId, r.placed == null ? List.of() : r.placed, r.notify, college(), p().getId()));
    }

    @GetMapping("/rounds/{roundId}/assignment")
    public List<Map<String, Object>> assignments(@PathVariable Long roundId) { guard.requireRound(p(), roundId); return schedule.assignments(roundId); }

    @GetMapping("/rounds/{roundId}/reschedule-requests")
    public List<Map<String, Object>> rescheduleRequests(@PathVariable Long roundId) { guard.requireRound(p(), roundId); return schedule.rescheduleRequests(roundId); }

    @PostMapping("/reschedule-requests/{requestId}/decide")
    public Map<String, Object> decideReschedule(@PathVariable Long requestId, @RequestBody RescheduleDecision d) {
        guard.requireNative(p(), "select j.college_id from reschedule_request q join job_round r on r.id = q.round_id join job j on j.id = r.job_id where q.id = :id", requestId);
        schedule.decideReschedule(requestId, d.decision, d.newSlotId, d.reply, college(), p().getId());
        return Map.of("ok", true);
    }

    /** Who am I on the placement team? The frontend uses this to decide whether to show the Placement cell link. */
    @GetMapping("/my-access")
    public Map<String, Object> myAccess() {
        String role = team.roleOf(p());
        return Map.of("role", role == null ? "" : role);
    }

    // ---------------------------------------------------------------- drive day (the placement cell)
    public static class MarkRequest { public Integer applicationId; public String status; public String room; }

    /** Today's on-campus rounds of the college. */
    @GetMapping("/drive-day/mine")
    public List<Map<String, Object>> driveDayMine() {
        return schedule.driveDayRounds(p().getCollegeId());
    }

    @GetMapping("/drive-day/{roundId}/roster")
    public Map<String, Object> roster(@PathVariable Long roundId) {
        guard.requireRound(p(), roundId);
        return schedule.roster(roundId);
    }

    @GetMapping("/drive-day/{roundId}/search")
    public List<Map<String, Object>> search(@PathVariable Long roundId, @RequestParam String q) {
        guard.requireRound(p(), roundId);
        return schedule.search(roundId, q);
    }

    @PostMapping("/drive-day/{roundId}/mark")
    public Map<String, Object> mark(@PathVariable Long roundId, @RequestBody MarkRequest r) {
        guard.requireRound(p(), roundId);
        String role = team.roleOf(p());
        schedule.mark(roundId, r.applicationId, r.status, r.room, p().getId(), role, college());
        return Map.of("ok", true);
    }

    // ---------------------------------------------------------------- messages
    public static class SendMessage { public Long recruiterId; public Integer jobId; public String body; public Long changeRequestId; }

    /** Changes whenever the college's conversations change; the Messages screens poll it while open (live conversations). */
    @GetMapping("/messages/pulse")
    public Map<String, Object> pulse() { return Map.of("version", messages.pulse(college(), null)); }

    @GetMapping("/messages/threads")
    public List<Map<String, Object>> threads(@RequestParam(required = false) Integer jobId) {
        if (jobId != null) guard.requireJob(p(), jobId);
        return messages.threadsForTpo(college(), jobId);
    }

    @GetMapping("/messages/threads/{threadId}")
    public List<Map<String, Object>> thread(@PathVariable Long threadId) { return messages.messages(college(), threadId, "TPO"); }

    @PostMapping("/messages")
    public Map<String, Object> send(@RequestBody SendMessage r) {
        if (r.jobId != null) guard.requireJobWritable(p(), r.jobId);
        return Map.of("threadId", messages.send(college(), r.recruiterId, r.jobId, "TPO", p().getId(), r.body, r.changeRequestId));
    }

    // ---------------------------------------------------------------- share
    public static class ShareRequest { public String recipientEmail; public List<String> columns; public String maxStage; public LocalDateTime shortlistBy; public boolean emailLink; }

    @GetMapping("/drives/{jobId}/shares")
    public List<Map<String, Object>> shares(@PathVariable Integer jobId) { guard.requireJob(p(), jobId); return share.listForDrive(jobId); }

    @PostMapping("/drives/{jobId}/shares")
    public Map<String, Object> createShare(@PathVariable Integer jobId, @RequestBody ShareRequest r, javax.servlet.http.HttpServletRequest http) {
        guard.requireJobWritable(p(), jobId);
        // The link in the email points at the site the TPO is using. CORS already limits Origin to our own sites.
        String origin = http.getHeader("Origin");
        return share.create(college(), jobId, r.recipientEmail, r.columns, r.maxStage, r.shortlistBy, p().getId(), r.emailLink, origin);
    }

    @GetMapping("/shares/{shareId}/events")
    public List<Map<String, Object>> shareEvents(@PathVariable Long shareId) {
        guard.requireNative(p(), "select college_id from tpo_share_link where id = :id", shareId);
        return share.events(shareId);
    }

    @PostMapping("/shares/{shareId}/revoke")
    public Map<String, Object> revokeShare(@PathVariable Long shareId) {
        guard.requireNative(p(), "select college_id from tpo_share_link where id = :id", shareId);
        share.revoke(shareId, college(), p().getId());
        return Map.of("ok", true);
    }

    // ---------------------------------------------------------------- team
    public static class MemberRequest { public Integer facultyId; public String role; public Integer reassignTo; }

    @GetMapping("/team")
    public Map<String, Object> teamList() {
        return Map.of("members", team.team(college()), "myRole", team.roleOf(p()) == null ? "" : team.roleOf(p()),
                "accounts", team.collegeAccounts(college()), "me", p().getId());
    }

    @GetMapping("/team/directory")
    public List<Map<String, Object>> directory(@RequestParam(required = false) String q) { return team.facultyDirectory(college(), q); }

    @PostMapping("/team")
    public Map<String, Object> setMember(@RequestBody MemberRequest r) {
        team.setMember(college(), r.facultyId, r.role, p().getId());
        return Map.of("ok", true);
    }

    @GetMapping("/team/{facultyId}/removal-impact")
    public Map<String, Object> impact(@PathVariable Integer facultyId) { return team.removalImpact(college(), facultyId); }

    @PostMapping("/team/{facultyId}/remove")
    public Map<String, Object> removeMember(@PathVariable Integer facultyId, @RequestBody(required = false) MemberRequest r) {
        team.removeMember(college(), facultyId, r == null ? null : r.reassignTo, p().getId());
        return Map.of("ok", true);
    }

    // ---------------------------------------------------------------- settings
    public static class SeasonUpdate {
        public String name; public LocalDate startDate; public LocalDate endDate; public LocalDateTime registrationDeadline; public List<Map<String, Object>> blockedDates;
    }
    public static class ViewRequest { public String scope; public String name; public Object filters; }
    public static class ViewUpdate { public String name; public Boolean pinned; public Object filters; }

    /** The top bar's season selector (any TPO admin; the season settings themselves live under /settings). */
    @GetMapping("/lens/seasons")
    public List<Map<String, Object>> seasonLens() { return settings.seasonLens(college()); }

    @GetMapping("/settings/seasons")
    public List<Map<String, Object>> seasonList() { return settings.seasons(college()); }

    @PutMapping("/settings/seasons/{seasonId}")
    public Map<String, Object> updateSeason(@PathVariable Long seasonId, @RequestBody SeasonUpdate r) {
        guard.requireSeason(p(), seasonId);
        settings.updateSeason(college(), seasonId, r.name, r.startDate, r.endDate, r.registrationDeadline, r.blockedDates, p().getId());
        return Map.of("ok", true);
    }

    /** Settings > Job types: the five built-in types and the college's own, with how many drives use each. */
    @GetMapping("/settings/job-types")
    public List<Map<String, Object>> jobTypes() { return jobTypes.list(college()); }

    @PutMapping("/settings/job-types")
    public List<Map<String, Object>> saveJobTypes(@RequestBody List<Map<String, Object>> body) { return jobTypes.save(college(), body, p().getId()); }

    /** Settings > Placement rules: how a CGPA counts as a percentage (and the choices). */
    @GetMapping("/settings/cgpa-rule")
    public Map<String, Object> cgpaRule() { return academicMarks.ruleView(college()); }

    /** Changing the rule recomputes every student's comparable percentage from their marks as earned. */
    @PutMapping("/settings/cgpa-rule")
    public Map<String, Object> saveCgpaRule(@RequestBody Map<String, String> body) {
        int changed = academicMarks.saveRule(college(), body.get("rule"), p().getId());
        Map<String, Object> out = new java.util.LinkedHashMap<>(academicMarks.ruleView(college()));
        out.put("recomputed", changed);
        return out;
    }

    /** Settings > Placement outcomes: the college's own labels, each under one fixed outcome. */
    @GetMapping("/settings/outcome-labels")
    public List<Map<String, Object>> outcomeLabels() { return outcomes.labels(college()); }

    @PutMapping("/settings/outcome-labels")
    public List<Map<String, Object>> saveOutcomeLabels(@RequestBody List<Map<String, Object>> body) { return outcomes.saveLabels(college(), body, p().getId()); }

    @GetMapping("/settings/college")
    public Map<String, Object> collegeSettings() { return settings.college(college()); }

    @PutMapping("/settings/college")
    public Map<String, Object> saveCollegeSettings(@RequestBody Map<String, Object> body) {
        settings.saveCollege(college(), body, p().getId());
        return Map.of("ok", true);
    }

    @GetMapping("/my-preferences")
    public Map<String, Object> myPrefs() { return settings.myPrefs(p().getId()); }

    @PutMapping("/my-preferences")
    public Map<String, Object> saveMyPrefs(@RequestBody Map<String, Object> body) { settings.saveMyPrefs(p().getId(), body); return Map.of("ok", true); }

    @GetMapping("/views")
    public List<Map<String, Object>> views(@RequestParam String scope) { return settings.views(college(), p().getId(), scope); }

    @PostMapping("/views")
    public Map<String, Object> saveView(@RequestBody ViewRequest r) { settings.saveView(college(), p().getId(), r.scope, r.name, r.filters); return Map.of("ok", true); }

    /** Rename, pin/unpin, or replace the filters of one of my views. */
    @PatchMapping("/views/{id}")
    public Map<String, Object> updateView(@PathVariable Long id, @RequestBody ViewUpdate r) {
        settings.updateView(college(), p().getId(), id, r.name, r.pinned, r.filters);
        return Map.of("ok", true);
    }

    @PostMapping("/views/{id}/used")
    public Map<String, Object> markViewUsed(@PathVariable Long id) { settings.markViewUsed(college(), p().getId(), id); return Map.of("ok", true); }

    @DeleteMapping("/views/{id}")
    public Map<String, Object> deleteView(@PathVariable Long id) { settings.deleteView(college(), p().getId(), id); return Map.of("ok", true); }

    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam String q) { return insights.search(college(), q); }
}
