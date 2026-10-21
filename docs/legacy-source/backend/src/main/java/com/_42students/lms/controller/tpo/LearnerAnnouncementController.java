package com._42students.lms.controller.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.PlacementAnnouncementService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** A student's placement announcements (N12), from their own college's placement cell only. Opening them marks them read. */
@RestController
@RequestMapping("/api/v1/learner/placement/announcements")
@RequiredArgsConstructor
public class LearnerAnnouncementController {

    private final PlacementAnnouncementService announcements;
    private final SecurityContextUtil securityContextUtil;

    /** The student's announcements (theirs, or for all students; sent and not ended). Opening the list marks them read. */
    @GetMapping
    public List<Map<String, Object>> list() {
        UserPrincipal me = securityContextUtil.getAuthenticatedUserPrincipal();
        if (!"LEARNER".equals(me.getUserType())) return List.of();
        List<Map<String, Object>> rows = announcements.forStudent(me.getCollegeId(), me.getId());
        announcements.markRead("LEARNER", me.getId(), PlacementAnnouncementService.ids(rows));
        return rows;
    }

    /** The count on the Announcements tab. */
    @GetMapping("/unread")
    public Map<String, Object> unread() {
        UserPrincipal me = securityContextUtil.getAuthenticatedUserPrincipal();
        if (!"LEARNER".equals(me.getUserType())) return Map.of("unread", 0);
        return Map.of("unread", announcements.unreadForStudent(me.getCollegeId(), me.getId()));
    }
}
