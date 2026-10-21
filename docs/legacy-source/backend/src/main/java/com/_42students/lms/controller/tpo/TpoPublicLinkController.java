package com._42students.lms.controller.tpo;

import com._42students.lms.service.tpo.CollegePublicLinkService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** The college's public link for recruiters and whether those who join through it post directly (N5 a, N6). Under /api/v1/tpo. */
@RestController
@RequestMapping("/api/v1/tpo/public-link")
@RequiredArgsConstructor
public class TpoPublicLinkController {

    private final CollegePublicLinkService links;
    private final SecurityContextUtil securityContextUtil;

    public static class SettingsBody {
        public Boolean enabled;
        public Boolean postDirect;
    }

    private Integer college() {
        Integer c = securityContextUtil.getAuthenticatedUserPrincipal().getCollegeId();
        if (c == null) throw new IllegalArgumentException("Not found");
        return c;
    }

    private Integer me() {
        return securityContextUtil.getAuthenticatedUserPrincipal().getId();
    }

    @GetMapping
    public Map<String, Object> settings() {
        return links.settings(college());
    }

    @PostMapping("/new")
    public Map<String, Object> newLink() {
        return links.newLink(college(), me());
    }

    @PutMapping
    public Map<String, Object> save(@RequestBody SettingsBody b) {
        return links.save(college(), b == null ? null : b.enabled, b == null ? null : b.postDirect, me());
    }
}
