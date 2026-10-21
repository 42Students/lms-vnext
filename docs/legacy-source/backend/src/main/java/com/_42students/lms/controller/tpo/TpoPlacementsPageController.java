package com._42students.lms.controller.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.PlacementsPageService;
import com._42students.lms.util.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** The college's public placements page settings (D2 default). Under /api/v1/tpo. */
@RestController
@RequestMapping("/api/v1/tpo/placements-page")
@RequiredArgsConstructor
public class TpoPlacementsPageController {

    private final PlacementsPageService pages;
    private final SecurityContextUtil securityContextUtil;

    public static class Body {
        public Boolean enabled;
        public String about;
        public List<String> numbers;
    }

    @GetMapping
    public Map<String, Object> settings() {
        return pages.settings(securityContextUtil.getAuthenticatedUserPrincipal().getCollegeId());
    }

    @PutMapping
    public Map<String, Object> save(@RequestBody Body b) {
        UserPrincipal me = securityContextUtil.getAuthenticatedUserPrincipal();
        return pages.save(me.getCollegeId(), b == null ? null : b.enabled, b == null ? null : b.about, b == null ? null : b.numbers, me.getId());
    }
}
