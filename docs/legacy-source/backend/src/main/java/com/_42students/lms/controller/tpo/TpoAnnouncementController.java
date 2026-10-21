package com._42students.lms.controller.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.PlacementAnnouncementService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Announcements for the placement cell (N12): what it tells its students, and what 42 tells placement cells. Under /api/v1/tpo. */
@RestController
@RequestMapping("/api/v1/tpo/announcements")
@RequiredArgsConstructor
public class TpoAnnouncementController {

    private final PlacementAnnouncementService announcements;
    private final SecurityContextUtil securityContextUtil;

    private UserPrincipal p() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    /** Announcements V2 (docs/tpo-announcements/ANNOUNCEMENTS-V2-2026-10-12.md): the cell's own, with audience, state, reach and reads. */
    @GetMapping
    public List<Map<String, Object>> mine() {
        return announcements.forCollegeStudents(p().getCollegeId());
    }

    /** The composer's pickers: batches, branches, drives, and whether email is set up. */
    @GetMapping("/audiences")
    public Map<String, Object> audiences() {
        return announcements.audiences(p().getCollegeId());
    }

    /** Who an audience reaches now, before sending. */
    @PostMapping("/preview")
    public Map<String, Object> preview(@RequestBody PlacementAnnouncementService.Audience a) {
        return announcements.preview(p().getCollegeId(), a);
    }

    @PostMapping
    public Map<String, Object> post(@RequestBody PlacementAnnouncementService.Draft d) {
        UserPrincipal me = p();
        return announcements.postToStudents(me.getCollegeId(), d, new PlacementAnnouncementService.Author("FACULTY", me.getId()));
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable long id, @RequestBody PlacementAnnouncementService.Draft d) {
        return announcements.update(p().getCollegeId(), id, d);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable long id) {
        announcements.delete(p().getCollegeId(), id);
        return Map.of("status", "DELETED");
    }

    /** Within 30 seconds of sending: take it back before the notices go. */
    @PostMapping("/{id}/undo")
    public Map<String, Object> undo(@PathVariable long id) {
        announcements.undo(p().getCollegeId(), id);
        return Map.of("status", "UNDONE");
    }

    @GetMapping("/{id}/unread")
    public List<Map<String, Object>> unreadBy(@PathVariable long id) {
        return announcements.unreadBy(p().getCollegeId(), id);
    }

    @PostMapping("/{id}/remind")
    public Map<String, Object> remind(@PathVariable long id) {
        return announcements.remind(p().getCollegeId(), id);
    }

    /** What 42 told placement cells; opening the list marks them read for this person. */
    @GetMapping("/from-42")
    public List<Map<String, Object>> from42() {
        UserPrincipal me = p();
        List<Map<String, Object>> rows = announcements.from42(me.getCollegeId(), me.getId());
        announcements.markRead("FACULTY", me.getId(), PlacementAnnouncementService.ids(rows));
        return rows;
    }

    @GetMapping("/from-42/unread")
    public Map<String, Object> unreadFrom42() {
        return Map.of("unread", announcements.unreadFrom42(p().getCollegeId(), p().getId()));
    }
}
